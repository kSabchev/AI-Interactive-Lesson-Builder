"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { SourceList } from "@/components/lesson/SourceList";
import { type ActivityStates, SectionView } from "@/components/sections/SectionView";
import { Button, ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { ORIGIN_LABELS } from "@/lib/lesson/labels";
import type { Lesson } from "@/lib/lesson/schema";

export function LessonPlayer({ lesson, initialSectionId }: { lesson: Lesson; initialSectionId?: string }) {
  const [index, setIndex] = useState(() =>
    Math.max(
      0,
      lesson.sections.findIndex((s) => s.id === initialSectionId),
    ),
  );
  const [direction, setDirection] = useState(1);
  const [activityStates, setActivityStates] = useState<ActivityStates>({});
  const [showNotes, setShowNotes] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const stageRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  const section = lesson.sections[index];
  const isLast = index === lesson.sections.length - 1;
  const quizHref = `/lessons/${lesson.id}/quiz`;

  const goTo = useCallback(
    (next: number) => {
      if (next < 0 || next >= lesson.sections.length) return;
      setDirection(next > index ? 1 : -1);
      setIndex(next);
    },
    [index, lesson.sections.length],
  );

  // Keep the URL pointing at the current section so a refresh or shared link lands in the same place.
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("section", section.id);
    window.history.replaceState(null, "", url);
  }, [section.id]);

  // Move focus to the new section for screen readers, without stealing it on first load.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    stageRef.current?.focus({ preventScroll: true });
    stageRef.current?.scrollTo({ top: 0 });
  }, [index]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.().catch(() => {});
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      const target = e.target as HTMLElement;
      // Leave arrow keys to form controls (radio groups move selection with arrows).
      if (target.closest("input, textarea, select, [contenteditable='true']")) return;

      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        goTo(index + 1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        goTo(index - 1);
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goTo, index, toggleFullscreen]);

  const offset = reduceMotion ? 0 : 48;

  return (
    <div className="flex h-dvh flex-col bg-paper">
      <header className="border-b border-line bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 md:px-6">
          <Link href="/" className="rounded-full px-3 py-2 font-bold text-muted hover:bg-brand-50 hover:text-ink">
            <span aria-hidden="true">←</span> Exit
          </Link>
          <h1 className="min-w-0 flex-1 truncate text-center text-base font-extrabold md:text-lg">{lesson.title}</h1>
          {lesson.contentOrigin !== "curated" && (
            <span className="hidden rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 lg:inline">
              {ORIGIN_LABELS[lesson.contentOrigin]}
            </span>
          )}
          <Button
            variant="ghost"
            aria-pressed={showNotes}
            onClick={() => setShowNotes((v) => !v)}
            className="hidden sm:inline-flex"
          >
            Facilitator notes
          </Button>
          <Button
            variant="ghost"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "Exit full screen" : "Full screen"}
          >
            <span aria-hidden="true">{isFullscreen ? "⤡" : "⤢"}</span>
            <span className="hidden md:inline">{isFullscreen ? "Exit full screen" : "Full screen"}</span>
          </Button>
        </div>
        <nav aria-label="Lesson progress" className="mx-auto max-w-7xl px-4 pb-3 md:px-6">
          <ol className="flex gap-1.5">
            {lesson.sections.map((s, i) => (
              <li key={s.id} className="flex-1">
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-current={i === index ? "step" : undefined}
                  aria-label={`Section ${i + 1}: ${s.title}`}
                  title={s.title}
                  className="group block w-full py-1.5"
                >
                  <span
                    className={cn(
                      "block h-2.5 rounded-full transition-colors",
                      i < index && "bg-brand-500",
                      i === index && "bg-sun-400",
                      i > index && "bg-line group-hover:bg-brand-200",
                    )}
                  />
                </button>
              </li>
            ))}
            <li className="flex-1" aria-label="Final quiz">
              <span className="my-1.5 block h-2.5 rounded-full border-2 border-dashed border-line" />
            </li>
          </ol>
        </nav>
      </header>

      <main
        ref={stageRef}
        tabIndex={-1}
        aria-label={`Section ${index + 1} of ${lesson.sections.length}: ${section.title}`}
        className="flex-1 overflow-y-auto overflow-x-hidden outline-none"
      >
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.article
            key={section.id}
            custom={direction}
            initial={{ opacity: 0, x: direction * offset }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -offset }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12"
          >
            <SectionView
              section={section}
              activityStates={activityStates}
              onActivityChange={(id, state) => setActivityStates((prev) => ({ ...prev, [id]: state }))}
            />
            {showNotes && section.facilitatorNote && (
              <aside className="mt-8 rounded-2xl border-l-4 border-sun-400 bg-sun-100 p-4 text-base md:text-lg">
                <p className="font-extrabold text-sun-600">For the adult</p>
                <p>{section.facilitatorNote}</p>
              </aside>
            )}
            {section.sourceIds.length > 0 && (
              <details className="mt-8 rounded-2xl bg-surface/70 p-4 text-sm ring-1 ring-line">
                <summary className="cursor-pointer font-bold text-muted">
                  Where this comes from ({section.sourceIds.length})
                </summary>
                <SourceList lesson={lesson} ids={section.sourceIds} className="mt-3" />
              </details>
            )}
          </motion.article>
        </AnimatePresence>
      </main>

      <footer className="border-t border-line bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 md:px-6">
          <Button variant="secondary" size="lg" onClick={() => goTo(index - 1)} disabled={index === 0}>
            <span aria-hidden="true">←</span> Back
          </Button>
          <p className="flex-1 text-center font-bold text-muted" aria-live="polite">
            {index + 1} / {lesson.sections.length}
          </p>
          {isLast ? (
            <ButtonLink href={quizHref} size="lg">
              Finish lesson and start quiz <span aria-hidden="true">→</span>
            </ButtonLink>
          ) : (
            <Button size="lg" onClick={() => goTo(index + 1)}>
              Next <span aria-hidden="true">→</span>
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}
