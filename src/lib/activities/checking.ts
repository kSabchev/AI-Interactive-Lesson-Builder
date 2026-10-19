import type { SectionOfType } from "@/lib/lesson/schema";

/** Label id per diagram target id. */
export type LabelPlacements = Record<string, string>;

/** Category id per sorting item id. */
export type SortPlacements = Record<string, string>;

/** For matching: the pair id whose right side the learner chose, per pair id (left side). */
export type MatchPlacements = Record<string, string>;

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

/** Returns ids of steps that are, or aren't, in their correct position in `order` (a list of step ids). */
export function checkSequence(section: SectionOfType<"sequence">, order: string[]): PlacementCheck {
  const correctIds: string[] = [];
  const incorrectIds: string[] = [];
  order.forEach((stepId, position) => {
    (section.steps[position]?.id === stepId ? correctIds : incorrectIds).push(stepId);
  });
  return { correctIds, incorrectIds, allCorrect: incorrectIds.length === 0 && correctIds.length === section.steps.length };
}

/** A small deterministic random generator, so a section is always shuffled the same way. */
function seededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

/**
 * The order the steps start in: shuffled the same way every time for the same section (so the server and the
 * browser agree, and coming back to the section looks the same), and never already correct.
 */
export function shuffledSteps(section: SectionOfType<"sequence">): string[] {
  const ids = section.steps.map((step) => step.id);
  const random = seededRandom(`${section.id}:${ids.join(",")}`);
  const order = [...ids];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  // A shuffle that happens to be correct would give the answer away: move the first step to the end.
  if (order.every((stepId, i) => stepId === ids[i])) order.push(order.shift()!);
  return order;
}

/** `order` with the step at `from` swapped with its neighbour at `to`; unchanged if `to` is out of range. */
export function moveStep(order: string[], from: number, to: number): string[] {
  if (to < 0 || to >= order.length) return order;
  const next = [...order];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

/** Returns ids of pairs (by left side) matched with the right or wrong partner. Unmatched ones are ignored. */
export function checkMatching(section: SectionOfType<"matching">, matches: MatchPlacements): PlacementCheck {
  const correctIds: string[] = [];
  const incorrectIds: string[] = [];
  for (const pair of section.pairs) {
    const chosen = matches[pair.id];
    if (!chosen) continue;
    (chosen === pair.id ? correctIds : incorrectIds).push(pair.id);
  }
  return { correctIds, incorrectIds, allCorrect: correctIds.length === section.pairs.length };
}

/**
 * The order the right-hand side is shown in: shuffled the same way every time for the same section, and never
 * lined up with the left side, which would give the answers away.
 */
export function shuffledRightSides(section: SectionOfType<"matching">): string[] {
  const ids = section.pairs.map((pair) => pair.id);
  const random = seededRandom(`${section.id}:match:${ids.join(",")}`);
  const order = [...ids];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  if (order.every((pairId, i) => pairId === ids[i])) order.push(order.shift()!);
  return order;
}

/**
 * Matches `leftId` with the right side of `rightId`. Each right side can be used once, so choosing one that
 * is already taken moves it from its previous left item.
 */
export function assignMatch(matches: MatchPlacements, leftId: string, rightId: string): MatchPlacements {
  const next = Object.fromEntries(Object.entries(matches).filter(([, chosen]) => chosen !== rightId));
  next[leftId] = rightId;
  return next;
}
