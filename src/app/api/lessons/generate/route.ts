import { newId } from "@/lib/lesson/edit";
import { GenerationError, type GenerationErrorCode, type GenerationEvent } from "@/lib/generation/events";
import { generationInputSchema } from "@/lib/generation/input";
import { generateLesson } from "@/lib/generation/pipeline";
import { sampleLesson } from "@/lib/generation/sample";
import { createClaudeClient } from "@/lib/generation/server/claude";
import { generationConfig } from "@/lib/generation/server/config";
import { checkDailyCap, checkVisitorLimit, recordGeneration } from "@/lib/generation/server/limits";

/** Three model calls with possible repairs can take a few minutes. */
export const maxDuration = 300;

/** Topic, settings and up to 20,000 characters of reference text, with headroom for JSON escaping. */
const MAX_BODY_BYTES = 64_000;
const HOUR_MS = 60 * 60 * 1000;

function errorResponse(status: number, code: GenerationErrorCode, message: string, headers?: HeadersInit) {
  return Response.json({ error: { code, message } }, { status, headers });
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

  if (config.mode === "live") {
    const limit = checkVisitorLimit(visitor, config.hourlyLimitPerVisitor, HOUR_MS);
    const cap = limit.ok ? checkDailyCap(config.dailyCap) : limit;
    if (!cap.ok) {
      return errorResponse(429, "rate_limited", cap.message, { "Retry-After": String(cap.retryAfterSeconds) });
    }
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
            model: config.model,
            effort: config.effort,
            signal: request.signal,
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
        emit({ type: "error", code: known.code, message: known.message });
      } finally {
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
