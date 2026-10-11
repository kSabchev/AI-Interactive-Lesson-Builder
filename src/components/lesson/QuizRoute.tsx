"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import { useLesson } from "@/lib/lesson/useLesson";
import { useLatestAttempt } from "@/lib/storage/useLatestAttempt";
import { LessonLoadError, LessonLoading, LessonNotFound } from "./LessonNotFound";

export function QuizRoute() {
  const { id } = useParams<{ id: string }>();
  const showLastResults = useSearchParams().get("view") === "results";
  const lookup = useLesson(id);
  const latest = useLatestAttempt(id);

  if (lookup.status === "loading" || (showLastResults && latest.status === "loading")) return <LessonLoading />;
  if (lookup.status === "missing") return <LessonNotFound />;
  if (lookup.status === "error") return <LessonLoadError message={lookup.message} />;
  const { lesson } = lookup;
  const previous = showLastResults && latest.status === "ready" ? latest.attempt : undefined;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line bg-surface/80">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-2">
          <Link
            href={`/lessons/${lesson.id}/present`}
            className="rounded-full px-3 py-2 font-bold text-muted hover:bg-brand-50 hover:text-ink"
          >
            <span aria-hidden="true">←</span> Lesson
          </Link>
          <p className="min-w-0 flex-1 truncate text-center font-extrabold">{lesson.title}</p>
          <Link href="/" className="rounded-full px-3 py-2 font-bold text-muted hover:bg-brand-50 hover:text-ink">
            Library
          </Link>
        </div>
      </header>
      <main className="flex-1">
        <QuizRunner lesson={lesson} previousAnswers={previous?.answers} />
      </main>
    </div>
  );
}
