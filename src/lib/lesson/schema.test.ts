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

  it("requires exactly three objectives and five quiz questions", () => {
    const lesson = clone();
    lesson.objectives.pop();
    lesson.quiz.pop();
    expect(lessonSchema.safeParse(lesson).success).toBe(false);
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

  it("rejects source URLs that are not valid URLs", () => {
    const lesson = clone();
    lesson.sources![0].url = "not a url";
    expect(lessonSchema.safeParse(lesson).success).toBe(false);
  });
});
