"use client";

import { Button } from "@/components/ui/Button";
import { checkMythOrFact, type MythOrFactAnswers } from "@/lib/activities/checking";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/client";
import type { SectionOfType } from "@/lib/lesson/schema";
import { SectionHeading } from "./SectionHeading";

export type MythOrFactState = { answers: MythOrFactAnswers };

export const initialMythOrFactState: MythOrFactState = { answers: {} };

/**
 * A warm-up: the class decides whether each statement is a fact or a myth, and sees why straight away, so
 * misconceptions are named before the lesson teaches the idea.
 */
export function MythOrFactSection({
  section,
  state,
  onChange,
}: {
  section: SectionOfType<"myth-or-fact">;
  state: MythOrFactState;
  onChange: (state: MythOrFactState) => void;
}) {
  const t = useT().sections.mythOrFact;
  const { answers } = state;
  const result = checkMythOrFact(section, answers);
  const allAnswered = section.statements.every((statement) => statement.id in answers);

  const answer = (id: string, isFact: boolean) => onChange({ answers: { ...answers, [id]: isFact } });

  return (
    <div>
      <SectionHeading kicker={t.kicker} title={section.title} />
      <p className="mb-5 text-xl md:text-2xl">{section.instructions}</p>

      <ol aria-label={t.statements} className="space-y-3">
        {section.statements.map((statement) => {
          const answered = statement.id in answers;
          const right = answered && answers[statement.id] === statement.isFact;
          return (
            <li
              key={statement.id}
              className={cn(
                "rounded-2xl border-2 bg-surface p-4",
                !answered ? "border-line" : right ? "border-good-500" : "border-miss-500",
              )}
            >
              <div className="flex flex-wrap items-center gap-3">
                <p className="min-w-0 flex-1 text-lg font-semibold md:text-xl">{statement.text}</p>
                {!answered && (
                  <div className="flex gap-2">
                    {/* Both answers look the same, so neither one is suggested. */}
                    <Button
                      variant="secondary"
                      aria-label={t.answerAs(t.fact, statement.text)}
                      onClick={() => answer(statement.id, true)}
                    >
                      {t.fact}
                    </Button>
                    <Button
                      variant="secondary"
                      aria-label={t.answerAs(t.myth, statement.text)}
                      onClick={() => answer(statement.id, false)}
                    >
                      {t.myth}
                    </Button>
                  </div>
                )}
              </div>
              {answered && (
                <p role="status" className={cn("mt-2 text-lg", right ? "text-good-700" : "text-miss-700")}>
                  <strong>
                    {right ? t.rightPrefix : t.notQuitePrefix}
                    {statement.isFact ? t.itsAFact : t.itsAMyth}
                  </strong>{" "}
                  <span className="text-ink">{statement.explanation}</span>
                </p>
              )}
            </li>
          );
        })}
      </ol>

      {allAnswered && (
        <div className="mt-6 flex flex-wrap items-center gap-4 rounded-3xl bg-surface p-5 ring-1 ring-line">
          <p className="text-xl font-extrabold">
            {result.allCorrect
              ? t.allRight(section.statements.length)
              : t.score(result.correctIds.length, section.statements.length)}
          </p>
          <Button variant="secondary" onClick={() => onChange(initialMythOrFactState)}>
            {t.reset}
          </Button>
        </div>
      )}
    </div>
  );
}
