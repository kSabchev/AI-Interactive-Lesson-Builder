import { z } from "zod";
import { DIAGRAMS, isDiagramId } from "@/lib/assets/diagrams";
import { VISUAL_IDS } from "@/lib/assets/visuals";

export const SHORT_TEXT_MAX = 160;
export const TEXT_MAX = 1200;

const id = z.string().min(1).max(64);
const shortText = z.string().trim().min(1).max(SHORT_TEXT_MAX);
const text = z.string().trim().min(1).max(TEXT_MAX);

export const AGE_GROUPS = ["8-10", "11-12"] as const;
export const DURATIONS = [10, 15] as const;
export const CONTENT_ORIGINS = ["reference", "web-research", "ai-draft", "curated"] as const;

export const learningObjectiveSchema = z.object({
  id,
  description: text,
});

export const sourceSchema = z.object({
  id,
  title: shortText,
  url: z.url().optional(),
  excerpt: text.optional(),
});

const optionSchema = z.object({ id, text: shortText });

const sectionBase = {
  id,
  title: shortText,
  /** Guidance for the adult presenting the lesson; longer for 15-minute lessons. */
  facilitatorNote: text.optional(),
  objectiveIds: z.array(id).default([]),
};

export const hookSectionSchema = z.object({
  ...sectionBase,
  type: z.literal("hook"),
  question: shortText,
  body: text,
  visualId: z.enum(VISUAL_IDS).optional(),
});

export const explanationSectionSchema = z.object({
  ...sectionBase,
  type: z.literal("explanation"),
  paragraphs: z.array(text).min(1).max(4),
  keyTerms: z
    .array(z.object({ term: shortText, definition: text }))
    .max(4)
    .default([]),
  example: text.optional(),
  visualId: z.enum(VISUAL_IDS).optional(),
});

export const predictionSectionSchema = z.object({
  ...sectionBase,
  type: z.literal("prediction"),
  question: shortText,
  options: z.array(optionSchema).min(2).max(4),
  /** Optional: the option the reveal highlights. Predictions are never scored. */
  answerOptionId: id.optional(),
  reveal: text,
});

export const diagramLabelingSectionSchema = z.object({
  ...sectionBase,
  type: z.literal("diagram-labeling"),
  diagramId: z.string().refine(isDiagramId, "Unknown diagram"),
  instructions: text,
  labels: z
    .array(
      z.object({
        id,
        text: shortText,
        targetId: id,
        explanation: text,
      }),
    )
    .min(2)
    .max(6),
});

export const sortingSectionSchema = z.object({
  ...sectionBase,
  type: z.literal("sorting"),
  instructions: text,
  categories: z.array(z.object({ id, label: shortText })).min(2).max(3),
  items: z
    .array(
      z.object({
        id,
        text: shortText,
        categoryId: id,
        explanation: text,
      }),
    )
    .min(3)
    .max(8),
});

export const recapSectionSchema = z.object({
  ...sectionBase,
  type: z.literal("recap"),
  keyPoints: z.array(text).length(3),
});

export const lessonSectionSchema = z.discriminatedUnion("type", [
  hookSectionSchema,
  explanationSectionSchema,
  predictionSectionSchema,
  diagramLabelingSectionSchema,
  sortingSectionSchema,
  recapSectionSchema,
]);

export const quizQuestionSchema = z.object({
  id,
  prompt: text,
  options: z.array(optionSchema).length(4),
  correctOptionId: id,
  explanation: text,
  objectiveId: id,
  sectionId: id,
  sourceIds: z.array(id).default([]),
});

export const lessonSchema = z
  .object({
    id,
    title: shortText,
    topic: shortText,
    ageGroup: z.enum(AGE_GROUPS),
    durationMinutes: z.union([z.literal(10), z.literal(15)]),
    templateId: z.literal("explore-concept"),
    contentOrigin: z.enum(CONTENT_ORIGINS),
    objectives: z.array(learningObjectiveSchema).length(3),
    sources: z.array(sourceSchema).default([]),
    sections: z.array(lessonSectionSchema).min(3).max(10),
    quiz: z.array(quizQuestionSchema).length(5),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .superRefine((lesson, ctx) => {
    const issue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: "custom", path, message });

    const objectiveIds = new Set(lesson.objectives.map((o) => o.id));
    const sectionIds = new Set(lesson.sections.map((s) => s.id));
    const sourceIds = new Set(lesson.sources.map((s) => s.id));

    findDuplicates(lesson.objectives.map((o) => o.id)).forEach((dup) =>
      issue(["objectives"], `Duplicate objective id "${dup}"`),
    );
    findDuplicates(lesson.sections.map((s) => s.id)).forEach((dup) =>
      issue(["sections"], `Duplicate section id "${dup}"`),
    );
    findDuplicates(lesson.quiz.map((q) => q.id)).forEach((dup) =>
      issue(["quiz"], `Duplicate question id "${dup}"`),
    );

    lesson.sections.forEach((section, i) => {
      section.objectiveIds.forEach((oid) => {
        if (!objectiveIds.has(oid)) issue(["sections", i, "objectiveIds"], `Unknown objective "${oid}"`);
      });

      if (section.type === "prediction" && section.answerOptionId) {
        if (!section.options.some((o) => o.id === section.answerOptionId)) {
          issue(["sections", i, "answerOptionId"], "Answer must be one of the options");
        }
      }

      if (section.type === "diagram-labeling" && isDiagramId(section.diagramId)) {
        const targets = new Set<string>(DIAGRAMS[section.diagramId].targets.map((t) => t.id));
        section.labels.forEach((label, j) => {
          if (!targets.has(label.targetId)) {
            issue(["sections", i, "labels", j, "targetId"], `Diagram has no target "${label.targetId}"`);
          }
        });
        findDuplicates(section.labels.map((l) => l.targetId)).forEach((dup) =>
          issue(["sections", i, "labels"], `Two labels point at target "${dup}"`),
        );
      }

      if (section.type === "sorting") {
        const categoryIds = new Set(section.categories.map((c) => c.id));
        section.items.forEach((item, j) => {
          if (!categoryIds.has(item.categoryId)) {
            issue(["sections", i, "items", j, "categoryId"], `Unknown category "${item.categoryId}"`);
          }
        });
      }
    });

    lesson.quiz.forEach((question, i) => {
      if (!question.options.some((o) => o.id === question.correctOptionId)) {
        issue(["quiz", i, "correctOptionId"], "Correct answer must be one of the options");
      }
      findDuplicates(question.options.map((o) => o.id)).forEach((dup) =>
        issue(["quiz", i, "options"], `Duplicate option id "${dup}"`),
      );
      if (!objectiveIds.has(question.objectiveId)) {
        issue(["quiz", i, "objectiveId"], `Unknown objective "${question.objectiveId}"`);
      }
      if (!sectionIds.has(question.sectionId)) {
        issue(["quiz", i, "sectionId"], `Unknown section "${question.sectionId}"`);
      }
      question.sourceIds.forEach((sid) => {
        if (!sourceIds.has(sid)) issue(["quiz", i, "sourceIds"], `Unknown source "${sid}"`);
      });
    });

    // The quiz checks the stated objectives, so each objective needs at least one question.
    lesson.objectives.forEach((objective, i) => {
      if (!lesson.quiz.some((q) => q.objectiveId === objective.id)) {
        issue(["objectives", i], "Objective is not covered by any quiz question");
      }
    });
  });

function findDuplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const v of values) (seen.has(v) ? dups : seen).add(v);
  return [...dups];
}

export type Lesson = z.infer<typeof lessonSchema>;
export type LessonInput = z.input<typeof lessonSchema>;
export type LearningObjective = z.infer<typeof learningObjectiveSchema>;
export type Source = z.infer<typeof sourceSchema>;
export type LessonSection = z.infer<typeof lessonSectionSchema>;
export type SectionType = LessonSection["type"];
export type SectionOfType<T extends SectionType> = Extract<LessonSection, { type: T }>;
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;
export type AgeGroup = (typeof AGE_GROUPS)[number];
export type ContentOrigin = (typeof CONTENT_ORIGINS)[number];
