"use client";

import { useEffect, useState } from "react";
import { getSampleLesson } from "@/content/samples";
import { useStore } from "@/lib/storage/StoreProvider";
import type { LessonStore } from "@/lib/storage/store";
import type { Lesson } from "./schema";

export type LessonLookup =
  | { status: "loading" }
  | { status: "ready"; lesson: Lesson; isSample: boolean }
  | { status: "missing" }
  | { status: "error"; message: string };

type Loaded = { key: string; lesson: Lesson | undefined } | { key: string; error: string };

/** Resolves a lesson by id: curated samples immediately, saved lessons from the active store. */
export function useLesson(id: string): LessonLookup {
  const sample = getSampleLesson(id);
  const state = useStore();
  const store: LessonStore | undefined = state.status === "ready" ? state.store : undefined;
  const key = `${store?.kind}:${id}`;
  const [loaded, setLoaded] = useState<Loaded>();

  useEffect(() => {
    if (sample || !store) return;
    let cancelled = false;
    store.getLesson(id).then(
      (lesson) => !cancelled && setLoaded({ key, lesson }),
      (error: Error) => !cancelled && setLoaded({ key, error: error.message }),
    );
    return () => {
      cancelled = true;
    };
  }, [id, key, sample, store]);

  if (sample) return { status: "ready", lesson: sample, isSample: true };
  if (loaded?.key !== key) return { status: "loading" };
  if ("error" in loaded) return { status: "error", message: loaded.error };
  return loaded.lesson ? { status: "ready", lesson: loaded.lesson, isSample: false } : { status: "missing" };
}
