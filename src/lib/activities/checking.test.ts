import { describe, expect, it } from "vitest";
import { getSampleLesson } from "@/content/samples";
import type { SectionOfType } from "@/lib/lesson/schema";
import { checkLabels, checkSorting } from "./checking";

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
