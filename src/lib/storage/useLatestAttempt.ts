"use client";

import { useEffect, useState } from "react";
import type { QuizAttempt } from "@/lib/quiz/attempt";
import { useStore } from "./StoreProvider";

export type AttemptLookup = { status: "loading" } | { status: "ready"; attempt: QuizAttempt | undefined };

export function useLatestAttempt(lessonId: string): AttemptLookup {
  const state = useStore();
  const store = state.status === "ready" ? state.store : undefined;
  const key = `${store?.kind}:${lessonId}`;
  const [result, setResult] = useState<{ key: string; attempt: QuizAttempt | undefined }>();

  useEffect(() => {
    if (!store) return;
    let cancelled = false;
    store
      .getAttempt(lessonId)
      .catch(() => undefined)
      .then((attempt) => {
        if (!cancelled) setResult({ key, attempt });
      });
    return () => {
      cancelled = true;
    };
  }, [key, lessonId, store]);

  return result?.key === key ? { status: "ready", attempt: result.attempt } : { status: "loading" };
}
