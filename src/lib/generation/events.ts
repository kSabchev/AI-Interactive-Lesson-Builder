import type { Lesson } from "@/lib/lesson/schema";

/** Stages the server reports while generating. The UI shows only stages it actually receives. */
export const STAGE_LABELS = {
  validate: "Checking your request",
  outline: "Preparing the outline",
  content: "Writing the lesson",
  quiz: "Writing the quiz",
  check: "Checking the lesson",
  sample: "Picking a sample lesson",
} as const;

export type Stage = keyof typeof STAGE_LABELS;

export type GenerationMode = "live" | "sample";

export type GenerationErrorCode =
  | "invalid_input"
  | "rate_limited"
  | "unavailable"
  | "busy"
  | "refused"
  | "invalid_output";

export type GenerationEvent =
  | { type: "start"; mode: GenerationMode }
  | { type: "stage"; stage: Stage; status: "start" | "done" }
  | { type: "retry"; stage: Stage; reason: string }
  | { type: "done"; lesson: Lesson; notice?: string }
  | { type: "error"; code: GenerationErrorCode; message: string };

export class GenerationError extends Error {
  constructor(
    public readonly code: GenerationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "GenerationError";
  }
}
