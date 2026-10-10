"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { Lesson } from "@/lib/lesson/schema";
import { type QuizAnswers, scoreQuiz } from "@/lib/quiz/scoring";

function headline(score: number, total: number) {
  if (score === total) return "Amazing — a perfect score!";
  if (score >= total - 1) return "Great work!";
  if (score >= Math.ceil(total / 2)) return "Good effort!";
  return "Nice try — let's look back together.";
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
  const result = scoreQuiz(lesson, answers);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const sectionHref = (sectionId: string) => `/lessons/${lesson.id}/present?section=${sectionId}`;

  useEffect(() => headingRef.current?.focus(), []);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 md:py-12">
      <section className="rounded-3xl bg-surface p-8 text-center shadow-sm ring-1 ring-line">
        <p className="font-bold text-muted">Your score</p>
        <p className="my-2 text-7xl font-extrabold text-brand-600">
          {result.score} <span className="text-4xl text-muted">/ {result.total}</span>
        </p>
        <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-extrabold outline-none md:text-3xl">
          {headline(result.score, result.total)}
        </h1>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button size="lg" onClick={onRetry}>
            Retry quiz
          </Button>
          <ButtonLink href="/" variant="secondary" size="lg">
            Return to library
          </ButtonLink>
        </div>
      </section>

      {result.conceptsToRevisit.length > 0 && (
        <section className="mt-8" aria-labelledby="revisit-heading">
          <h2 id="revisit-heading" className="mb-3 text-2xl font-extrabold">
            Concepts to revisit
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
                      Revisit: {s.title} <span aria-hidden="true">→</span>
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
          Answer review
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
                  Question {i + 1} · {correct ? "Correct" : "Missed"}
                </p>
                <p className="mt-1 text-lg font-extrabold">{question.prompt}</p>
                <p className="mt-2">
                  Your answer: <strong>{selected?.text ?? "No answer"}</strong>
                </p>
                {!correct && (
                  <>
                    <p>
                      Correct answer: <strong>{right.text}</strong>
                    </p>
                    <p className="mt-2 text-muted">{question.explanation}</p>
                    {section && (
                      <Link
                        href={sectionHref(section.id)}
                        className="mt-2 inline-block font-bold text-brand-700 underline underline-offset-2"
                      >
                        Revisit “{section.title}”
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
