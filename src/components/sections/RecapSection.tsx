"use client";

import { useT } from "@/lib/i18n/client";
import type { SectionOfType } from "@/lib/lesson/schema";
import { SectionHeading } from "./SectionHeading";

export function RecapSection({ section }: { section: SectionOfType<"recap"> }) {
  const t = useT();
  return (
    <div>
      <SectionHeading kicker={t.sections.recapKicker} title={section.title} />
      <ol className="grid gap-4 md:grid-cols-3">
        {section.keyPoints.map((point, i) => (
          <li key={i} className="rounded-3xl bg-surface p-6 shadow-sm ring-1 ring-line">
            <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-brand-600 text-2xl font-extrabold text-white">
              {i + 1}
            </span>
            <p className="text-xl leading-snug font-semibold md:text-2xl">{point}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
