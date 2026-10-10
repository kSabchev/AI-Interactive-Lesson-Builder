import type { SectionOfType } from "@/lib/lesson/schema";

/** Label id per diagram target id. */
export type LabelPlacements = Record<string, string>;

/** Category id per sorting item id. */
export type SortPlacements = Record<string, string>;

export type PlacementCheck = {
  correctIds: string[];
  incorrectIds: string[];
  allCorrect: boolean;
};

/** Returns ids of targets whose placed label is right or wrong. Empty targets are ignored. */
export function checkLabels(
  section: SectionOfType<"diagram-labeling">,
  placements: LabelPlacements,
): PlacementCheck {
  const correctIds: string[] = [];
  const incorrectIds: string[] = [];
  for (const [targetId, labelId] of Object.entries(placements)) {
    const label = section.labels.find((l) => l.id === labelId);
    (label?.targetId === targetId ? correctIds : incorrectIds).push(targetId);
  }
  return { correctIds, incorrectIds, allCorrect: correctIds.length === section.labels.length };
}

/** Returns ids of items placed in the right or wrong category. Unplaced items are ignored. */
export function checkSorting(section: SectionOfType<"sorting">, placements: SortPlacements): PlacementCheck {
  const correctIds: string[] = [];
  const incorrectIds: string[] = [];
  for (const item of section.items) {
    const placed = placements[item.id];
    if (!placed) continue;
    (placed === item.categoryId ? correctIds : incorrectIds).push(item.id);
  }
  return { correctIds, incorrectIds, allCorrect: correctIds.length === section.items.length };
}
