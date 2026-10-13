"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/client";
import type { SectionOfType } from "@/lib/lesson/schema";
import { SectionHeading } from "./SectionHeading";

export type PredictionState = { selectedOptionId?: string; submitted: boolean };

export const initialPredictionState: PredictionState = { submitted: false };

export function PredictionSection({
  section,
  state,
  onChange,
}: {
  section: SectionOfType<"prediction">;
  state: PredictionState;
  onChange: (state: PredictionState) => void;
}) {
  const { selectedOptionId, submitted } = state;
  const t = useT().sections.prediction;

  return (
    <div>
      <SectionHeading kicker={t.kicker} title={section.title} />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (selectedOptionId) onChange({ ...state, submitted: true });
        }}
      >
        <fieldset disabled={submitted}>
          <legend className="mb-5 text-2xl font-bold text-balance md:text-3xl">{section.question}</legend>
          <div className="grid gap-3 md:grid-cols-2">
            {section.options.map((option) => {
              const selected = option.id === selectedOptionId;
              const highlighted = submitted && option.id === section.answerOptionId;
              return (
                <label
                  key={option.id}
                  className={cn(
                    "flex min-h-16 cursor-pointer items-center gap-4 rounded-2xl border-2 bg-surface p-4 text-lg font-semibold transition-colors md:text-xl",
                    selected ? "border-brand-500 bg-brand-50" : "border-line hover:border-brand-200",
                    highlighted && "border-good-500 bg-good-50",
                    submitted && "cursor-default",
                  )}
                >
                  <input
                    type="radio"
                    name={`prediction-${section.id}`}
                    value={option.id}
                    checked={selected}
                    onChange={() => onChange({ ...state, selectedOptionId: option.id })}
                    className="size-5 shrink-0 accent-brand-600"
                  />
                  <span className="flex-1">{option.text}</span>
                  {submitted && selected && (
                    <span className="rounded-full bg-brand-600 px-3 py-1 text-sm text-white">{t.yourGuess}</span>
                  )}
                </label>
              );
            })}
          </div>
        </fieldset>

        {!submitted ? (
          <Button type="submit" size="lg" className="mt-6" disabled={!selectedOptionId}>
            {t.lockIn}
          </Button>
        ) : (
          <div role="status" className="mt-6 rounded-3xl bg-good-50 p-6 ring-2 ring-good-500">
            <p className="mb-1 text-lg font-extrabold text-good-700">{t.whatReallyHappens}</p>
            <p className="text-xl leading-relaxed md:text-2xl">{section.reveal}</p>
          </div>
        )}
      </form>
    </div>
  );
}
