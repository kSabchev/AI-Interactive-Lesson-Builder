import { generationCost } from "@/lib/billing/plans";
import { type Dictionary, getDictionary, intlLocale } from "@/lib/i18n";
import { localeFromRequest } from "@/lib/i18n/server";
import { newId } from "@/lib/lesson/edit";
import { GenerationError, type GenerationErrorCode, type GenerationEvent } from "@/lib/generation/events";
import { generationInputSchema, inputIssueMessage } from "@/lib/generation/input";
import { generateLesson } from "@/lib/generation/pipeline";
import { sampleLesson } from "@/lib/generation/sample";
import { createClaudeClient, type UsageReport } from "@/lib/generation/server/claude";
import { generationConfig } from "@/lib/generation/server/config";
import {
  checkDailyCap,
  checkVisitorLimit,
  dailyCountNeedsSeed,
  recordGeneration,
  seedDailyCount,
} from "@/lib/generation/server/limits";
import { getSessionUser } from "@/lib/server/auth";
import { getEntitlements, releaseGenerations, reserveGenerations } from "@/lib/server/billing/account";
import { getDb } from "@/lib/server/db";
import { countLiveGenerationsSince, type GenerationRecord, saveGenerationLog } from "@/lib/server/generationLog";
import { detectLanguage } from "@/lib/i18n/detect";

/** Three model calls with possible repairs can take a few minutes. */
export const maxDuration = 300;

/** Topic, settings and up to 20,000 characters of reference text, with headroom for JSON escaping. */
const MAX_BODY_BYTES = 64_000;
const HOUR_MS = 60 * 60 * 1000;

/** Failures caused by the service rather than the request; their generations are given back. */
const REFUNDABLE: GenerationErrorCode[] = ["busy", "unavailable", "invalid_output"];

/** The user-facing message for a failure raised while generating, in the requester's language. */
function streamErrorMessage(code: GenerationErrorCode, t: Dictionary): string {
  switch (code) {
    case "refused":
    case "invalid_output":
    case "busy":
    case "unavailable":
      return t.generation.errors[code];
    default:
      return t.generation.errors.unexpected;
  }
}

function errorResponse(status: number, code: GenerationErrorCode, message: string, headers?: HeadersInit) {
  return Response.json({ error: { code, message } }, { status, headers });
}

/** Stores the request and its model calls for quotas, cost reporting and the generation log. Never fails the generation. */
async function recordUsage(record: GenerationRecord) {
  try {
    await saveGenerationLog(await getDb(), record);
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
  const locale = localeFromRequest(request);
  const t = getDictionary(locale);
  const errors = t.generation.errors;
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return errorResponse(413, "invalid_input", errors.too_large);
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return errorResponse(400, "invalid_input", errors.unreadable);
  }
  const parsed = generationInputSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return errorResponse(400, "invalid_input", issue ? inputIssueMessage(issue, t) : errors.invalid_input);
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
      return errorResponse(401, "sign_in_required", errors.sign_in_required);
    }
    const db = await getDb();
    const entitlements = await getEntitlements(db, userId);
    const { plan } = entitlements;
    const planName = t.pricing.plans[plan.id].name;
    if (input.referenceText && !plan.referenceText) {
      return errorResponse(403, "upgrade_required", errors.reference_pro);
    }
    if (input.research && !input.referenceText && !config.webResearch) {
      return errorResponse(403, "upgrade_required", errors.research_off);
    }
    if (input.research && !input.referenceText && !plan.webResearch) {
      return errorResponse(403, "upgrade_required", errors.research_pro);
    }
    if (input.quality === "high" && !plan.highQuality) {
      return errorResponse(403, "upgrade_required", errors.high_pro);
    }
    // Don't spend a generation on a lesson the account couldn't save.
    if (plan.savedLessons !== null && entitlements.savedLessons >= plan.savedLessons) {
      return errorResponse(403, "upgrade_required", errors.library_full(planName, plan.savedLessons));
    }

    if (dailyCountNeedsSeed()) {
      const now = new Date();
      const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      seedDailyCount(await countLiveGenerationsSince(db, midnight), now);
    }
    const limit = checkVisitorLimit(visitor, config.hourlyLimitPerVisitor, HOUR_MS);
    const cap = limit.ok ? checkDailyCap(config.dailyCap) : limit;
    if (!cap.ok) {
      const message = cap.reason === "visitor" ? errors.rate_limited_visitor(cap.limit) : errors.rate_limited_daily;
      return errorResponse(429, "rate_limited", message, { "Retry-After": String(cap.retryAfterSeconds) });
    }

    if (!(await reserveGenerations(db, userId, cost, plan.generationsPerMonth, entitlements.period))) {
      const resets = new Intl.DateTimeFormat(intlLocale(locale), {
        day: "numeric",
        month: "long",
        timeZone: "UTC",
      }).format(new Date(entitlements.resetsAt));
      const message =
        entitlements.remaining > 0
          ? errors.quota_partial(cost, entitlements.remaining, resets)
          : errors.quota_used(plan.generationsPerMonth, planName, resets);
      return errorResponse(429, "quota_exceeded", message);
    }
    reserved = { userId, period: entitlements.period };
    recordGeneration(visitor);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const startedAt = Date.now();
      let lessonTitle: string | null = null;
      let researchFallback = false;
      const emit = (event: GenerationEvent) => {
        if (event.type === "research_fallback") researchFallback = true;
        if (event.type === "done") lessonTitle = event.lesson.title;
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
          const { lesson, notice } = sampleLesson(input, id, now, t);
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
        const known = error instanceof GenerationError ? error : new GenerationError("unavailable", "unexpected");
        if (!(error instanceof GenerationError)) console.error("[generation] unexpected failure:", error);
        outcome = known.code;
        if (reserved && REFUNDABLE.includes(known.code)) {
          await releaseGenerations(await getDb(), reserved.userId, cost, reserved.period).catch((e) =>
            console.error("[generation] couldn't refund quota:", e),
          );
        }
        emit({
          type: "error",
          code: known.code,
          message: error instanceof GenerationError ? streamErrorMessage(known.code, t) : errors.unexpected,
        });
      } finally {
        await recordUsage({
          userId,
          mode: config.mode,
          status: outcome,
          lessonId: id,
          lessonTitle,
          topic: input.topic,
          ageGroup: input.ageGroup,
          language: detectLanguage(input.topic),
          quality: input.quality,
          evidence: input.referenceText ? "reference" : input.research ? (researchFallback ? "web-fallback" : "web") : "none",
          durationMs: Date.now() - startedAt,
          calls: usage,
        });
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
