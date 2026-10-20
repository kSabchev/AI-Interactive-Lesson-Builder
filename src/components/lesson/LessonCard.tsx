"use client";

import Link from "next/link";
import { intlLocale } from "@/lib/i18n";
import { useLocale, useT } from "@/lib/i18n/client";
import { originLabel } from "@/lib/lesson/labels";
import type { Lesson } from "@/lib/lesson/schema";

/** The whole card opens the lesson; `children` renders extra actions above that link. */
export function LessonCard({
  lesson,
  isSample,
  children,
}: {
  lesson: Lesson;
  isSample: boolean;
  children?: React.ReactNode;
}) {
  const t = useT();
  const { locale } = useLocale();
  const dateFormat = new Intl.DateTimeFormat(intlLocale(locale), { day: "numeric", month: "short", year: "numeric" });
  return (
    <article className="relative flex h-full flex-col rounded-3xl bg-surface p-6 shadow-sm ring-1 ring-line transition-shadow focus-within:ring-2 focus-within:ring-brand-500 hover:shadow-md">
      <p className="mb-2 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-bold text-brand-700">
          {originLabel(lesson, isSample, t)}
        </span>
        {lesson.language !== locale && (
          <span lang={lesson.language} className="rounded-full bg-paper px-3 py-1 text-sm font-bold text-muted ring-1 ring-line">
            {t.language.short[lesson.language]}
          </span>
        )}
      </p>
      <h3 lang={lesson.language} className="text-xl font-extrabold leading-snug">
        <Link href={`/lessons/${lesson.id}/present`} className="after:absolute after:inset-0 focus:outline-none">
          {lesson.title}
        </Link>
      </h3>
      <p lang={lesson.language} className="mt-1 text-muted">
        {lesson.topic}
      </p>
      <dl className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold text-muted">
        <div>
          <dt className="sr-only">{t.card.ageGroup}</dt>
          <dd>{t.common.ageGroups[lesson.ageGroup]}</dd>
        </div>
        <div>
          <dt className="sr-only">{t.card.duration}</dt>
          <dd>{t.common.minutes(lesson.durationMinutes)}</dd>
        </div>
        <div>
          <dt className="sr-only">{t.card.created}</dt>
          <dd>
            <time dateTime={lesson.createdAt}>{dateFormat.format(new Date(lesson.createdAt))}</time>
          </dd>
        </div>
      </dl>
      {children && <div className="relative z-10 mt-auto flex flex-wrap items-center gap-2 pt-4">{children}</div>}
    </article>
  );
}
