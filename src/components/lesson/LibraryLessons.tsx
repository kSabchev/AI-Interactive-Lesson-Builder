"use client";

import Link from "next/link";
import { useState } from "react";
import { SAMPLE_LESSONS } from "@/content/samples";
import type { Lesson } from "@/lib/lesson/schema";
import type { QuizAttempt } from "@/lib/storage/db";
import { useLibrary } from "@/lib/storage/useLibrary";
import { LessonCard } from "./LessonCard";

const actionClass =
  "rounded-full px-3 py-1.5 text-sm font-bold text-brand-700 ring-1 ring-line hover:bg-brand-50 hover:ring-brand-200";

function LastScore({ lesson, attempt }: { lesson: Lesson; attempt: QuizAttempt | undefined }) {
  if (!attempt) return null;
  return (
    <Link href={`/lessons/${lesson.id}/quiz?view=results`} className={actionClass}>
      Last quiz: {attempt.score}/{attempt.total}
    </Link>
  );
}

function DeleteButton({ lesson, onDelete }: { lesson: Lesson; onDelete: () => Promise<void> }) {
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="ml-auto rounded-full px-3 py-1.5 text-sm font-bold text-miss-700 hover:bg-miss-50"
      >
        Delete
      </button>
    );
  }
  return (
    <span className="ml-auto flex items-center gap-1" role="group" aria-label={`Delete ${lesson.title}?`}>
      <button
        type="button"
        autoFocus
        onClick={() => void onDelete()}
        className="rounded-full bg-miss-500 px-3 py-1.5 text-sm font-bold text-white hover:bg-miss-700"
      >
        Delete for good
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="rounded-full px-3 py-1.5 text-sm font-bold text-muted hover:bg-paper"
      >
        Cancel
      </button>
    </span>
  );
}

export function LibraryLessons() {
  const { library, remove } = useLibrary();
  const attempts = library.status === "ready" ? library.attempts : new Map<string, QuizAttempt>();

  // Returning users see their own lessons first; first-time visitors see the samples first.
  const hasSaved = library.status === "ready" && library.lessons.length > 0;

  const savedSection = (
    <section className="mt-12" aria-labelledby="saved-heading">
      <h2 id="saved-heading" className="mb-4 text-2xl font-extrabold">
        Your lessons
      </h2>
      {library.status === "loading" && <p className="text-muted">Loading your lessons…</p>}
      {library.status === "error" && (
        <p className="rounded-2xl bg-miss-50 p-4 text-miss-700">
          Your saved lessons couldn&apos;t be loaded. This browser may be blocking local storage (for example in
          private browsing). The sample lessons still work.
        </p>
      )}
      {library.status === "ready" && library.lessons.length === 0 && (
        <p className="rounded-2xl border-2 border-dashed border-line p-6 text-muted">
          Nothing saved yet. Choose <strong>Edit a copy</strong> on a sample to make it your own. Your lessons
          are kept in this browser.
        </p>
      )}
      {library.status === "ready" && library.lessons.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {library.lessons.map((lesson) => (
            <li key={lesson.id}>
              <LessonCard lesson={lesson} isSample={false}>
                <Link href={`/lessons/${lesson.id}/edit`} className={actionClass}>
                  Edit
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
        Try a sample lesson
      </h2>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SAMPLE_LESSONS.map((lesson) => (
          <li key={lesson.id}>
            <LessonCard lesson={lesson} isSample>
              <Link href={`/lessons/${lesson.id}/edit`} className={actionClass}>
                Edit a copy
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
      {savedSection}
      {samplesSection}
    </>
  ) : (
    <>
      {samplesSection}
      {savedSection}
    </>
  );
}
