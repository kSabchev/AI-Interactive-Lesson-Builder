"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SourceList } from "@/components/lesson/SourceList";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/client";
import type { Lesson } from "@/lib/lesson/schema";
import { isCorrect, type QuizAnswers, scoreQuiz } from "@/lib/quiz/scoring";
import { useStore } from "@/lib/storage/StoreProvider";
import { QuizResults } from "./QuizResults";

/** Runs the final quiz. With `previousAnswers`, it opens on the results of that saved attempt. */
export function QuizRunner({ lesson, previousAnswers }: { lesson: Lesson; previousAnswers?: QuizAnswers }) {
  const [attempt, setAttempt] = useState(0);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>(previousAnswers ?? {});
  const [pending, setPending] = useState<string | undefined>();
  const [finished, setFinished] = useState(Boolean(previousAnswers));
  const feedbackRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const reduceMotion = useReducedMotion();
  const storeState = useStore();
  const t = useT().quiz;

  const question = lesson.quiz[index];
  const submitted = answers[question.id];
  const isLast = index === lesson.quiz.length - 1;
  const sectionsById = new Map(lesson.sections.map((s) => [s.id, s]));

  useEffect(() => {
    if (submitted) feedbackRef.current?.focus();
  }, [submitted]);

  useEffect(() => {
    if (index > 0 || attempt > 0) headingRef.current?.focus();
  }, [index, attempt]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!pending || submitted) return;
    setAnswers((prev) => ({ ...prev, [question.id]: pending }));
  }

  function next() {
    setPending(undefined);
    if (!isLast) {
      setIndex(index + 1);
      return;
    }
    setFinished(true);
    const { score, total } = scoreQuiz(lesson, answers);
    // Results are shown regardless; failing to persist (e.g. private browsing) only loses the history.
    if (storeState.status === "ready") {
      storeState.store
        .saveAttempt({ lessonId: lesson.id, answers, score, total, completedAt: new Date().toISOString() })
        .catch(() => {});
    }
  }

  function retry() {
    setAnswers({});
    setPending(undefined);
    setIndex(0);
    setFinished(false);
    setAttempt((n) => n + 1);
  }

  if (finished) return <QuizResults lesson={lesson} answers={answers} onRetry={retry} />;

  const correct = submitted ? isCorrect(question, submitted) : false;
  const correctOption = question.options.find((o) => o.id === question.correctOptionId)!;
  const section = sectionsById.get(question.sectionId);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 md:py-12">
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between font-bold text-muted">
          <span>{t.finalQuiz}</span>
          <span>{t.questionOf(index + 1, lesson.quiz.length)}</span>
        </div>
        <div
          role="progressbar"
          aria-label={t.progress}
          aria-valuemin={0}
          aria-valuemax={lesson.quiz.length}
          aria-valuenow={Object.keys(answers).length}
          className="h-3 overflow-hidden rounded-full bg-line"
        >
          <div
            className="h-full rounded-full bg-brand-500 transition-[width] duration-300"
            style={{ width: `${(Object.keys(answers).length / lesson.quiz.length) * 100}%` }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${attempt}-${question.id}`}
          initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduceMotion ? 0 : -16 }}
          transition={{ duration: 0.2 }}
        >
          <form onSubmit={submit}>
            <fieldset disabled={Boolean(submitted)}>
              <legend className="mb-6 w-full">
                <h1
                  ref={headingRef}
                  tabIndex={-1}
                  className="text-2xl font-extrabold text-balance outline-none md:text-3xl"
                >
                  {question.prompt}
                </h1>
              </legend>
              <div className="grid gap-3">
                {question.options.map((option, i) => {
                  const chosen = (submitted ?? pending) === option.id;
                  const showCorrect = submitted && option.id === question.correctOptionId;
                  const showWrong = submitted && chosen && !correct;
                  return (
                    <label
                      key={option.id}
                      className={cn(
                        "flex min-h-16 items-center gap-4 rounded-2xl border-2 bg-surface p-4 text-lg font-semibold transition-colors has-focus-visible:ring-4 has-focus-visible:ring-brand-200 md:text-xl",
                        !submitted && "cursor-pointer hover:border-brand-200",
                        chosen && !submitted ? "border-brand-500 bg-brand-50" : "border-line",
                        showCorrect && "border-good-500 bg-good-50",
                        showWrong && "border-miss-500 bg-miss-50",
                      )}
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={option.id}
                        checked={chosen}
                        onChange={() => setPending(option.id)}
                        className="sr-only"
                      />
                      <span
                        aria-hidden="true"
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-full border-2 font-extrabold",
                          chosen ? "border-brand-600 bg-brand-600 text-white" : "border-line",
                          showCorrect && "border-good-500 bg-good-500 text-white",
                          showWrong && "border-miss-500 bg-miss-500 text-white",
                        )}
                      >
                        {showCorrect ? "✔" : showWrong ? "✘" : String.fromCharCode(65 + i)}
                      </span>
                      <span className="flex-1">{option.text}</span>
                      {showCorrect && <span className="sr-only">{t.correctAnswerSr}</span>}
                      {showWrong && <span className="sr-only">{t.yourAnswerSr}</span>}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {!submitted && (
              <Button type="submit" size="lg" className="mt-6" disabled={!pending}>
                {t.submit}
              </Button>
            )}
          </form>

          {submitted && (
            <div
              ref={feedbackRef}
              tabIndex={-1}
              role="status"
              className={cn(
                "mt-6 rounded-3xl p-6 outline-none ring-2",
                correct ? "bg-good-50 ring-good-500" : "bg-miss-50 ring-miss-500",
              )}
            >
              <p className={cn("text-2xl font-extrabold", correct ? "text-good-700" : "text-miss-700")}>
                {correct ? t.correct : t.notQuite}
              </p>
              {!correct && (
                <p className="mt-1 text-lg">
                  {t.theAnswerIs} <strong>{correctOption.text}</strong>.
                </p>
              )}
              <p className="mt-2 text-lg leading-relaxed">{question.explanation}</p>
              {question.sourceIds.length > 0 && (
                <div className="mt-3 text-sm">
                  <p className="font-bold text-muted">{t.source}</p>
                  <SourceList lesson={lesson} ids={question.sourceIds} showExcerpts={false} />
                </div>
              )}
              {section && (
                <p className="mt-3 text-base text-muted">
                  {t.fromTheLesson}{" "}
                  <Link
                    href={`/lessons/${lesson.id}/present?section=${section.id}`}
                    className="font-bold text-brand-700 underline underline-offset-2"
                  >
                    {section.title}
                  </Link>
                </p>
              )}
              <Button size="lg" className="mt-5" onClick={next}>
                {isLast ? t.seeResults : t.nextQuestion} <span aria-hidden="true">→</span>
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
