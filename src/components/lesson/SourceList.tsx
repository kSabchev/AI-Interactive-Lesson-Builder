"use client";

import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/client";
import type { Lesson } from "@/lib/lesson/schema";

/** The lesson's sources with the given ids, in the lesson's order. Unknown ids are ignored. */
export function sourcesFor(lesson: Lesson, ids: readonly string[]) {
  const wanted = new Set(ids);
  return lesson.sources.filter((s) => wanted.has(s.id));
}

/**
 * Lists sources as links (when they have a URL) with their quoted excerpt. Links open in a new tab so
 * presenting isn't interrupted, and never pass on the referrer.
 */
export function SourceList({
  lesson,
  ids,
  showExcerpts = true,
  className,
}: {
  lesson: Lesson;
  ids: readonly string[];
  showExcerpts?: boolean;
  className?: string;
}) {
  const t = useT();
  const sources = sourcesFor(lesson, ids);
  if (sources.length === 0) return null;
  return (
    <ul className={cn("space-y-2", className)}>
      {sources.map((source) => (
        <li key={source.id}>
          {source.url ? (
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-brand-700 underline underline-offset-2"
            >
              {source.title}
              <span className="sr-only">{t.common.opensInNewTab}</span>
            </a>
          ) : (
            <span className="font-bold">{source.title}</span>
          )}
          {showExcerpts && source.excerpt && (
            <blockquote className="mt-1 line-clamp-3 border-l-4 border-line pl-3 text-muted">“{source.excerpt}”</blockquote>
          )}
        </li>
      ))}
    </ul>
  );
}
