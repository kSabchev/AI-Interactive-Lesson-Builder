import "server-only";
import type { GenerationMode } from "../events";

export type Effort = "low" | "medium" | "high" | "xhigh" | "max";

export type GenerationConfig = {
  mode: GenerationMode;
  apiKey: string | undefined;
  model: string;
  effort: Effort;
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
    model: env.GENERATION_MODEL || "claude-opus-5-5",
    effort,
    hourlyLimitPerVisitor: positiveInt(env.GENERATION_HOURLY_LIMIT, 5),
    dailyCap: positiveInt(env.GENERATION_DAILY_CAP, 50),
  };
}
