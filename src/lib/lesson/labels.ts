import type { Dictionary } from "@/lib/i18n";
import type { Lesson } from "./schema";

/** A saved copy of a curated sample may have been changed by the user, so it is no longer the curated original. */
export function originLabel(lesson: Lesson, isSample: boolean, t: Dictionary): string {
  return lesson.contentOrigin === "curated" && !isSample ? t.origin.sampleCopy : t.origin[lesson.contentOrigin];
}
