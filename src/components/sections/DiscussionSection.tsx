"use client";

import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/client";
import type { SectionOfType } from "@/lib/lesson/schema";
import { SectionHeading } from "./SectionHeading";

export type DiscussionState = { ideasShown: boolean };

export const initialDiscussionState: DiscussionState = { ideasShown: false };

/**
 * "Talk about it": a question for the class, with prompts to keep the talk going. The ideas a good answer
 * might include stay hidden until the adult chooses to show them, so the class says them first.
 */
export function DiscussionSection({
  section,
  state,
  onChange,
}: {
  section: SectionOfType<"discussion">;
  state: DiscussionState;
  onChange: (state: DiscussionState) => void;
}) {
  const t = useT().sections.discussion;
  return (
    <div>
      <SectionHeading kicker={t.kicker} title={section.title} />
      <p className="mb-8 text-3xl leading-snug font-extrabold md:text-4xl">{section.question}</p>

      <section aria-labelledby={`${section.id}-prompts`} className="rounded-3xl bg-brand-50 p-5 ring-1 ring-line">
        <h3 id={`${section.id}-prompts`} className="mb-2 text-xl font-extrabold">
          {t.keepGoing}
        </h3>
        <ul className="list-disc space-y-1 pl-6 text-lg">
          {section.prompts.map((prompt) => (
            <li key={prompt}>{prompt}</li>
          ))}
        </ul>
      </section>

      <Button variant="secondary" className="mt-6" onClick={() => onChange({ ideasShown: !state.ideasShown })}>
        {state.ideasShown ? t.hideIdeas : t.showIdeas}
      </Button>

      {state.ideasShown && (
        <section role="status" className="mt-4 rounded-3xl bg-surface p-5 ring-1 ring-line">
          <h3 className="mb-2 text-xl font-extrabold">{t.listenFor}</h3>
          <ul className="list-disc space-y-2 pl-6 text-lg">
            {section.listenFor.map((idea) => (
              <li key={idea}>{idea}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
