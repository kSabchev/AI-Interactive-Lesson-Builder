"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { checkSequence, moveStep, shuffledSteps } from "@/lib/activities/checking";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/client";
import type { SectionOfType } from "@/lib/lesson/schema";
import { SectionHeading } from "./SectionHeading";

/** The learner's current order (step ids), or null before they've moved anything. */
export type SequenceState = { order: string[] | null; checked: boolean };

export const initialSequenceState: SequenceState = { order: null, checked: false };

export function SequenceSection({
  section,
  state,
  onChange,
}: {
  section: SectionOfType<"sequence">;
  state: SequenceState;
  onChange: (state: SequenceState) => void;
}) {
  const t = useT().sections.sequence;
  const [announcement, setAnnouncement] = useState("");
  const order = state.order ?? shuffledSteps(section);
  const stepsById = new Map(section.steps.map((step) => [step.id, step]));
  const result = checkSequence(section, order);
  const checked = state.checked;

  function move(from: number, to: number) {
    const next = moveStep(order, from, to);
    if (next === order) return;
    const step = stepsById.get(order[from])!;
    setAnnouncement(t.moved(step.text, to + 1));
    onChange({ order: next, checked: false });
  }

  function reset() {
    setAnnouncement(t.resetDone);
    onChange(initialSequenceState);
  }

  return (
    <div>
      <SectionHeading kicker={t.kicker} title={section.title} />
      <p className="mb-5 text-xl md:text-2xl">{section.instructions}</p>

      <ol aria-label={t.steps} className="space-y-2">
        {order.map((stepId, position) => {
          const step = stepsById.get(stepId)!;
          const isRight = checked && result.correctIds.includes(stepId);
          const isWrong = checked && result.incorrectIds.includes(stepId);
          return (
            <li
              key={stepId}
              className={cn(
                "flex items-center gap-3 rounded-2xl border-2 bg-surface p-2 pl-3",
                isRight ? "border-good-500 bg-good-50" : isWrong ? "border-miss-500 bg-miss-50" : "border-line",
              )}
            >
              <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-100 font-extrabold text-brand-700">
                {position + 1}
              </span>
              <span className="min-w-0 flex-1 text-lg font-semibold">
                {isRight && <span className="sr-only">{t.correctPrefix}</span>}
                {isWrong && <span className="sr-only">{t.notQuitePrefix}</span>}
                <span className="sr-only">{t.position(position + 1)}: </span>
                {step.text}
              </span>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="secondary"
                  aria-label={t.moveUp(step.text)}
                  disabled={position === 0}
                  onClick={() => move(position, position - 1)}
                >
                  <span aria-hidden="true">↑</span>
                  <span className="hidden sm:inline"> {t.up}</span>
                </Button>
                <Button
                  variant="secondary"
                  aria-label={t.moveDown(step.text)}
                  disabled={position === order.length - 1}
                  onClick={() => move(position, position + 1)}
                >
                  <span aria-hidden="true">↓</span>
                  <span className="hidden sm:inline"> {t.down}</span>
                </Button>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button onClick={() => onChange({ order, checked: true })}>{t.check}</Button>
        <Button variant="secondary" onClick={reset} disabled={state.order === null}>
          {t.reset}
        </Button>
      </div>

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      {checked && (
        <div role="status" className="mt-6 rounded-3xl bg-surface p-5 ring-1 ring-line">
          <p className="text-xl font-extrabold">
            {result.allCorrect ? t.allRight : t.someRight(result.correctIds.length, section.steps.length)}
          </p>
          {!result.allCorrect && (
            <>
              <ul className="mt-3 space-y-3 text-lg">
                {result.incorrectIds.map((stepId) => {
                  const step = stepsById.get(stepId)!;
                  const correctPosition = section.steps.findIndex((s) => s.id === stepId) + 1;
                  return (
                    <li key={stepId}>
                      <strong>{step.text}</strong> {t.belongsAt(correctPosition)} {step.explanation}
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 text-muted">{t.keepGoing}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
