import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { GenerationError } from "../events";
import type { ModelClient } from "../pipeline";
import type { Effort } from "./config";

/** USD per million tokens (input, output), used only to log an estimated cost per call. */
const PRICES: Record<string, [number, number]> = {
  "claude-opus-5-5": [4, 20],
  "claude-sonnet-5-5": [2, 10],
  "claude-haiku-5-5": [0.1, 0.5],
};

/** Models that accept the server-side `fallbacks: "default"` refusal fallback. */
const FALLBACK_MODELS = new Set(["claude-opus-5-5", "claude-opus-5", "claude-fable-5-1", "claude-sonnet-5-5"]);

/** Plenty for the largest stage (all seven sections) plus thinking, while bounding the cost of a runaway reply. */
const MAX_TOKENS = 32_000;

type Usage = { input_tokens: number; output_tokens: number; cache_read_input_tokens?: number | null };

function logUsage(stage: string, model: string, usage: Usage) {
  const [inPrice, outPrice] = PRICES[model] ?? [0, 0];
  const estimatedUsd = (usage.input_tokens * inPrice + usage.output_tokens * outPrice) / 1_000_000;
  console.info(
    "[generation] usage",
    JSON.stringify({
      stage,
      model,
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      cacheReadTokens: usage.cache_read_input_tokens ?? 0,
      estimatedUsd: Number(estimatedUsd.toFixed(4)),
    }),
  );
}

export function createClaudeClient({
  apiKey,
  model,
  effort,
  signal,
}: {
  apiKey: string;
  model: string;
  effort: Effort;
  signal?: AbortSignal;
}): ModelClient {
  const anthropic = new Anthropic({ apiKey, maxRetries: 2 });

  return {
    async send({ stage, system, turns, schema }) {
      // Pass the bare JSON schema so the SDK doesn't auto-parse: the pipeline wants the raw text
      // to report problems back to the model.
      const { schema: jsonSchema } = zodOutputFormat(schema);
      const fallback = FALLBACK_MODELS.has(model);

      try {
        const stream = anthropic.beta.messages.stream(
          {
            model,
            max_tokens: MAX_TOKENS,
            system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
            messages: turns.map((turn) =>
              turn.role === "user"
                ? { role: "user" as const, content: turn.text }
                : { role: "assistant" as const, content: turn.replay as Anthropic.Beta.BetaContentBlockParam[] },
            ),
            output_config: { effort, format: { type: "json_schema", schema: jsonSchema } },
            ...(fallback ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
          },
          { signal },
        );
        const message = await stream.finalMessage();
        logUsage(stage, message.model, message.usage);

        const text = message.content
          .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === "text")
          .map((block) => block.text)
          .join("");

        return {
          text,
          replay: message.content,
          stopReason:
            message.stop_reason === "refusal"
              ? "refusal"
              : message.stop_reason === "max_tokens"
                ? "max_tokens"
                : "complete",
        };
      } catch (error) {
        throw toGenerationError(error);
      }
    },
  };
}

function toGenerationError(error: unknown): GenerationError {
  if (error instanceof GenerationError) return error;
  if (error instanceof Anthropic.APIUserAbortError) {
    return new GenerationError("unavailable", "Generation was cancelled.");
  }
  if (error instanceof Anthropic.RateLimitError || error instanceof Anthropic.InternalServerError) {
    return new GenerationError("busy", "The AI service is busy right now. Please try again in a minute.");
  }
  if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
    console.error("[generation] Anthropic credentials were rejected:", error.message);
    return new GenerationError("unavailable", "AI generation isn't available right now. Try a sample lesson instead.");
  }
  if (error instanceof Anthropic.APIError) {
    console.error(`[generation] Anthropic API error ${error.status ?? ""}:`, error.message);
    return new GenerationError("unavailable", "AI generation isn't available right now. Please try again later.");
  }
  console.error("[generation] unexpected error:", error);
  return new GenerationError("unavailable", "Something went wrong while generating. Please try again.");
}
