import Link from "next/link";
import type { ContentOrigin, Lesson } from "@/lib/lesson/schema";

export const ORIGIN_LABELS: Record<ContentOrigin, string> = {
  curated: "Curated sample",
  reference: "Reference-based",
  "web-research": "Web-researched",
  "ai-draft": "AI draft",
};

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

export function LessonCard({ lesson }: { lesson: Lesson }) {
  return (
    <article className="relative flex flex-col rounded-3xl bg-surface p-6 shadow-sm ring-1 ring-line transition-shadow focus-within:ring-2 focus-within:ring-brand-500 hover:shadow-md">
      <p className="mb-2 w-fit rounded-full bg-brand-50 px-3 py-1 text-sm font-bold text-brand-700">
        {ORIGIN_LABELS[lesson.contentOrigin]}
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
    </article>
  );
}
