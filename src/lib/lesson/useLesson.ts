"use client";

import { getSampleLesson } from "@/content/samples";
import type { Lesson } from "./schema";

export type LessonLookup = { status: "ready"; lesson: Lesson } | { status: "missing" };

/** Resolves a lesson by id. Curated samples only for now; saved lessons arrive with local persistence. */
export function useLesson(id: string): LessonLookup {
  const lesson = getSampleLesson(id);
  return lesson ? { status: "ready", lesson } : { status: "missing" };
}
