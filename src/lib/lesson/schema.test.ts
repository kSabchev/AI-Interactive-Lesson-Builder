import { describe, expect, it } from "vitest";
import { SAMPLE_LESSON_INPUTS } from "@/content/samples";
import { waterCycleLesson } from "@/content/samples/water-cycle";
import { lessonSchema, type LessonInput } from "./schema";

const clone = (): LessonInput => structuredClone(waterCycleLesson);

function issuesFor(lesson: LessonInput) {
  const result = lessonSchema.safeParse(lesson);
  return result.success ? [] : result.error.issues.map((i) => i.message);
}

describe("lessonSchema", () => {
  it.each(SAMPLE_LESSON_INPUTS.map((l) => [l.id, l] as const))("accepts the curated lesson %s", (_, lesson) => {
    expect(issuesFor(structuredClone(lesson))).toEqual([]);
  });

  it("gives every sample lesson a unique id", () => {
    const ids = SAMPLE_LESSON_INPUTS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("requires exactly three objectives", () => {
    const lesson = clone();
    lesson.objectives.pop();
    expect(lessonSchema.safeParse(lesson).success).toBe(false);
  });

  it("accepts 3 to 7 quiz questions (3 for 10 minutes, 5 for 15, 6 for 25), but no fewer or more", () => {
    const withQuestions = (n: number) => {
      const lesson = clone();
      const q = lesson.quiz;
      // Every objective keeps at least one question, which the schema also requires.
      const objectives = lesson.objectives.map((o) => o.id);
      lesson.quiz = Array.from({ length: n }, (_, i) => ({
        ...q[i % q.length],
        id: `q${i + 1}`,
        objectiveId: objectives[i % objectives.length],
      }));
      return lessonSchema.safeParse(lesson).success;
    };
    expect([2, 3, 5, 6, 7, 8].map(withQuestions)).toEqual([false, true, true, true, true, false]);
  });

  it("accepts 25-minute lessons with a \"talk about it\" section", () => {
    const lesson = clone();
    lesson.durationMinutes = 25;
    lesson.sections.splice(lesson.sections.length - 1, 0, {
      id: "sec-discussion",
      type: "discussion",
      title: "Let's talk",
      question: "Where does the water in your tap come from?",
      prompts: ["Where did it fall as rain?", "How did it get to you?"],
      listenFor: ["It fell as rain or snow.", "It was collected in rivers or reservoirs."],
    });
    expect(issuesFor(lesson)).toEqual([]);
  });

  it("rejects a correct answer that is not one of the options", () => {
    const lesson = clone();
    lesson.quiz[0].correctOptionId = "z";
    expect(issuesFor(lesson)).toContain("Correct answer must be one of the options");
  });

  it("rejects quiz questions linked to unknown sections, objectives or sources", () => {
    const lesson = clone();
    lesson.quiz[0].sectionId = "sec-missing";
    lesson.quiz[1].sourceIds = ["src-invented"];
    expect(issuesFor(lesson)).toEqual(
      expect.arrayContaining(['Unknown section "sec-missing"', 'Unknown source "src-invented"']),
    );
  });

  it("rejects sections citing sources the lesson doesn't list", () => {
    const lesson = clone();
    lesson.sections[2].sourceIds = ["src-invented"];
    expect(issuesFor(lesson)).toContain('Unknown source "src-invented"');
  });

  it("rejects objectives that no quiz question covers", () => {
    const lesson = clone();
    lesson.quiz[0].objectiveId = "obj-cycle";
    expect(issuesFor(lesson)).toContain("Objective is not covered by any quiz question");
  });

  it("rejects diagrams that are not in the approved list", () => {
    const lesson = clone();
    const diagram = lesson.sections.find((s) => s.type === "diagram-labeling");
    if (diagram?.type !== "diagram-labeling") throw new Error("fixture has no diagram");
    diagram.diagramId = "volcano";
    expect(issuesFor(lesson)).toContain("Unknown diagram");
  });

  it("rejects diagram labels pointing at targets the diagram lacks", () => {
    const lesson = clone();
    const diagram = lesson.sections.find((s) => s.type === "diagram-labeling");
    if (diagram?.type !== "diagram-labeling") throw new Error("fixture has no diagram");
    diagram.labels[0].targetId = "lava";
    expect(issuesFor(lesson)).toContain('Diagram has no target "lava"');
  });

  it("rejects sorting items assigned to unknown categories", () => {
    const lesson = clone();
    const sorting = lesson.sections.find((s) => s.type === "sorting");
    if (sorting?.type !== "sorting") throw new Error("fixture has no sorting");
    sorting.items[0].categoryId = "cat-missing";
    expect(issuesFor(lesson)).toContain('Unknown category "cat-missing"');
  });

  it("accepts a put-in-order section, and rejects one with repeated or too few steps", () => {
    const withSequence = (steps: { id: string; text: string; explanation: string }[]) => {
      const lesson = clone();
      lesson.sections[3] = {
        id: lesson.sections[3].id,
        type: "sequence",
        title: "Order the water cycle",
        instructions: "Put the steps in order.",
        steps,
      };
      return lesson;
    };
    const step = (id: string, text: string) => ({ id, text, explanation: "Because." });

    expect(issuesFor(withSequence([step("s1", "Sun heats water"), step("s2", "Vapour rises"), step("s3", "Clouds form")]))).toEqual([]);
    expect(issuesFor(withSequence([step("s1", "Sun heats water"), step("s2", "sun heats water "), step("s3", "Clouds form")]))).toContain(
      "Two steps have the same text",
    );
    expect(issuesFor(withSequence([step("s1", "Sun heats water"), step("s1", "Vapour rises"), step("s3", "Clouds form")]))).toContain(
      'Duplicate step id "s1"',
    );
    expect(issuesFor(withSequence([step("s1", "Sun heats water"), step("s2", "Vapour rises")])).length).toBeGreaterThan(0);
  });

  it("accepts a match-pairs section, and rejects one with an ambiguous side", () => {
    const withMatching = (pairs: { id: string; left: string; right: string; explanation: string }[]) => {
      const lesson = clone();
      const index = lesson.sections.findIndex((s) => s.type === "sorting");
      lesson.sections[index] = {
        id: lesson.sections[index].id,
        type: "matching",
        title: "Match the stages",
        instructions: "Match each stage with what happens.",
        pairs,
      };
      return lesson;
    };
    const pair = (id: string, left: string, right: string) => ({ id, left, right, explanation: "Because." });

    expect(issuesFor(withMatching([pair("p1", "Evaporation", "Water rises"), pair("p2", "Condensation", "Clouds form"), pair("p3", "Precipitation", "Rain falls")]))).toEqual([]);
    expect(issuesFor(withMatching([pair("p1", "Evaporation", "Water rises"), pair("p2", "Condensation", "water rises"), pair("p3", "Precipitation", "Rain falls")]))).toContain(
      "Two pairs have the same right side",
    );
    expect(issuesFor(withMatching([pair("p1", "Evaporation", "Water rises"), pair("p2", "evaporation ", "Clouds form"), pair("p3", "Precipitation", "Rain falls")]))).toContain(
      "Two pairs have the same left side",
    );
  });

  it("accepts a myth-or-fact warm-up only with at least one myth and one fact", () => {
    const withStatements = (facts: boolean[]) => {
      const lesson = clone();
      const index = lesson.sections.findIndex((s) => s.type === "prediction");
      lesson.sections[index] = {
        id: lesson.sections[index].id,
        type: "myth-or-fact",
        title: "Myth or fact?",
        instructions: "Decide for each one.",
        statements: facts.map((isFact, i) => ({ id: `s${i}`, text: `Statement ${i}`, isFact, explanation: "Because." })),
      };
      return lesson;
    };
    expect(issuesFor(withStatements([false, true, false]))).toEqual([]);
    expect(issuesFor(withStatements([false, false, false]))).toContain("Include at least one myth and one fact");
    expect(issuesFor(withStatements([true, true, true]))).toContain("Include at least one myth and one fact");
  });

  it("rejects source URLs that are not valid URLs", () => {
    const lesson = clone();
    lesson.sources![0].url = "not a url";
    expect(lessonSchema.safeParse(lesson).success).toBe(false);
  });
});
