"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { intlLocale } from "@/lib/i18n";
import { useLocale, useT } from "@/lib/i18n/client";
import type { SectionOfType } from "@/lib/lesson/schema";
import { DataChart } from "./DataChart";
import { SectionHeading } from "./SectionHeading";

/** The chosen option per question id. */
export type DataState = { answers: Record<string, string> };

export const initialDataState: DataState = { answers: {} };

/** "Read the data": an example chart with its numbers, and questions answered from them, explained at once. */
export function DataSection({
  section,
  state,
  onChange,
}: {
  section: SectionOfType<"data">;
  state: DataState;
  onChange: (state: DataState) => void;
}) {
  const t = useT().sections.data;
  const { locale } = useLocale();
  const number = new Intl.NumberFormat(intlLocale(locale), { maximumFractionDigits: 2 });
  const format = (value: number) => number.format(value);

  return (
    <div>
      <SectionHeading kicker={t.kicker} title={section.title} />
      <p className="mb-5 text-xl md:text-2xl">{section.instructions}</p>

      <figure className="rounded-3xl bg-surface p-3 shadow-sm ring-1 ring-line">
        <DataChart section={section} format={format} label={t.chartLabel(section.caption)} />
        <figcaption className="px-2 pt-2">
          <span className="font-bold">{section.caption}</span> <span className="text-sm text-muted">{t.example}</span>
        </figcaption>
        <details className="mt-2 px-2 pb-1">
          <summary className="cursor-pointer font-bold text-brand-700">{t.seeNumbers}</summary>
          <table className="mt-2 w-full max-w-md text-left">
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="py-1 pr-4">
                  {section.xLabel}
                </th>
                <th scope="col" className="py-1">
                  {section.yLabel}
                </th>
              </tr>
            </thead>
            <tbody>
              {section.rows.map((row) => (
                <tr key={row.label} className="border-b border-line last:border-0">
                  <th scope="row" className="py-1 pr-4 font-normal">
                    {row.label}
                  </th>
                  <td className="py-1 tabular-nums">{format(row.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </figure>

      <ol aria-label={t.questions} className="mt-6 space-y-4">
        {section.questions.map((question) => {
          const chosen = state.answers[question.id];
          const correct = question.options.find((o) => o.id === question.correctOptionId);
          const right = chosen === question.correctOptionId;
          return (
            <li key={question.id} className="rounded-2xl bg-surface p-4 ring-1 ring-line">
              <p className="text-lg font-bold md:text-xl">{question.prompt}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {question.options.map((option) => (
                  <Button
                    key={option.id}
                    variant="secondary"
                    aria-label={t.choose(option.text, question.prompt)}
                    aria-pressed={chosen === option.id}
                    disabled={chosen !== undefined}
                    className={cn(
                      chosen !== undefined &&
                        option.id === question.correctOptionId &&
                        "border-good-500 bg-good-50 opacity-100",
                      chosen === option.id && !right && "border-miss-500 bg-miss-50 opacity-100",
                    )}
                    onClick={() => onChange({ answers: { ...state.answers, [question.id]: option.id } })}
                  >
                    {option.text}
                  </Button>
                ))}
              </div>
              {chosen !== undefined && (
                <p role="status" className={cn("mt-3 text-lg", right ? "text-good-700" : "text-miss-700")}>
                  <strong>{right ? t.right : `${t.notQuite} ${t.answerIs(correct?.text ?? "")}`}</strong>{" "}
                  <span className="text-ink">{question.explanation}</span>
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
