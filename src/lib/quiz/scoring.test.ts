import { describe, expect, it } from "vitest";
import { getSampleLesson } from "@/content/samples";
import { scoreQuiz } from "./scoring";

const lesson = getSampleLesson("sample-water-cycle")!;
const allCorrect = Object.fromEntries(lesson.quiz.map((q) => [q.id, q.correctOptionId]));

describe("scoreQuiz", () => {
  it("scores a perfect attempt with nothing to revisit", () => {
    const result = scoreQuiz(lesson, allCorrect);
    expect(result.score).toBe(5);
    expect(result.total).toBe(5);
    expect(result.conceptsToRevisit).toEqual([]);
  });

  it("groups missed questions by objective and links their sections", () => {
    const result = scoreQuiz(lesson, { ...allCorrect, q2: "a", q3: "b" });
    expect(result.score).toBe(3);
    expect(result.conceptsToRevisit).toHaveLength(1);
    const [concept] = result.conceptsToRevisit;
    expect(concept.objective.id).toBe("obj-clouds-rain");
    expect(concept.missedQuestionIds).toEqual(["q2", "q3"]);
    expect(concept.sections.map((s) => s.id)).toEqual(["sec-evaporation", "sec-rain"]);
  });

  it("treats unanswered questions as missed", () => {
    const answers = { ...allCorrect };
    delete answers.q4;
    const result = scoreQuiz(lesson, answers);
    expect(result.score).toBe(4);
    expect(result.questions.find((q) => q.question.id === "q4")?.selectedOptionId).toBeUndefined();
    expect(result.conceptsToRevisit.map((c) => c.objective.id)).toEqual(["obj-cycle"]);
  });

  it("orders concepts to revisit by objective order", () => {
    const result = scoreQuiz(lesson, { q1: "a", q2: "a", q3: "b", q4: "a", q5: "a" });
    expect(result.score).toBe(0);
    expect(result.conceptsToRevisit.map((c) => c.objective.id)).toEqual([
      "obj-evaporation",
      "obj-clouds-rain",
      "obj-cycle",
    ]);
  });
});
