"use client";

import { useEffect, useState } from "react";
import { getLatestAttempt, type QuizAttempt } from "./db";

export type AttemptLookup = { status: "loading" } | { status: "ready"; attempt: QuizAttempt | undefined };

export function useLatestAttempt(lessonId: string): AttemptLookup {
  const [result, setResult] = useState<{ lessonId: string; attempt: QuizAttempt | undefined }>();

  useEffect(() => {
    let cancelled = false;
    getLatestAttempt(lessonId)
      .catch(() => undefined)
      .then((attempt) => {
        if (!cancelled) setResult({ lessonId, attempt });
      });
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  return result?.lessonId === lessonId ? { status: "ready", attempt: result.attempt } : { status: "loading" };
}
