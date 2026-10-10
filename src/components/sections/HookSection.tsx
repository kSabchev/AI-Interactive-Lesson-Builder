import { Visual } from "@/components/art/Visual";
import type { SectionOfType } from "@/lib/lesson/schema";
import { SectionHeading } from "./SectionHeading";

export function HookSection({ section }: { section: SectionOfType<"hook"> }) {
  return (
    <div className="grid items-center gap-8 md:grid-cols-[1.2fr_1fr]">
      <div>
        <SectionHeading kicker="Let's wonder" title={section.title} />
        <p className="rounded-3xl bg-sun-100 p-6 text-2xl font-extrabold leading-snug text-balance md:text-3xl">
          {section.question}
        </p>
        <p className="mt-6 text-xl leading-relaxed md:text-2xl">{section.body}</p>
      </div>
      {section.visualId && <Visual id={section.visualId} className="mx-auto w-full max-w-md" />}
    </div>
  );
}
