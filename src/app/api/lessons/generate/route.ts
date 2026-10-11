import { generationCost, PLANS } from "@/lib/billing/plans";
import { newId } from "@/lib/lesson/edit";
import { GenerationError, type GenerationErrorCode, type GenerationEvent } from "@/lib/generation/events";
import { generationInputSchema } from "@/lib/generation/input";
import { generateLesson } from "@/lib/generation/pipeline";
import { sampleLesson } from "@/lib/generation/sample";
import { createClaudeClient, type UsageReport } from "@/lib/generation/server/claude";
import { generationConfig } from "@/lib/generation/server/config";
import { checkDailyCap, checkVisitorLimit, recordGeneration } from "@/lib/generation/server/limits";
import { getSessionUser } from "@/lib/server/auth";
import { getEntitlements, releaseGenerations, reserveGenerations } from "@/lib/server/billing/account";
import { getDb } from "@/lib/server/db";
import { generationUsage } from "@/lib/server/db/schema";

/** Three model calls with possible repairs can take a few minutes. */
export const maxDuration = 300;

/** Topic, settings and up to 20,000 characters of reference text, with headroom for JSON escaping. */
const MAX_BODY_BYTES = 64_000;
const HOUR_MS = 60 * 60 * 1000;

/** Failures caused by the service rather than the request; their generations are given back. */
const REFUNDABLE: GenerationErrorCode[] = ["busy", "unavailable", "invalid_output", "no_sources"];

const monthDay = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone: "UTC" });

function errorResponse(status: number, code: GenerationErrorCode, message: string, headers?: HeadersInit) {
  return Response.json({ error: { code, message } }, { status, headers });
}

/** Stores one usage row per request for plan quotas and cost reporting. Never fails the generation. */
async function recordUsage(
  userId: string | null,
  mode: string,
  status: "succeeded" | GenerationErrorCode,
  reports: UsageReport[],
) {
  try {
    const db = await getDb();
    await db.insert(generationUsage).values({
      userId,
      mode,
      model: reports.at(-1)?.model ?? null,
      status,
      inputTokens: reports.reduce((sum, r) => sum + r.inputTokens, 0),
      outputTokens: reports.reduce((sum, r) => sum + r.outputTokens, 0),
      estimatedUsd: reports.reduce((sum, r) => sum + r.estimatedUsd, 0).toFixed(4),
    });
  } catch (error) {
    console.error("[generation] couldn't record usage:", error);
  }
}

async function currentUserId(request: Request): Promise<string | null> {
  try {
    return (await getSessionUser(request.headers))?.id ?? null;
  } catch {
    return null;
  }
}

function visitorKey(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return errorResponse(413, "invalid_input", "That request is too large. Shorten the reference text and try again.");
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return errorResponse(400, "invalid_input", "The request couldn't be read.");
  }
  const parsed = generationInputSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(400, "invalid_input", parsed.error.issues[0]?.message ?? "Check the form and try again.");
  }
  const input = parsed.data;

  const config = generationConfig();
  const visitor = visitorKey(request);
  const userId = await currentUserId(request);

  const cost = generationCost(input.quality);
  let reserved: { userId: string; period: string } | undefined;

  if (config.mode === "live") {
    // Quotas belong to accounts, so live AI generation needs one. Sample mode stays open to everyone.
    if (!userId) {
      return errorResponse(401, "sign_in_required", "Sign in to create AI lessons. It's free, and sample lessons work without an account.");
    }
    const db = await getDb();
    const entitlements = await getEntitlements(db, userId);
    const { plan } = entitlements;
    if (input.referenceText && !plan.referenceText) {
      return errorResponse(403, "upgrade_required", `Lessons from reference material are part of ${PLANS.pro.name}. Remove the reference text or upgrade.`);
    }
    if (input.research && !input.referenceText && !config.webResearch) {
      return errorResponse(403, "upgrade_required", "Web research isn't available on this site right now.");
    }
    if (input.research && !input.referenceText && !plan.webResearch) {
      return errorResponse(403, "upgrade_required", `Web-researched lessons are part of ${PLANS.pro.name}.`);
    }
    if (input.quality === "high" && !plan.highQuality) {
      return errorResponse(403, "upgrade_required", `High-quality generation is part of ${PLANS.pro.name}.`);
    }
    // Don't spend a generation on a lesson the account couldn't save.
    if (plan.savedLessons !== null && entitlements.savedLessons >= plan.savedLessons) {
      return errorResponse(
        403,
        "upgrade_required",
        `Your ${plan.name} plan keeps up to ${plan.savedLessons} lessons and your library is full. Delete a lesson or upgrade first.`,
      );
    }

    const limit = checkVisitorLimit(visitor, config.hourlyLimitPerVisitor, HOUR_MS);
    const cap = limit.ok ? checkDailyCap(config.dailyCap) : limit;
    if (!cap.ok) {
      return errorResponse(429, "rate_limited", cap.message, { "Retry-After": String(cap.retryAfterSeconds) });
    }

    if (!(await reserveGenerations(db, userId, cost, plan.generationsPerMonth, entitlements.period))) {
      const resets = monthDay.format(new Date(entitlements.resetsAt));
      const message =
        entitlements.remaining > 0
          ? `This needs ${cost} AI lessons but you have ${entitlements.remaining} left this month. Use standard quality, or wait until ${resets}.`
          : `You've used all ${plan.generationsPerMonth} AI lessons in your ${plan.name} plan this month. They reset on ${resets}.`;
      return errorResponse(429, "quota_exceeded", message);
    }
    reserved = { userId, period: entitlements.period };
    recordGeneration(visitor);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: GenerationEvent) => {
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          // The client went away; the abort signal stops any further model calls.
        }
      };

      const usage: UsageReport[] = [];
      let outcome: "succeeded" | GenerationErrorCode = "succeeded";
      const id = newId("lesson");
      const now = new Date().toISOString();
      emit({ type: "start", mode: config.mode });
      emit({ type: "stage", stage: "validate", status: "start" });
      emit({ type: "stage", stage: "validate", status: "done" });

      try {
        if (config.mode === "sample") {
          emit({ type: "stage", stage: "sample", status: "start" });
          const { lesson, notice } = sampleLesson(input, id, now);
          emit({ type: "stage", stage: "sample", status: "done" });
          emit({ type: "done", lesson, notice });
        } else {
          const client = createClaudeClient({
            apiKey: config.apiKey!,
            model: config.models[input.quality],
            effort: config.effort,
            signal: request.signal,
            onUsage: (report) => usage.push(report),
          });
          const lesson = await generateLesson({ input, client, emit, id });
          emit({ type: "done", lesson });
        }
      } catch (error) {
        const known =
          error instanceof GenerationError
            ? error
            : new GenerationError("unavailable", "Something went wrong while generating. Please try again.");
        if (!(error instanceof GenerationError)) console.error("[generation] unexpected failure:", error);
        outcome = known.code;
        if (reserved && REFUNDABLE.includes(known.code)) {
          await releaseGenerations(await getDb(), reserved.userId, cost, reserved.period).catch((e) =>
            console.error("[generation] couldn't refund quota:", e),
          );
        }
        emit({ type: "error", code: known.code, message: known.message });
      } finally {
        await recordUsage(userId, config.mode, outcome, usage);
        try {
          controller.close();
        } catch {
          // Already closed by a disconnect.
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
