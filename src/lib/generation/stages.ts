import { z } from "zod";
import { DIAGRAM_IDS, DIAGRAMS, type DiagramId } from "@/lib/assets/diagrams";
import { VISUAL_IDS } from "@/lib/assets/visuals";
import { type Duration, type LessonInput, SHORT_TEXT_MAX, TEXT_MAX } from "@/lib/lesson/schema";
import { detectLanguage } from "@/lib/i18n/detect";
import type { Excerpt } from "./evidence";
import type { GenerationInput } from "./input";

/**
 * Schemas for what the model writes at each stage. They describe content only: ids, section types,
 * origin labels and dates are added in code, so the model can't get them wrong (or invent sources).
 */

const short = z.string().trim().min(1).max(SHORT_TEXT_MAX);
const long = z.string().trim().min(1).max(TEXT_MAX);
const objectiveRef = z.enum(["1", "2", "3"]);
const NONE = "none";

/**
 * The "Explore a concept" template. The warm-up is a prediction, or "myth or fact?" when children commonly
 * hold misconceptions about the topic. Two more slots hold activities, chosen to suit the topic (see `chosenPlan`):
 * - `activity` ("do it", after the first explanation): a hands-on experiment when the adult asks for one;
 *   otherwise label a diagram, put steps in order, match pairs, or a second prediction;
 * - `practice` ("apply it", after the second): sort examples into groups, or match pairs.
 * The lesson's length decides which slots it has (`slotsFor`) and how many quiz questions (`QUIZ_LENGTH`).
 */
export const ALL_SLOTS = [
  "hook",
  "warmup",
  "explain1",
  "activity",
  "explain2",
  "practice",
  "explain3",
  "discussion",
  "recap",
] as const;
export type Slot = (typeof ALL_SLOTS)[number];

/**
 * Sections per lesson length. 10 minutes: one explanation and one activity. 15 minutes: two of each.
 * 25 minutes: adds a third explanation that takes the idea further, and "talk about it" before the recap.
 */
const SLOTS_BY_DURATION: Record<Duration, readonly Slot[]> = {
  10: ["hook", "warmup", "explain1", "activity", "recap"],
  15: ["hook", "warmup", "explain1", "activity", "explain2", "practice", "recap"],
  25: ["hook", "warmup", "explain1", "activity", "explain2", "practice", "explain3", "discussion", "recap"],
};

/** Quiz questions per lesson length. Each of the three objectives always gets at least one. */
export const QUIZ_LENGTH: Record<Duration, number> = { 10: 3, 15: 5, 25: 6 };

export function slotsFor(duration: Duration): readonly Slot[] {
  return SLOTS_BY_DURATION[duration];
}

const SLOT_SECTION_IDS: Record<Slot, string> = {
  hook: "sec-hook",
  warmup: "sec-warmup",
  explain1: "sec-explain-1",
  activity: "sec-activity",
  explain2: "sec-explain-2",
  practice: "sec-practice",
  explain3: "sec-explain-3",
  discussion: "sec-discussion",
  recap: "sec-recap",
};

export function sectionIdsFor(duration: Duration): string[] {
  return slotsFor(duration).map((slot) => SLOT_SECTION_IDS[slot]);
}

const plannedSection = z.object({
  title: short.describe("Short, child-friendly section title"),
  focus: long.describe("The one main idea this section covers"),
  objectives: z.array(objectiveRef).describe('Which learning objectives this section supports, by number ("1"-"3")'),
});

const SLOT_PLANS: Record<Slot, z.ZodType<PlannedSection>> = {
  hook: plannedSection,
  warmup: plannedSection.describe("The warm-up (warmupType), before anything is taught"),
  explain1: plannedSection,
  activity: plannedSection.describe('The "do it" activity: the diagram if one was chosen, otherwise activityType'),
  explain2: plannedSection,
  practice: plannedSection.describe('The "apply it" activity (practiceType)'),
  explain3: plannedSection.describe(
    "Takes the idea further: a real-world use, a surprising case or a link to another topic",
  ),
  discussion: plannedSection.describe("A question for the class to talk about, with no single right answer"),
  recap: plannedSection,
};

export type PlannedSection = z.infer<typeof plannedSection>;

const outlineFields = {
  title: short.describe("Engaging lesson title"),
  objectives: z.array(long).length(3).describe("Exactly three learning objectives, each starting with a verb"),
  diagramId: z
    .enum([NONE, ...DIAGRAM_IDS])
    .describe(`An approved diagram that directly matches the topic, or "${NONE}"`),
  warmupType: z
    .enum(["prediction", "myth-or-fact"])
    .describe(
      'The warm-up: "myth-or-fact" if children commonly believe things about this topic that are wrong (such as "plants eat soil" or "heavy things always sink"); otherwise "prediction"',
    ),
  activityType: z
    .enum(["sequence", "matching", "prediction"])
    .describe(
      'The "do it" activity when no diagram is chosen: "sequence" if the topic is a process or has stages in a clear order; otherwise "matching" if it names 3-5 things that each have one distinct partner (a part and its job, a term and its meaning); otherwise "prediction"',
    ),
  practiceType: z
    .enum(["sorting", "matching", "data"])
    .describe(
      'The "apply it" activity: "sorting" if examples fall naturally into 2-3 groups; "data" (ages 11 and up only) if the topic involves measurements or results that a simple chart could show; otherwise "matching" (one-to-one pairs). Never the same as activityType',
    ),
};

/** The outline for a lesson of this length: one planned section per slot the length has. */
export function outlineSchema(duration: Duration) {
  const sections = Object.fromEntries(slotsFor(duration).map((slot) => [slot, SLOT_PLANS[slot]]));
  return z.object({ ...outlineFields, sections: z.object(sections) });
}

export type Outline = Omit<z.infer<ReturnType<typeof outlineSchema>>, "sections"> & {
  sections: Partial<Record<Slot, PlannedSection>>;
};

export function chosenDiagram(outline: Outline): DiagramId | undefined {
  return outline.diagramId === NONE ? undefined : (outline.diagramId as DiagramId);
}

/** What the "do it" slot does. */
export type ActivityPlan =
  | { kind: "experiment" }
  | { kind: "diagram"; diagramId: DiagramId }
  | { kind: "sequence" }
  | { kind: "matching" }
  | { kind: "prediction" };

/** The lesson's activities: the warm-up, "do it" after the first explanation, and "apply it" after the second. */
export type LessonPlan = {
  warmup: "prediction" | "myth-or-fact";
  activity: ActivityPlan;
  practice: "sorting" | "matching" | "data";
};

/**
 * Decides the lesson's activities. An experiment the adult asked for takes the "do it" slot; otherwise a
 * matching diagram wins it, since labelling it is the richest activity, then the outline's choice. A lesson
 * never has the same activity twice: if both slots would be "match pairs", the "apply it" slot sorts into
 * groups instead. Decided here in code, so it costs no repair.
 */
export function chosenPlan(outline: Outline, input: Pick<GenerationInput, "experiment" | "ageGroup">): LessonPlan {
  const diagramId = chosenDiagram(outline);
  const activity: ActivityPlan = input.experiment
    ? { kind: "experiment" }
    : diagramId
      ? { kind: "diagram", diagramId }
      : { kind: outline.activityType };
  // Never match pairs twice; reading charts is for ages 11 and up, so younger learners sort instead.
  const practice =
    (outline.practiceType === "matching" && activity.kind === "matching") ||
    (outline.practiceType === "data" && input.ageGroup === "8-10")
      ? "sorting"
      : outline.practiceType;
  return { warmup: outline.warmupType, activity, practice };
}

const visual = z
  .enum([NONE, ...VISUAL_IDS])
  .describe(`An approved picture that matches this section exactly, or "${NONE}"`);
const note = long.describe("Guidance for the adult presenting this section");

const predictionContent = z.object({
  question: short,
  options: z.array(short).min(2).max(4),
  answerIndex: z.number().int().min(0).max(3).nullable().describe("Index of the option the reveal confirms, or null"),
  reveal: long.describe("What really happens, explained simply"),
  facilitatorNote: note,
});

const sequenceContent = z.object({
  instructions: long,
  steps: z
    .array(
      z.object({
        text: short.describe("One step, short enough to read at a glance"),
        explanation: long.describe("Why this step comes here; shown if the learner puts it in the wrong place"),
      }),
    )
    .min(3)
    .max(6)
    .describe("The steps in their correct order. Each must be clearly different from the others"),
  facilitatorNote: note,
});

const experimentContent = z.object({
  question: short.describe('What learners predict before trying it, e.g. "What will happen to the raisins?"'),
  materials: z.array(short).min(2).max(8).describe("Safe, everyday household items"),
  steps: z.array(long).min(2).max(6).describe("What the adult does, in order"),
  observe: long.describe("What to look for while it happens"),
  explanation: long.describe("Why it happens, in words the age group understands"),
  safety: long.describe("A short safety note for the adult"),
  facilitatorNote: note,
});

const mythOrFactContent = z.object({
  instructions: long,
  statements: z
    .array(
      z.object({
        text: short.describe("A statement children might believe; worded so it doesn't give the answer away"),
        isFact: z.boolean().describe("true if the statement is true, false if it is a myth"),
        explanation: long.describe("Why, in a sentence or two; don't start by saying whether it's a myth or a fact"),
      }),
    )
    .min(3)
    .max(6)
    .describe("Mostly common misconceptions (myths), with at least one true statement (fact)"),
  facilitatorNote: note,
});

const matchingContent = z.object({
  instructions: long,
  pairs: z
    .array(
      z.object({
        left: short.describe("A thing, part or term"),
        right: short.describe("Its one partner: what it does, means or causes"),
        explanation: long.describe("Why the two belong together; shown if the learner matches it wrongly"),
      }),
    )
    .min(3)
    .max(5)
    .describe("Each left side has exactly one sensible partner; no two left or right sides alike"),
  facilitatorNote: note,
});

const discussionContent = z.object({
  question: short.describe(
    "A question with no single right answer, which the lesson has given learners the ideas to discuss",
  ),
  prompts: z.array(short).min(2).max(4).describe("Follow-up questions the adult can ask to keep the talk going"),
  listenFor: z.array(long).min(2).max(4).describe("Ideas a good answer might include"),
  facilitatorNote: note,
});

export const dataContent = z.object({
  instructions: long,
  chart: z.enum(["bar", "line"]).describe('"line" for a change over time, otherwise "bar"'),
  caption: short.describe('What the chart shows, e.g. "Height of a bean plant over 10 days"'),
  xLabel: short,
  yLabel: short.describe('Includes the unit, e.g. "Height (cm)"'),
  rows: z
    .array(z.object({ label: short, value: z.number() }))
    .min(3)
    .max(8)
    .describe("Realistic example values that fit the science; distinct labels"),
  questions: z
    .array(
      z.object({
        prompt: long,
        options: z.array(short).min(3).max(4),
        correctIndex: z.number().int().min(0).max(3),
        explanation: long.describe("Why, quoting the numbers"),
        check: z
          .enum(["highest", "lowest", "none"])
          .describe(
            '"highest" or "lowest" if the question asks which row has the highest or lowest value, so it can be checked',
          ),
      }),
    )
    .min(2)
    .max(3),
  facilitatorNote: note,
});

const sortingContent = z.object({
  instructions: long,
  categories: z.array(short).min(2).max(3),
  items: z
    .array(
      z.object({
        text: short,
        categoryIndex: z.number().int().min(0).max(2).describe("Index into categories"),
        explanation: long.describe("Why it belongs in its category"),
      }),
    )
    .min(3)
    .max(8),
  facilitatorNote: note,
});

const explanationContent = z.object({
  paragraphs: z.array(long).min(1).max(4),
  keyTerms: z.array(z.object({ term: short, definition: long })).max(4),
  example: long.nullable().describe("A concrete everyday example, or null"),
  visualId: visual,
  facilitatorNote: note,
});

/** Cited excerpt ids, required (at least one) whenever the lesson has evidence. */
function citations(excerptIds: string[]) {
  return z
    .array(z.enum(excerptIds as [string, ...string[]]))
    .min(1)
    .describe("Ids of the excerpts that support this content");
}

/** The evidence a generation works from, and the content origin it implies. */
export type Evidence = { kind: "reference" | "web"; excerpts: Excerpt[] };

export function contentSchema(plan: LessonPlan, excerptIds: string[] = [], duration: Duration = 15) {
  const explanation = excerptIds.length
    ? explanationContent.extend({ sourceIds: citations(excerptIds) })
    : explanationContent;
  const diagramId = plan.activity.kind === "diagram" ? plan.activity.diagramId : undefined;
  const activity =
    plan.activity.kind === "experiment"
      ? experimentContent
      : diagramId
        ? z.object({
            instructions: long,
            labels: z
              .array(
                z.object({
                  text: short.describe("The label the learner places"),
                  targetId: z.enum(DIAGRAMS[diagramId].targets.map((t) => t.id) as [string, ...string[]]),
                  explanation: long.describe("Feedback shown when placed correctly"),
                }),
              )
              .min(2)
              .max(DIAGRAMS[diagramId].targets.length),
            facilitatorNote: note,
          })
        : plan.activity.kind === "sequence"
          ? sequenceContent
          : plan.activity.kind === "matching"
            ? matchingContent
            : predictionContent;

  const all = {
    hook: z.object({ question: short, body: long, visualId: visual, facilitatorNote: note }),
    warmup: plan.warmup === "myth-or-fact" ? mythOrFactContent : predictionContent,
    explain1: explanation,
    activity,
    explain2: explanation,
    practice: plan.practice === "matching" ? matchingContent : plan.practice === "data" ? dataContent : sortingContent,
    explain3: explanation,
    discussion: discussionContent,
    recap: z.object({ keyPoints: z.array(long).length(3), facilitatorNote: note }),
  };
  // Only the sections this length has; the type below covers the longest lesson.
  const slots = slotsFor(duration);
  return z.object(Object.fromEntries(slots.map((slot) => [slot, all[slot]]))) as unknown as ReturnType<
    typeof fullContentSchema
  >;
}

/** The content of the longest lesson; shorter lessons leave out the slots they don't have. Used for its type. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function fullContentSchema(plan: LessonPlan, excerptIds: string[]) {
  const explanation = excerptIds.length
    ? explanationContent.extend({ sourceIds: citations(excerptIds) })
    : explanationContent;
  return z.object({
    hook: z.object({ question: short, body: long, visualId: visual, facilitatorNote: note }),
    warmup: plan.warmup === "myth-or-fact" ? mythOrFactContent : predictionContent,
    explain1: explanation,
    activity: z.union([
      experimentContent,
      sequenceContent,
      matchingContent,
      predictionContent,
      z.object({
        instructions: long,
        labels: z.array(z.object({ text: short, targetId: z.string(), explanation: long })),
        facilitatorNote: note,
      }),
    ]),
    explain2: explanation.optional(),
    practice: z.union([matchingContent, dataContent, sortingContent]).optional(),
    explain3: explanation.optional(),
    discussion: discussionContent.optional(),
    recap: z.object({ keyPoints: z.array(long).length(3), facilitatorNote: note }),
  });
}
export type Content = z.infer<ReturnType<typeof fullContentSchema>>;

export function quizSchema(sectionIds: string[], excerptIds: string[] = [], count = 5) {
  const question = z.object({
    prompt: long,
    options: z.array(short).length(4),
    correctIndex: z.number().int().min(0).max(3),
    explanation: long,
    objective: objectiveRef,
    sectionId: z.enum(sectionIds as [string, ...string[]]).describe("The section that teaches the answer"),
  });
  return z.object({
    questions: z
      .array(excerptIds.length ? question.extend({ sourceIds: citations(excerptIds) }) : question)
      .length(count),
  });
}
export type Quiz = z.infer<ReturnType<typeof quizSchema>>;

const OPTION_IDS = ["a", "b", "c", "d"];
const objectiveId = (ref: string) => `obj-${ref}`;
const visualOrUndefined = (v: string) => (v === NONE ? undefined : (v as (typeof VISUAL_IDS)[number]));

/** The excerpt ids a stage output cites, if it has any. */
function cited(output: object): string[] {
  return "sourceIds" in output && Array.isArray(output.sourceIds) ? (output.sourceIds as string[]) : [];
}

function sectionsFrom(outline: Outline, content: Content, duration: Duration): LessonInput["sections"] {
  const diagramId = chosenDiagram(outline);
  const meta = (slot: Slot) => ({
    id: SLOT_SECTION_IDS[slot],
    title: outline.sections[slot]?.title ?? "",
    objectiveIds: (outline.sections[slot]?.objectives ?? []).map(objectiveId),
    facilitatorNote: content[slot]?.facilitatorNote,
  });

  const prediction = (slot: Slot, c: z.infer<typeof predictionContent>) => {
    const options = c.options.map((text, i) => ({ id: OPTION_IDS[i], text }));
    return {
      ...meta(slot),
      type: "prediction" as const,
      question: c.question,
      options,
      answerOptionId: c.answerIndex === null ? undefined : options[c.answerIndex]?.id,
      reveal: c.reveal,
    };
  };

  const matching = (slot: Slot, c: z.infer<typeof matchingContent>) => ({
    ...meta(slot),
    type: "matching" as const,
    instructions: c.instructions,
    // Pair ids carry the slot, so a lesson's two activities can never share ids.
    pairs: c.pairs.map((pair, i) => ({ id: `${slot}-pair-${i + 1}`, ...pair })),
  });

  const sorting = (c: z.infer<typeof sortingContent>) => {
    const categoryIds = c.categories.map((_, i) => `cat-${i + 1}`);
    return {
      ...meta("practice"),
      type: "sorting" as const,
      instructions: c.instructions,
      categories: c.categories.map((label, i) => ({ id: categoryIds[i], label })),
      items: c.items.map((item, i) => ({
        id: `item-${i + 1}`,
        text: item.text,
        // An out-of-range index becomes an unknown category, which the lesson check reports for repair.
        categoryId: categoryIds[item.categoryIndex] ?? `cat-${item.categoryIndex + 1}`,
        explanation: item.explanation,
      })),
    };
  };

  const data = (c: z.infer<typeof dataContent>) => ({
    ...meta("practice"),
    type: "data" as const,
    instructions: c.instructions,
    chart: c.chart,
    caption: c.caption,
    xLabel: c.xLabel,
    yLabel: c.yLabel,
    rows: c.rows,
    questions: c.questions.map((q, i) => {
      const options = q.options.map((text, j) => ({ id: OPTION_IDS[j], text }));
      return {
        id: `dq-${i + 1}`,
        prompt: q.prompt,
        options,
        // An out-of-range index becomes an unknown option, which the lesson check reports for repair.
        correctOptionId: options[q.correctIndex]?.id ?? `option-${q.correctIndex}`,
        explanation: q.explanation,
      };
    }),
  });

  const explanation = (slot: Slot, c: z.infer<typeof explanationContent>) => ({
    ...meta(slot),
    type: "explanation" as const,
    paragraphs: c.paragraphs,
    keyTerms: c.keyTerms,
    example: c.example ?? undefined,
    visualId: visualOrUndefined(c.visualId),
    sourceIds: cited(c),
  });

  const activity =
    diagramId && "labels" in content.activity
      ? {
          ...meta("activity"),
          type: "diagram-labeling" as const,
          diagramId,
          instructions: content.activity.instructions,
          labels: content.activity.labels.map((label, i) => ({ id: `lbl-${i + 1}`, ...label })),
        }
      : "materials" in content.activity
        ? {
            ...meta("activity"),
            type: "experiment" as const,
            question: content.activity.question,
            materials: content.activity.materials,
            steps: content.activity.steps,
            observe: content.activity.observe,
            explanation: content.activity.explanation,
            safety: content.activity.safety,
          }
        : "steps" in content.activity
          ? {
              ...meta("activity"),
              type: "sequence" as const,
              instructions: content.activity.instructions,
              steps: content.activity.steps.map((step, i) => ({ id: `step-${i + 1}`, ...step })),
            }
          : "pairs" in content.activity
            ? matching("activity", content.activity)
            : prediction("activity", content.activity as z.infer<typeof predictionContent>);

  const build: Record<Slot, () => LessonInput["sections"][number] | undefined> = {
    hook: () => ({
      ...meta("hook"),
      type: "hook",
      question: content.hook.question,
      body: content.hook.body,
      visualId: visualOrUndefined(content.hook.visualId),
    }),
    warmup: () =>
      "statements" in content.warmup
        ? {
            ...meta("warmup"),
            type: "myth-or-fact" as const,
            instructions: content.warmup.instructions,
            statements: content.warmup.statements.map((statement, i) => ({ id: `statement-${i + 1}`, ...statement })),
          }
        : prediction("warmup", content.warmup),
    explain1: () => explanation("explain1", content.explain1),
    activity: () => activity,
    explain2: () => content.explain2 && explanation("explain2", content.explain2),
    practice: () =>
      content.practice &&
      ("pairs" in content.practice
        ? matching("practice", content.practice)
        : "rows" in content.practice
          ? data(content.practice)
          : sorting(content.practice)),
    explain3: () => content.explain3 && explanation("explain3", content.explain3),
    discussion: () =>
      content.discussion && {
        ...meta("discussion"),
        type: "discussion" as const,
        question: content.discussion.question,
        prompts: content.discussion.prompts,
        listenFor: content.discussion.listenFor,
      },
    recap: () => ({ ...meta("recap"), type: "recap", keyPoints: content.recap.keyPoints }),
  };
  // A missing section (the model left one out) is skipped here and reported by the lesson check.
  return slotsFor(duration).flatMap((slot) => build[slot]() ?? []);
}

/**
 * Turns the stage outputs into a lesson for the schema check. Sources are exactly the excerpts the content
 * cites, with text and URLs copied from the evidence, so nothing here can invent a source.
 */
export function assembleLesson({
  id,
  now,
  input,
  outline,
  content,
  quiz,
  evidence,
}: {
  id: string;
  now: string;
  input: GenerationInput;
  outline: Outline;
  content: Content;
  quiz: Quiz;
  evidence?: Evidence;
}): LessonInput {
  const sections = sectionsFrom(outline, content, input.durationMinutes);
  const questions = quiz.questions.map((q, i) => ({
    id: `q${i + 1}`,
    prompt: q.prompt,
    options: q.options.map((text, j) => ({ id: OPTION_IDS[j], text })),
    correctOptionId: OPTION_IDS[q.correctIndex],
    explanation: q.explanation,
    objectiveId: objectiveId(q.objective),
    sectionId: q.sectionId,
    sourceIds: cited(q),
  }));

  const citedIds = new Set([...sections.flatMap((s) => s.sourceIds ?? []), ...questions.flatMap((q) => q.sourceIds)]);
  const sources = (evidence?.excerpts ?? [])
    .filter((e) => citedIds.has(e.id))
    .map((e) => ({ id: e.id, title: e.title, excerpt: e.text, ...(e.url ? { url: e.url } : {}) }));

  return {
    id,
    title: outline.title,
    topic: input.topic,
    ageGroup: input.ageGroup,
    durationMinutes: input.durationMinutes,
    templateId: "explore-concept",
    language: detectLanguage(input.topic),
    contentOrigin:
      evidence?.kind === "reference" ? "reference" : evidence?.kind === "web" ? "web-research" : "ai-draft",
    createdAt: now,
    updatedAt: now,
    objectives: outline.objectives.map((description, i) => ({ id: objectiveId(String(i + 1)), description })),
    sources,
    sections,
    quiz: questions,
  };
}
