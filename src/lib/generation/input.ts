import { z } from "zod";
import type { z as zod } from "zod";
import type { Dictionary } from "@/lib/i18n";
import { AGE_GROUPS } from "@/lib/lesson/schema";

export const TOPIC_MAX = 120;
export const REFERENCE_MAX = 20_000;

/** What the adult asks for. Shared by the create form and the generation route. */
export const generationInputSchema = z.object({
  topic: z
    .string()
    .trim()
    .min(3, "Enter a topic of at least 3 characters.")
    .max(TOPIC_MAX, `Keep the topic under ${TOPIC_MAX} characters.`),
  ageGroup: z.enum(AGE_GROUPS),
  durationMinutes: z.union([z.literal(10), z.literal(15)]),
  referenceText: z
    .string()
    .trim()
    .max(REFERENCE_MAX, `Reference text can be up to ${REFERENCE_MAX.toLocaleString("en")} characters.`)
    .transform((v) => (v ? v : undefined))
    .optional(),
  /** "high" uses the larger model and counts as two generations. */
  quality: z.enum(["standard", "high"]).default("standard"),
  /** Search the web for sources before writing (ignored when reference text is supplied). */
  research: z.boolean().default(false),
});

export type GenerationInput = z.infer<typeof generationInputSchema>;
export type GenerationFormValues = z.input<typeof generationInputSchema>;

export const EXAMPLE_INPUT: GenerationFormValues = {
  topic: "How magnets work",
  ageGroup: "8-10",
  durationMinutes: 10,
  referenceText: "",
  quality: "standard",
  research: false,
};

/** A validation problem in the interface language (the schema's own messages are English). */
export function inputIssueMessage(issue: zod.core.$ZodIssue, t: Dictionary): string {
  const field = issue.path[0];
  if (field === "topic") {
    return issue.code === "too_big" ? t.create.validation.topicLong(TOPIC_MAX) : t.create.validation.topicShort;
  }
  if (field === "referenceText" && issue.code === "too_big") return t.create.validation.referenceLong(REFERENCE_MAX);
  return t.generation.errors.invalid_input;
}
