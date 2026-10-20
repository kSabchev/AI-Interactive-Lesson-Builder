import { describe, expect, it } from "vitest";
import { getSampleLesson } from "@/content/samples";
import type { SectionOfType } from "@/lib/lesson/schema";
import {
  assignMatch,
  checkLabels,
  checkMatching,
  checkMythOrFact,
  checkSequence,
  checkSorting,
  moveStep,
  shuffledRightSides,
  shuffledSteps,
} from "./checking";

const lesson = getSampleLesson("sample-water-cycle")!;
const diagram = lesson.sections.find((s) => s.type === "diagram-labeling") as SectionOfType<"diagram-labeling">;
const sorting = lesson.sections.find((s) => s.type === "sorting") as SectionOfType<"sorting">;

describe("checkLabels", () => {
  it("accepts a fully correct arrangement", () => {
    const placements = Object.fromEntries(diagram.labels.map((l) => [l.targetId, l.id]));
    expect(checkLabels(diagram, placements)).toMatchObject({ allCorrect: true, incorrectIds: [] });
  });

  it("flags swapped labels and is not complete with gaps", () => {
    const result = checkLabels(diagram, { evaporation: "lbl-condensation", condensation: "lbl-evaporation" });
    expect(result.incorrectIds.sort()).toEqual(["condensation", "evaporation"]);
    expect(result.allCorrect).toBe(false);
  });
});

describe("checkSorting", () => {
  it("accepts a fully correct arrangement", () => {
    const placements = Object.fromEntries(sorting.items.map((i) => [i.id, i.categoryId]));
    expect(checkSorting(sorting, placements).allCorrect).toBe(true);
  });

  it("flags misplaced items", () => {
    const placements = Object.fromEntries(sorting.items.map((i) => [i.id, i.categoryId]));
    placements["item-dew"] = "cat-precipitation";
    const result = checkSorting(sorting, placements);
    expect(result.incorrectIds).toEqual(["item-dew"]);
    expect(result.allCorrect).toBe(false);
  });
});

const sequence = (stepCount: number, id = "sec-activity"): SectionOfType<"sequence"> => ({
  id,
  type: "sequence",
  title: "Put it in order",
  instructions: "Put the steps in order.",
  objectiveIds: [],
  sourceIds: [],
  steps: Array.from({ length: stepCount }, (_, i) => ({ id: `step-${i + 1}`, text: `Step ${i + 1}`, explanation: "Because." })),
});

describe("checkSequence", () => {
  const section = sequence(4);

  it("accepts the correct order", () => {
    expect(checkSequence(section, ["step-1", "step-2", "step-3", "step-4"])).toEqual({
      correctIds: ["step-1", "step-2", "step-3", "step-4"],
      incorrectIds: [],
      allCorrect: true,
    });
  });

  it("marks each step by whether it sits in its own position", () => {
    const result = checkSequence(section, ["step-1", "step-3", "step-2", "step-4"]);
    expect(result.correctIds).toEqual(["step-1", "step-4"]);
    expect(result.incorrectIds).toEqual(["step-3", "step-2"]);
    expect(result.allCorrect).toBe(false);
  });
});

describe("shuffledSteps", () => {
  it("is a shuffle of all the steps, the same every time for the same section", () => {
    const section = sequence(5);
    const order = shuffledSteps(section);
    expect([...order].sort()).toEqual(section.steps.map((s) => s.id).sort());
    expect(shuffledSteps(section)).toEqual(order);
  });

  it("never starts in the correct order, for any number of steps or section", () => {
    for (let count = 3; count <= 6; count++) {
      for (let n = 0; n < 50; n++) {
        const section = sequence(count, `sec-${n}`);
        expect(checkSequence(section, shuffledSteps(section)).allCorrect).toBe(false);
      }
    }
  });
});

describe("moveStep", () => {
  it("swaps a step with its neighbour, and ignores moves off either end", () => {
    const order = ["a", "b", "c"];
    expect(moveStep(order, 1, 0)).toEqual(["b", "a", "c"]);
    expect(moveStep(order, 1, 2)).toEqual(["a", "c", "b"]);
    expect(moveStep(order, 0, -1)).toBe(order);
    expect(moveStep(order, 2, 3)).toBe(order);
  });
});

const matching = (pairCount: number, id = "sec-practice"): SectionOfType<"matching"> => ({
  id,
  type: "matching",
  title: "Match the pairs",
  instructions: "Match each part with its job.",
  objectiveIds: [],
  sourceIds: [],
  pairs: Array.from({ length: pairCount }, (_, i) => ({
    id: `pair-${i + 1}`,
    left: `Part ${i + 1}`,
    right: `Job ${i + 1}`,
    explanation: "Because.",
  })),
});

describe("checkMatching", () => {
  const section = matching(3);

  it("marks each left item by whether it got its own partner, ignoring unmatched ones", () => {
    expect(checkMatching(section, { "pair-1": "pair-1", "pair-2": "pair-3", "pair-3": "pair-2" })).toEqual({
      correctIds: ["pair-1"],
      incorrectIds: ["pair-2", "pair-3"],
      allCorrect: false,
    });
    expect(checkMatching(section, { "pair-1": "pair-1" }).incorrectIds).toEqual([]);
    expect(checkMatching(section, { "pair-1": "pair-1", "pair-2": "pair-2", "pair-3": "pair-3" }).allCorrect).toBe(true);
  });
});

describe("assignMatch", () => {
  it("uses each right side once: choosing a taken one moves it", () => {
    const first = assignMatch({}, "pair-1", "pair-2");
    expect(first).toEqual({ "pair-1": "pair-2" });
    expect(assignMatch(first, "pair-3", "pair-2")).toEqual({ "pair-3": "pair-2" });
    expect(assignMatch(first, "pair-1", "pair-1")).toEqual({ "pair-1": "pair-1" });
  });
});

describe("shuffledRightSides", () => {
  it("shuffles the same way every time and never lines up with the left side", () => {
    for (let count = 3; count <= 5; count++) {
      for (let n = 0; n < 50; n++) {
        const section = matching(count, `sec-${n}`);
        const order = shuffledRightSides(section);
        expect([...order].sort()).toEqual(section.pairs.map((p) => p.id).sort());
        expect(order).not.toEqual(section.pairs.map((p) => p.id));
        expect(shuffledRightSides(section)).toEqual(order);
      }
    }
  });
});

describe("checkMythOrFact", () => {
  const section: SectionOfType<"myth-or-fact"> = {
    id: "sec-warmup",
    type: "myth-or-fact",
    title: "Myth or fact?",
    instructions: "Decide.",
    objectiveIds: [],
    sourceIds: [],
    statements: [
      { id: "s1", text: "Plants eat soil.", isFact: false, explanation: "They make food from light." },
      { id: "s2", text: "Plants need light.", isFact: true, explanation: "Light powers photosynthesis." },
      { id: "s3", text: "Roots drink water.", isFact: true, explanation: "Roots take up water." },
    ],
  };

  it("scores answered statements and ignores unanswered ones", () => {
    expect(checkMythOrFact(section, { s1: false, s2: false })).toEqual({
      correctIds: ["s1"],
      incorrectIds: ["s2"],
      allCorrect: false,
    });
    expect(checkMythOrFact(section, { s1: false, s2: true, s3: true }).allCorrect).toBe(true);
  });
});
