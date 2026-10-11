"use client";

import { useCallback, useEffect, useState } from "react";
import type { Lesson } from "@/lib/lesson/schema";
import type { QuizAttempt } from "@/lib/quiz/attempt";
import type { LessonStore } from "./store";
import { useStore } from "./StoreProvider";

export type Library =
  | { status: "loading" }
  | { status: "error"; store: LessonStore["kind"] }
  | { status: "ready"; store: LessonStore["kind"]; lessons: Lesson[]; attempts: Map<string, QuizAttempt> };

async function loadLibrary(store: LessonStore): Promise<Library> {
  try {
    const [lessons, attempts] = await Promise.all([store.listLessons(), store.listAttempts()]);
    return { status: "ready", store: store.kind, lessons, attempts: new Map(attempts.map((a) => [a.lessonId, a])) };
  } catch {
    return { status: "error", store: store.kind };
  }
}

export function useLibrary() {
  const state = useStore();
  const store = state.status === "ready" ? state.store : undefined;
  const [library, setLibrary] = useState<{ kind: string; value: Library }>();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!store) return;
    let cancelled = false;
    void loadLibrary(store).then((value) => {
      if (!cancelled) setLibrary({ kind: store.kind, value });
    });
    return () => {
      cancelled = true;
    };
  }, [store, version]);

  const remove = useCallback(
    async (id: string) => {
      if (!store) return;
      await store.deleteLesson(id);
      setVersion((v) => v + 1);
    },
    [store],
  );

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const current: Library = store && library?.kind === store.kind ? library.value : { status: "loading" };
  return { library: current, remove, refresh };
}
