"use client";

import { useEffect, useState } from "react";
import { getSampleLesson } from "@/content/samples";
import { getSavedLesson } from "@/lib/storage/db";
import type { Lesson } from "./schema";

export type LessonLookup =
  | { status: "loading" }
  | { status: "ready"; lesson: Lesson; isSample: boolean }
  | { status: "missing" };

/** Resolves a lesson by id: curated samples synchronously, saved lessons from IndexedDB. */
export function useLesson(id: string): LessonLookup {
  const sample = getSampleLesson(id);
  const [saved, setSaved] = useState<{ id: string; lesson: Lesson | undefined } | undefined>();

  useEffect(() => {
    if (sample) return;
    let cancelled = false;
    getSavedLesson(id)
      .catch(() => undefined)
      .then((lesson) => {
        if (!cancelled) setSaved({ id, lesson });
      });
    return () => {
      cancelled = true;
    };
  }, [id, sample]);

  if (sample) return { status: "ready", lesson: sample, isSample: true };
  if (saved?.id !== id) return { status: "loading" };
  return saved.lesson ? { status: "ready", lesson: saved.lesson, isSample: false } : { status: "missing" };
}
