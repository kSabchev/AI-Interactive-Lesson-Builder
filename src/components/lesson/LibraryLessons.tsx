"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { SAMPLE_LESSONS } from "@/content/samples";
import { useT } from "@/lib/i18n/client";
import type { Lesson } from "@/lib/lesson/schema";
import type { QuizAttempt } from "@/lib/quiz/attempt";
import { browserStore, importBrowserData } from "@/lib/storage/store";
import { useStore } from "@/lib/storage/StoreProvider";
import { useLibrary } from "@/lib/storage/useLibrary";
import { LessonCard } from "./LessonCard";

const actionClass =
  "rounded-full px-3 py-1.5 text-sm font-bold text-brand-700 ring-1 ring-line hover:bg-brand-50 hover:ring-brand-200";

function LastScore({ lesson, attempt }: { lesson: Lesson; attempt: QuizAttempt | undefined }) {
  const t = useT();
  if (!attempt) return null;
  return (
    <Link href={`/lessons/${lesson.id}/quiz?view=results`} className={actionClass}>
      {t.library.lastQuiz(attempt.score, attempt.total)}
    </Link>
  );
}

function DeleteButton({ lesson, onDelete }: { lesson: Lesson; onDelete: () => Promise<void> }) {
  const t = useT();
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="ml-auto rounded-full px-3 py-1.5 text-sm font-bold text-miss-700 hover:bg-miss-50"
      >
        {t.common.delete}
      </button>
    );
  }
  return (
    <span className="ml-auto flex items-center gap-1" role="group" aria-label={t.library.deleteConfirmLabel(lesson.title)}>
      <button
        type="button"
        autoFocus
        onClick={() => void onDelete()}
        className="rounded-full bg-miss-500 px-3 py-1.5 text-sm font-bold text-white hover:bg-miss-700"
      >
        {t.library.deleteForGood}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="rounded-full px-3 py-1.5 text-sm font-bold text-muted hover:bg-paper"
      >
        {t.common.cancel}
      </button>
    </span>
  );
}

/** After signing in, offers to move lessons saved in this browser into the account. */
function ImportBanner({ onImported }: { onImported: () => void }) {
  const t = useT();
  const state = useStore();
  const signedIn = state.status === "ready" && state.user !== null;
  const [count, setCount] = useState(0);
  const [status, setStatus] = useState<"idle" | "importing" | "failed" | "dismissed">("idle");

  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;
    browserStore
      .listLessons()
      .then((lessons) => !cancelled && setCount(lessons.length))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [signedIn]);

  if (!signedIn || count === 0 || status === "dismissed") return null;

  async function runImport() {
    setStatus("importing");
    try {
      await importBrowserData();
      setCount(0);
      onImported();
    } catch {
      setStatus("failed");
    }
  }

  return (
    <section aria-label={t.library.importRegion} className="mt-8 rounded-3xl bg-brand-50 p-5 ring-1 ring-brand-200">
      <p className="font-bold">{t.library.importCount(count)}</p>
      <p className="mt-1 text-muted">{t.library.importHint}</p>
      {status === "failed" && (
        <p role="alert" className="mt-2 font-bold text-miss-700">
          {t.library.importFailed}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={() => void runImport()} disabled={status === "importing"}>
          {status === "importing" ? t.library.importing : t.library.importAction}
        </Button>
        <Button variant="ghost" onClick={() => setStatus("dismissed")}>
          {t.library.notNow}
        </Button>
      </div>
    </section>
  );
}

export function LibraryLessons() {
  const t = useT();
  const { library, remove, refresh } = useLibrary();
  const attempts = library.status === "ready" ? library.attempts : new Map<string, QuizAttempt>();

  // Returning users see their own lessons first; first-time visitors see the samples first.
  const hasSaved = library.status === "ready" && library.lessons.length > 0;

  const savedSection = (
    <section className="mt-12" aria-labelledby="saved-heading">
      <h2 id="saved-heading" className="mb-4 text-2xl font-extrabold">
        {t.library.yourLessons}
      </h2>
      {library.status === "loading" && <p className="text-muted">{t.library.loadingLessons}</p>}
      {library.status === "error" && (
        <p className="rounded-2xl bg-miss-50 p-4 text-miss-700">
          {library.store === "account" ? t.library.loadErrorAccount : t.library.loadErrorBrowser}
        </p>
      )}
      {library.status === "ready" && library.lessons.length === 0 && (
        <p className="rounded-2xl border-2 border-dashed border-line p-6 text-muted">
          {t.library.emptyStart} <strong>{t.library.editACopy}</strong> {t.library.emptyEnd}{" "}
          {library.store === "account" ? (
            t.library.savedToAccount
          ) : (
            <>
              {t.library.keptInBrowser}{" "}
              <Link href="/sign-in" className="font-bold text-brand-700 underline underline-offset-2">
                {t.common.signIn}
              </Link>
              {t.library.signInToKeep}
            </>
          )}
        </p>
      )}
      {library.status === "ready" && library.lessons.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {library.lessons.map((lesson) => (
            <li key={lesson.id}>
              <LessonCard lesson={lesson} isSample={false}>
                <Link href={`/lessons/${lesson.id}/edit`} className={actionClass}>
                  {t.common.edit}
                </Link>
                <LastScore lesson={lesson} attempt={attempts.get(lesson.id)} />
                <DeleteButton lesson={lesson} onDelete={() => remove(lesson.id)} />
              </LessonCard>
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  const samplesSection = (
    <section className="mt-12" aria-labelledby="samples-heading">
      <h2 id="samples-heading" className="mb-4 text-2xl font-extrabold">
        {t.library.trySample}
      </h2>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SAMPLE_LESSONS.map((lesson) => (
          <li key={lesson.id}>
            <LessonCard lesson={lesson} isSample>
              <Link href={`/lessons/${lesson.id}/edit`} className={actionClass}>
                {t.library.editACopy}
              </Link>
              <LastScore lesson={lesson} attempt={attempts.get(lesson.id)} />
            </LessonCard>
          </li>
        ))}
      </ul>
    </section>
  );

  return hasSaved || library.status === "error" ? (
    <>
      <ImportBanner onImported={refresh} />
      {savedSection}
      {samplesSection}
    </>
  ) : (
    <>
      <ImportBanner onImported={refresh} />
      {samplesSection}
      {savedSection}
    </>
  );
}
