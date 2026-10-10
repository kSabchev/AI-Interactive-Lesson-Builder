import { Visual } from "@/components/art/Visual";
import type { SectionOfType } from "@/lib/lesson/schema";
import { SectionHeading } from "./SectionHeading";

export function ExplanationSection({ section }: { section: SectionOfType<"explanation"> }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <div>
        <SectionHeading kicker="Let's learn" title={section.title} />
        <div className="space-y-4 text-xl leading-relaxed md:text-2xl">
          {section.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        {section.example && (
          <aside className="mt-6 rounded-3xl border-2 border-sun-400 bg-sun-100 p-5 text-lg leading-relaxed md:text-xl">
            <p className="mb-1 font-extrabold text-sun-600">Real-life example</p>
            <p>{section.example}</p>
          </aside>
        )}
      </div>
      <div className="space-y-6">
        {section.visualId && <Visual id={section.visualId} className="mx-auto w-full max-w-sm" />}
        {section.keyTerms.length > 0 && (
          <dl className="space-y-3 rounded-3xl bg-surface p-5 shadow-sm ring-1 ring-line">
            <p className="font-extrabold text-brand-700">Key words</p>
            {section.keyTerms.map((t) => (
              <div key={t.term}>
                <dt className="text-lg font-extrabold">{t.term}</dt>
                <dd className="text-lg text-muted">{t.definition}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
}
