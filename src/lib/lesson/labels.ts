import type { ContentOrigin, Lesson, LessonSection } from "./schema";

export const ORIGIN_LABELS: Record<ContentOrigin, string> = {
  curated: "Curated sample",
  reference: "Reference-based",
  "web-research": "Web-researched",
  "ai-draft": "AI draft",
};

/** A saved copy of a curated sample may have been changed by the user, so it is no longer the curated original. */
export function originLabel(lesson: Lesson, isSample: boolean): string {
  return lesson.contentOrigin === "curated" && !isSample ? "Sample copy" : ORIGIN_LABELS[lesson.contentOrigin];
}

export const SECTION_TYPE_LABELS: Record<LessonSection["type"], string> = {
  hook: "Hook",
  explanation: "Explanation",
  prediction: "Prediction",
  "diagram-labeling": "Diagram",
  sorting: "Sorting",
  recap: "Recap",
};
