import type { z } from "zod";
import { en } from "@/lib/i18n/dictionaries/en";
import { describeIssues } from "@/lib/lesson/issues";
import { unsafeExperimentTerms } from "@/lib/lesson/safety";
import { type Lesson, lessonSchema } from "@/lib/lesson/schema";
import { GenerationError, type GenerationEvent, type Stage } from "./events";
import { excerptsFromCitations, splitReference, type WebCitation } from "./evidence";
import type { GenerationInput } from "./input";
import { contentPrompt, outlinePrompt, quizPrompt, repairPrompt, researchPrompt, SYSTEM_PROMPT } from "./prompts";
import {
  assembleLesson,
  chosenPlan,
  type Content,
  contentSchema,
  type Evidence,
  type Outline,
  outlineSchema,
  type Quiz,
  quizSchema,
  QUIZ_LENGTH,
  sectionIdsFor,
} from "./stages";

/** One conversation turn sent to the model. Assistant turns are replayed exactly as the model returned them. */
export type ConversationTurn = { role: "user"; text: string } | { role: "assistant"; replay: unknown };

export type ModelReply = {
  text: string;
  /** Opaque content to append to the conversation unchanged on a retry. */
  replay: unknown;
  stopReason: "complete" | "max_tokens" | "refusal";
};

/** What the pipeline needs from an AI provider: JSON replies that should match `schema`, and optionally web research. */
export interface ModelClient {
  send(request: { stage: Stage; system: string; turns: ConversationTurn[]; schema: z.ZodType }): Promise<ModelReply>;
  /** Searches the web and returns the citations from the search tool (never URLs written by the model). */
  research?(request: { system: string; prompt: string }): Promise<{ citations: WebCitation[] }>;
}

/** Fewer distinct excerpts than this isn't enough to build a lesson on. */
const MIN_WEB_EXCERPTS = 2;

/** Attempts per stage: the first try plus one repair. */
const ATTEMPTS_PER_STAGE = 2;

type Emit = (event: GenerationEvent) => void;

function formatZodIssues(error: z.ZodError): string[] {
  return error.issues.slice(0, 12).map((issue) => {
    const path = issue.path.join(".");
    return path ? `${path}: ${issue.message}` : issue.message;
  });
}

/**
 * Asks for one stage's JSON, validates it, and feeds problems back to the model at most
 * `ATTEMPTS_PER_STAGE - 1` times. `check` adds rules the schema can't express.
 */
async function runStage<T>(
  client: ModelClient,
  emit: Emit,
  stage: Stage,
  prompt: string,
  schema: z.ZodType<T>,
  check: (data: T) => string[] = () => [],
): Promise<T> {
  emit({ type: "stage", stage, status: "start" });
  const turns: ConversationTurn[] = [{ role: "user", text: prompt }];

  for (let attempt = 1; ; attempt++) {
    const reply = await client.send({ stage, system: SYSTEM_PROMPT, turns, schema });

    if (reply.stopReason === "refusal") {
      throw new GenerationError(
        "refused",
        "This topic couldn't be turned into a lesson. Try rephrasing it as a science topic for children.",
      );
    }

    let problems: string[];
    if (reply.stopReason === "max_tokens") {
      problems = ["The response was cut off because it was too long. Write more concisely."];
    } else {
      problems = parseAndCheck(reply.text, schema, check);
      if (problems.length === 0) {
        emit({ type: "stage", stage, status: "done" });
        return schema.parse(JSON.parse(reply.text));
      }
    }

    if (attempt >= ATTEMPTS_PER_STAGE) {
      throw new GenerationError(
        "invalid_output",
        "The AI couldn't produce a complete, valid lesson. Please try again.",
      );
    }
    emit({ type: "retry", stage, reason: problems[0] });
    turns.push({ role: "assistant", replay: reply.replay }, { role: "user", text: repairPrompt(problems) });
  }
}

function parseAndCheck<T>(text: string, schema: z.ZodType<T>, check: (data: T) => string[]): string[] {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return ["The response was not valid JSON."];
  }
  const result = schema.safeParse(json);
  if (!result.success) return formatZodIssues(result.error);
  return check(result.data);
}

/** Cross-reference rules from `lessonSchema`, checked against a draft built from this stage's output. */
function lessonProblems(draft: unknown, filter: (target: string) => boolean): string[] {
  const result = lessonSchema.safeParse(draft);
  if (result.success) return [];
  // Repair feedback goes to the model, so it stays in English whatever the interface language.
  return describeIssues(draft as Lesson, result.error, en)
    .filter((issue) => filter(issue.target))
    .map((issue) => `${issue.where}: ${issue.message}`);
}

export async function generateLesson({
  input,
  client,
  emit,
  id,
  now = () => new Date().toISOString(),
}: {
  input: GenerationInput;
  client: ModelClient;
  emit: Emit;
  id: string;
  now?: () => string;
}): Promise<Lesson> {
  const evidence = await gatherEvidence(input, client, emit);
  const excerptIds = evidence?.excerpts.map((e) => e.id) ?? [];

  const duration = input.durationMinutes;
  const outline = (await runStage(
    client,
    emit,
    "outline",
    outlinePrompt(input, evidence),
    outlineSchema(duration) as unknown as z.ZodType<Outline>,
  )) as Outline;

  const assemble = (c: Content, q: Quiz) =>
    assembleLesson({ id, now: now(), input, outline, content: c, quiz: q, evidence });

  const content: Content = await runStage(
    client,
    emit,
    "content",
    contentPrompt(input, outline, evidence),
    contentSchema(chosenPlan(outline, input), excerptIds, duration) as z.ZodType<Content>,
    // Check section-level rules now (e.g. two labels on one diagram spot), using a placeholder quiz, and that
    // an experiment uses nothing unsafe for children.
    (c) => [
      ...lessonProblems(assemble(c, PLACEHOLDER_QUIZ), (t) => t.startsWith("section:")),
      ...experimentProblems(c.activity),
    ],
  );

  const quiz: Quiz = await runStage(
    client,
    emit,
    "quiz",
    quizPrompt(input, outline, content, evidence),
    quizSchema(sectionIdsFor(duration), excerptIds, QUIZ_LENGTH[duration]) as z.ZodType<Quiz>,
    (q) => lessonProblems(assemble(content, q), () => true),
  );

  emit({ type: "stage", stage: "check", status: "start" });
  const result = lessonSchema.safeParse(assemble(content, quiz));
  if (!result.success) {
    // Every rule was checked per stage, so this means a bug in assembly rather than bad model output.
    throw new GenerationError("invalid_output", "The generated lesson didn't pass the final check. Please try again.");
  }
  emit({ type: "stage", stage: "check", status: "done" });
  return result.data;
}

/**
 * Reference text is split into excerpts; web research runs as its own stage and keeps only cited pages.
 * Research that finds too few sources doesn't fail the request: the searches are already paid for, so the
 * lesson is written without web sources (an ordinary AI draft) and the client is told why.
 */
async function gatherEvidence(input: GenerationInput, client: ModelClient, emit: Emit): Promise<Evidence | undefined> {
  if (input.referenceText) return { kind: "reference", excerpts: splitReference(input.referenceText) };
  if (!input.research) return undefined;
  if (!client.research) throw new GenerationError("unavailable", "Web research isn't available right now.");

  emit({ type: "stage", stage: "research", status: "start" });
  const { citations } = await client.research({ system: SYSTEM_PROMPT, prompt: researchPrompt(input) });
  const excerpts = excerptsFromCitations(citations);
  emit({ type: "stage", stage: "research", status: "done" });
  if (excerpts.length < MIN_WEB_EXCERPTS) {
    emit({ type: "research_fallback" });
    return undefined;
  }
  return { kind: "web", excerpts };
}

/** Problems with a generated experiment's safety, phrased for the model to fix. */
function experimentProblems(activity: Content["activity"]): string[] {
  if (!("materials" in activity)) return [];
  const terms = unsafeExperimentTerms(activity);
  return terms.length
    ? [
        `activity: the experiment uses something unsafe for children (${terms.join(", ")}). Use only safe household materials: no fire or heat, sharp blades, strong chemicals or mains electricity.`,
      ]
    : [];
}

/** A structurally valid quiz covering every objective, used only to check content before the real quiz exists. */
const PLACEHOLDER_QUIZ: Quiz = {
  questions: (["1", "2", "3", "1", "2"] as const).map((objective) => ({
    prompt: "placeholder",
    options: ["a", "b", "c", "d"],
    correctIndex: 0,
    explanation: "placeholder",
    objective,
    sectionId: "sec-hook",
  })),
};
