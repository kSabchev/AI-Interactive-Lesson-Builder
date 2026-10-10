import Link from "next/link";
import { originLabel } from "@/lib/lesson/labels";
import type { Lesson } from "@/lib/lesson/schema";

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

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
  return (
    <article className="relative flex h-full flex-col rounded-3xl bg-surface p-6 shadow-sm ring-1 ring-line transition-shadow focus-within:ring-2 focus-within:ring-brand-500 hover:shadow-md">
      <p className="mb-2 w-fit rounded-full bg-brand-50 px-3 py-1 text-sm font-bold text-brand-700">
        {originLabel(lesson, isSample)}
      </p>
      <h3 className="text-xl font-extrabold leading-snug">
        <Link href={`/lessons/${lesson.id}/present`} className="after:absolute after:inset-0 focus:outline-none">
          {lesson.title}
        </Link>
      </h3>
      <p className="mt-1 text-muted">{lesson.topic}</p>
      <dl className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold text-muted">
        <div>
          <dt className="sr-only">Age group</dt>
          <dd>Ages {lesson.ageGroup.replace("-", "–")}</dd>
        </div>
        <div>
          <dt className="sr-only">Duration</dt>
          <dd>{lesson.durationMinutes} min</dd>
        </div>
        <div>
          <dt className="sr-only">Created</dt>
          <dd>
            <time dateTime={lesson.createdAt}>{dateFormat.format(new Date(lesson.createdAt))}</time>
          </dd>
        </div>
      </dl>
      {children && <div className="relative z-10 mt-auto flex flex-wrap items-center gap-2 pt-4">{children}</div>}
    </article>
  );
}
