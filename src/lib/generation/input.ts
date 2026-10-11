import { z } from "zod";
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
});

export type GenerationInput = z.infer<typeof generationInputSchema>;
export type GenerationFormValues = z.input<typeof generationInputSchema>;

export const EXAMPLE_INPUT: GenerationFormValues = {
  topic: "How magnets work",
  ageGroup: "8-10",
  durationMinutes: 10,
  referenceText: "",
};
