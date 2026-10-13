"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { SourceList } from "@/components/lesson/SourceList";
import { Button, ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { Dictionary } from "@/lib/i18n";
import { useT } from "@/lib/i18n/client";
import type { Lesson } from "@/lib/lesson/schema";
import { type QuizAnswers, scoreQuiz } from "@/lib/quiz/scoring";

function headline(score: number, total: number, t: Dictionary["quiz"]) {
  if (score === total) return t.headlines.perfect;
  if (score >= total - 1) return t.headlines.great;
  if (score >= Math.ceil(total / 2)) return t.headlines.good;
  return t.headlines.tryAgain;
}

export function QuizResults({
  lesson,
  answers,
  onRetry,
}: {
  lesson: Lesson;
  answers: QuizAnswers;
  onRetry: () => void;
}) {
  const t = useT().quiz;
  const result = scoreQuiz(lesson, answers);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const sectionHref = (sectionId: string) => `/lessons/${lesson.id}/present?section=${sectionId}`;

  useEffect(() => headingRef.current?.focus(), []);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 md:py-12">
      <section className="rounded-3xl bg-surface p-8 text-center shadow-sm ring-1 ring-line">
        <p className="font-bold text-muted">{t.yourScore}</p>
        <p className="my-2 text-7xl font-extrabold text-brand-600">
          {result.score} <span className="text-4xl text-muted">/ {result.total}</span>
        </p>
        <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-extrabold outline-none md:text-3xl">
          {headline(result.score, result.total, t)}
        </h1>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button size="lg" onClick={onRetry}>
            {t.retry}
          </Button>
          <ButtonLink href="/" variant="secondary" size="lg">
            {t.returnToLibrary}
          </ButtonLink>
        </div>
      </section>

      {result.conceptsToRevisit.length > 0 && (
        <section className="mt-8" aria-labelledby="revisit-heading">
          <h2 id="revisit-heading" className="mb-3 text-2xl font-extrabold">
            {t.conceptsToRevisit}
          </h2>
          <ul className="space-y-3">
            {result.conceptsToRevisit.map(({ objective, sections }) => (
              <li key={objective.id} className="rounded-3xl bg-sun-100 p-5">
                <p className="text-lg font-bold">{objective.description}</p>
                <p className="mt-2 flex flex-wrap gap-2">
                  {sections.map((s) => (
                    <Link
                      key={s.id}
                      href={sectionHref(s.id)}
                      className="rounded-full bg-surface px-4 py-2 font-bold text-brand-700 ring-1 ring-line hover:ring-brand-500"
                    >
                      {t.revisit(s.title)} <span aria-hidden="true">→</span>
                    </Link>
                  ))}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8" aria-labelledby="review-heading">
        <h2 id="review-heading" className="mb-3 text-2xl font-extrabold">
          {t.answerReview}
        </h2>
        <ol className="space-y-3">
          {result.questions.map(({ question, selectedOptionId, correct, section }, i) => {
            const selected = question.options.find((o) => o.id === selectedOptionId);
            const right = question.options.find((o) => o.id === question.correctOptionId)!;
            return (
              <li
                key={question.id}
                className={cn(
                  "rounded-3xl border-l-8 bg-surface p-5 shadow-sm ring-1 ring-line",
                  correct ? "border-good-500" : "border-miss-500",
                )}
              >
                <p className="font-bold text-muted">
                  {t.questionStatus(i + 1, correct)}
                </p>
                <p className="mt-1 text-lg font-extrabold">{question.prompt}</p>
                <p className="mt-2">
                  {t.yourAnswer} <strong>{selected?.text ?? t.noAnswer}</strong>
                </p>
                {!correct && (
                  <>
                    <p>
                      {t.correctAnswer} <strong>{right.text}</strong>
                    </p>
                    <p className="mt-2 text-muted">{question.explanation}</p>
                    <SourceList
                      lesson={lesson}
                      ids={question.sourceIds}
                      showExcerpts={false}
                      className="mt-2 text-sm"
                    />
                    {section && (
                      <Link
                        href={sectionHref(section.id)}
                        className="mt-2 inline-block font-bold text-brand-700 underline underline-offset-2"
                      >
                        {t.revisitQuoted(section.title)}
                      </Link>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
