import "server-only";
import type { GenerationQuality } from "@/lib/billing/plans";
import type { GenerationMode } from "../events";

export type Effort = "low" | "medium" | "high" | "xhigh" | "max";

export type GenerationConfig = {
  mode: GenerationMode;
  apiKey: string | undefined;
  /** Model per quality level: standard for everyday lessons, high for the "high quality" option. */
  models: Record<GenerationQuality, string>;
  effort: Effort;
  /** Whether web research may be offered (it adds search costs). */
  webResearch: boolean;
  /** Live generations allowed per visitor per hour. */
  hourlyLimitPerVisitor: number;
  /** Live generations allowed per day across all visitors; a backstop on spend. */
  dailyCap: number;
};

const EFFORTS: Effort[] = ["low", "medium", "high", "xhigh", "max"];

function positiveInt(value: string | undefined, fallback: number): number {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Read per request so a deployment's environment applies without rebuilding. */
export function generationConfig(env: NodeJS.ProcessEnv = process.env): GenerationConfig {
  const apiKey = env.ANTHROPIC_API_KEY || undefined;
  const wantsLive = env.GENERATION_MODE === "live";
  if (wantsLive && !apiKey) {
    console.warn("[generation] GENERATION_MODE=live but ANTHROPIC_API_KEY is not set; using sample mode.");
  }
  const effort = EFFORTS.find((e) => e === env.GENERATION_EFFORT) ?? "medium";

  return {
    mode: wantsLive && apiKey ? "live" : "sample",
    apiKey,
    models: {
      standard: env.GENERATION_MODEL_STANDARD || "claude-sonnet-5-5",
      high: env.GENERATION_MODEL_HIGH || "claude-opus-5-5",
    },
    effort,
    webResearch: env.GENERATION_WEB_RESEARCH !== "false",
    hourlyLimitPerVisitor: positiveInt(env.GENERATION_HOURLY_LIMIT, 5),
    dailyCap: positiveInt(env.GENERATION_DAILY_CAP, 50),
  };
}
