"use client";

import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/client";
import type { SectionOfType } from "@/lib/lesson/schema";
import { SectionHeading } from "./SectionHeading";

export type ExperimentState = { revealed: boolean };

export const initialExperimentState: ExperimentState = { revealed: false };

/** An experiment the adult leads: safety first, then materials and steps, a prediction, and the reveal. */
export function ExperimentSection({
  section,
  state,
  onChange,
}: {
  section: SectionOfType<"experiment">;
  state: ExperimentState;
  onChange: (state: ExperimentState) => void;
}) {
  const t = useT().sections.experiment;
  return (
    <div>
      <SectionHeading kicker={t.kicker} title={section.title} />

      <aside aria-label={t.safety} className="mb-6 rounded-2xl bg-sun-100 p-4 text-lg ring-1 ring-line">
        <strong>{t.safety}:</strong> {section.safety}
      </aside>

      <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
        <section aria-labelledby={`${section.id}-materials`}>
          <h3 id={`${section.id}-materials`} className="mb-2 text-xl font-extrabold">
            {t.youNeed}
          </h3>
          <ul className="list-disc space-y-1 pl-6 text-lg">
            {section.materials.map((material) => (
              <li key={material}>{material}</li>
            ))}
          </ul>
        </section>
        <section aria-labelledby={`${section.id}-steps`}>
          <h3 id={`${section.id}-steps`} className="mb-2 text-xl font-extrabold">
            {t.whatToDo}
          </h3>
          <ol className="list-decimal space-y-2 pl-6 text-lg">
            {section.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
      </div>

      <div className="mt-6 rounded-3xl bg-brand-50 p-5 ring-1 ring-line">
        <p className="text-sm font-extrabold tracking-wide text-brand-700 uppercase">{t.predict}</p>
        <p className="mt-1 text-2xl font-extrabold">{section.question}</p>
        {!state.revealed && (
          <Button className="mt-4" onClick={() => onChange({ revealed: true })}>
            {t.show}
          </Button>
        )}
      </div>

      {state.revealed && (
        <div role="status" className="mt-6 space-y-4 rounded-3xl bg-surface p-5 text-lg ring-1 ring-line">
          <p>
            <strong>{t.lookFor}:</strong> {section.observe}
          </p>
          <p>
            <strong>{t.why}:</strong> {section.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
