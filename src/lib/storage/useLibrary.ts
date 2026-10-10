"use client";

import { useCallback, useEffect, useState } from "react";
import type { Lesson } from "@/lib/lesson/schema";
import { deleteSavedLesson, listLatestAttempts, listSavedLessons, type QuizAttempt } from "./db";

export type Library =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; lessons: Lesson[]; attempts: Map<string, QuizAttempt> };

async function loadLibrary(): Promise<Library> {
  try {
    const [lessons, attempts] = await Promise.all([listSavedLessons(), listLatestAttempts()]);
    return { status: "ready", lessons, attempts: new Map(attempts.map((a) => [a.lessonId, a])) };
  } catch {
    return { status: "error" };
  }
}

export function useLibrary() {
  const [library, setLibrary] = useState<Library>({ status: "loading" });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void loadLibrary().then((next) => {
      if (!cancelled) setLibrary(next);
    });
    return () => {
      cancelled = true;
    };
  }, [version]);

  const remove = useCallback(async (id: string) => {
    await deleteSavedLesson(id);
    setVersion((v) => v + 1);
  }, []);

  return { library, remove };
}
