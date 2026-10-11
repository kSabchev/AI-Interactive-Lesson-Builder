"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { type ActivityStates, SectionView } from "@/components/sections/SectionView";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { newId, replaceAt } from "@/lib/lesson/edit";
import { describeIssues, type EditorTarget, type LessonIssue } from "@/lib/lesson/issues";
import { SECTION_TYPE_LABELS } from "@/lib/lesson/labels";
import { type Lesson, lessonSchema } from "@/lib/lesson/schema";
import { deleteAttempt, saveLesson } from "@/lib/storage/db";
import { DetailsEditor, ObjectivesEditor, QuizQuestionEditor, SourcesPanel } from "./OtherEditors";
import { SectionEditor } from "./SectionEditor";

type SaveStatus = "idle" | "saving" | "saved" | "invalid" | "failed";

type NavItem = { target: EditorTarget; label: string; detail?: string };

function navGroups(lesson: Lesson): { title: string; items: NavItem[] }[] {
  return [
    {
      title: "Overview",
      items: [
        { target: "details", label: "Lesson details" },
        { target: "objectives", label: "Learning objectives" },
      ],
    },
    {
      title: "Sections",
      items: lesson.sections.map((s, i) => ({
        target: `section:${s.id}`,
        label: `${i + 1}. ${s.title || "(untitled)"}`,
        detail: SECTION_TYPE_LABELS[s.type],
      })),
    },
    {
      title: "Final quiz",
      items: lesson.quiz.map((q, i) => ({ target: `quiz:${q.id}`, label: `Q${i + 1}. ${q.prompt || "(empty)"}` })),
    },
    { title: "Evidence", items: [{ target: "sources", label: `Sources (${lesson.sources.length})` }] },
  ];
}

export function LessonEditor({
  lesson,
  isSample,
  justCopied,
  justGenerated = false,
}: {
  lesson: Lesson;
  isSample: boolean;
  justCopied: boolean;
  justGenerated?: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(lesson);
  const [draft, setDraft] = useState(lesson);
  const [selected, setSelected] = useState<EditorTarget>("details");
  const [status, setStatus] = useState<SaveStatus>(justCopied ? "saved" : "idle");
  const [showIssues, setShowIssues] = useState(false);
  const [previewStates, setPreviewStates] = useState<ActivityStates>({});
  const mainRef = useRef<HTMLDivElement>(null);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved]);

  // After a failed save, keep the issue list in sync with edits so fixed problems disappear.
  const issues: LessonIssue[] = useMemo(() => {
    if (!showIssues) return [];
    const result = lessonSchema.safeParse(draft);
    return result.success ? [] : describeIssues(draft, result.error);
  }, [draft, showIssues]);
  const issueTargets = new Set(issues.map((i) => i.target));

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function update(next: Lesson) {
    setDraft(next);
    if (status === "saved" || status === "failed") setStatus("idle");
  }

  function select(target: EditorTarget) {
    setSelected(target);
    mainRef.current?.scrollTo({ top: 0 });
    mainRef.current?.focus({ preventScroll: true });
  }

  /**
   * Validates and stores the draft. Samples are never overwritten: saving creates a copy, and the editor
   * moves to that copy unless the caller is about to navigate elsewhere (a second navigation would race).
   */
  async function save({ thenOpenCopy = true }: { thenOpenCopy?: boolean } = {}): Promise<Lesson | undefined> {
    const now = new Date().toISOString();
    const candidate: Lesson = isSample
      ? { ...draft, id: newId("lesson"), createdAt: now, updatedAt: now }
      : { ...draft, updatedAt: now };

    const result = lessonSchema.safeParse(candidate);
    if (!result.success) {
      setShowIssues(true);
      setStatus("invalid");
      return undefined;
    }

    setStatus("saving");
    try {
      const stored = await saveLesson(result.data);
      // An attempt answered against different questions would show misleading results.
      if (!isSample && JSON.stringify(saved.quiz) !== JSON.stringify(stored.quiz)) await deleteAttempt(stored.id);
      setSaved(stored);
      setDraft(stored);
      setShowIssues(false);
      setStatus("saved");
      if (isSample && thenOpenCopy) router.replace(`/lessons/${stored.id}/edit?copied=1`);
      return stored;
    } catch {
      setStatus("failed");
      return undefined;
    }
  }

  async function startLesson() {
    if (isSample && !dirty) {
      router.push(`/lessons/${saved.id}/present`);
      return;
    }
    const stored = dirty ? await save({ thenOpenCopy: false }) : saved;
    if (!stored) return;
    // The sample's editor no longer reflects anything saved, so it is replaced rather than kept in history.
    if (isSample) router.replace(`/lessons/${stored.id}/present`);
    else router.push(`/lessons/${stored.id}/present`);
  }

  const selectedSection = selected.startsWith("section:")
    ? draft.sections.find((s) => `section:${s.id}` === selected)
    : undefined;
  const quizIndex = selected.startsWith("quiz:") ? draft.quiz.findIndex((q) => `quiz:${q.id}` === selected) : -1;
  const groups = navGroups(draft);

  return (
    <div className="flex h-dvh flex-col">
      <header className="border-b border-line bg-surface">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 md:px-6">
          <Link href="/" className="rounded-full px-3 py-2 font-bold text-muted hover:bg-brand-50 hover:text-ink">
            <span aria-hidden="true">←</span> Library
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold uppercase tracking-wider text-brand-600">Review &amp; edit</p>
            <h1 className="truncate text-lg font-extrabold">{draft.title || "Untitled lesson"}</h1>
          </div>
          <p role="status" className="text-sm font-bold text-muted">
            <StatusText status={status} dirty={dirty} isSample={isSample} />
          </p>
          <Button variant="secondary" onClick={() => void save()} disabled={status === "saving" || (!dirty && !isSample)}>
            {isSample ? "Save as my copy" : "Save"}
          </Button>
          <Button onClick={startLesson} disabled={status === "saving"}>
            Start lesson <span aria-hidden="true">→</span>
          </Button>
        </div>
        {isSample && (
          <p className="border-t border-line bg-sun-100 px-4 py-2 text-sm md:px-6">
            This is a curated sample, so it stays as it is. Saving your edits creates your own copy in the library.
          </p>
        )}
        {justGenerated && <GeneratedNotice lesson={saved} />}
        {justCopied && !isSample && status === "saved" && !dirty && (
          <p className="border-t border-line bg-good-50 px-4 py-2 text-sm font-semibold text-good-700 md:px-6">
            Saved a copy to your library. You&apos;re now editing your own lesson.
          </p>
        )}
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <nav aria-label="Lesson parts" className="border-b border-line bg-surface md:w-72 md:shrink-0 md:overflow-y-auto md:border-r md:border-b-0">
          {/* Compact picker on narrow screens, full outline from tablet up. */}
          <label className="block p-3 md:hidden">
            <span className="sr-only">Edit part of the lesson</span>
            <select
              value={selected}
              onChange={(e) => select(e.target.value as EditorTarget)}
              className="min-h-11 w-full rounded-xl border-2 border-line bg-surface px-3 font-semibold"
            >
              {groups.map((g) => (
                <optgroup key={g.title} label={g.title}>
                  {g.items.map((item) => (
                    <option key={item.target} value={item.target}>
                      {issueTargets.has(item.target) ? "⚠ " : ""}
                      {item.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <div className="hidden space-y-5 p-4 md:block">
            {groups.map((group) => (
              <div key={group.title}>
                <h2 className="mb-1 px-2 text-xs font-extrabold uppercase tracking-wider text-muted">{group.title}</h2>
                <ul className="space-y-0.5">
                  {group.items.map((item) => (
                    <li key={item.target}>
                      <button
                        type="button"
                        onClick={() => select(item.target)}
                        aria-current={selected === item.target ? "true" : undefined}
                        className={cn(
                          "flex w-full items-start gap-2 rounded-xl px-2 py-2 text-left text-sm",
                          selected === item.target ? "bg-brand-50 font-bold text-brand-700" : "hover:bg-paper",
                        )}
                      >
                        <span className="line-clamp-2 flex-1">{item.label}</span>
                        {item.detail && (
                          <span className="shrink-0 rounded-full bg-paper px-2 py-0.5 text-xs font-bold text-muted">{item.detail}</span>
                        )}
                        {issueTargets.has(item.target) && (
                          <span className="shrink-0 text-miss-500" aria-label="Has problems to fix">
                            ●
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        <main ref={mainRef} tabIndex={-1} className="min-h-0 flex-1 overflow-y-auto outline-none">
          {issues.length > 0 && (
            <section aria-labelledby="issues-heading" className="mx-4 mt-4 rounded-2xl bg-miss-50 p-4 ring-2 ring-miss-500 md:mx-6">
              <h2 id="issues-heading" className="font-extrabold text-miss-700">
                Fix {issues.length} problem{issues.length === 1 ? "" : "s"} before saving
              </h2>
              <ul className="mt-2 space-y-1 text-sm">
                {issues.slice(0, 8).map((issue, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => select(issue.target)}
                      className="text-left underline-offset-2 hover:underline"
                    >
                      <strong>{issue.where}:</strong> {issue.message}
                    </button>
                  </li>
                ))}
                {issues.length > 8 && <li className="text-muted">…and {issues.length - 8} more.</li>}
              </ul>
            </section>
          )}

          <div className={cn("grid gap-8 p-4 md:p-6", selectedSection && "2xl:grid-cols-[minmax(0,42rem)_minmax(0,1fr)]")}>
            <div className="max-w-2xl">
              {selectedSection && (
                <a
                  href="#section-preview"
                  className="mb-4 inline-block font-bold text-brand-700 underline underline-offset-2 2xl:hidden"
                >
                  See preview <span aria-hidden="true">↓</span>
                </a>
              )}
              {selected === "details" && <DetailsEditor lesson={draft} isSample={isSample} onChange={update} />}
              {selected === "objectives" && <ObjectivesEditor lesson={draft} onChange={update} />}
              {selected === "sources" && <SourcesPanel lesson={draft} isSample={isSample} />}
              {selectedSection && (
                <SectionEditor
                  key={selectedSection.id}
                  section={selectedSection}
                  onChange={(section) =>
                    update({
                      ...draft,
                      sections: replaceAt(draft.sections, draft.sections.findIndex((s) => s.id === section.id), section),
                    })
                  }
                />
              )}
              {quizIndex >= 0 && (
                <QuizQuestionEditor
                  key={draft.quiz[quizIndex].id}
                  lesson={draft}
                  question={draft.quiz[quizIndex]}
                  index={quizIndex}
                  onChange={(question) => update({ ...draft, quiz: replaceAt(draft.quiz, quizIndex, question) })}
                />
              )}
            </div>

            {selectedSection && (
              <aside id="section-preview" aria-label="Section preview" className="min-w-0 scroll-mt-4">
                <div className="sticky top-0">
                  <h2 className="mb-2 text-sm font-extrabold uppercase tracking-wider text-muted">Preview</h2>
                  <div className="overflow-hidden rounded-3xl bg-paper p-6 shadow-sm ring-1 ring-line">
                    <div style={{ zoom: 0.6 }}>
                      <SectionView
                        section={selectedSection}
                        activityStates={previewStates}
                        onActivityChange={(id, state) => setPreviewStates((prev) => ({ ...prev, [id]: state }))}
                      />
                    </div>
                  </div>
                </div>
              </aside>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function GeneratedNotice({ lesson }: { lesson: Lesson }) {
  const message =
    lesson.contentOrigin === "curated"
      ? "Sample mode: AI generation is switched off on this site, so this is a copy of a curated lesson rather than one written for your topic. It's saved in your library."
      : lesson.contentOrigin === "reference"
        ? "Draft generated from your reference material and saved to your library. Check that it matches the material before presenting."
        : "AI-generated draft, saved to your library. It was checked for structure, not for accuracy, so read it through and fix anything that's wrong before presenting.";
  return (
    <p role="status" className="border-t border-line bg-sun-100 px-4 py-2 text-sm font-semibold md:px-6">
      {message}
    </p>
  );
}

function StatusText({ status, dirty, isSample }: { status: SaveStatus; dirty: boolean; isSample: boolean }) {
  if (status === "saving") return <>Saving…</>;
  if (status === "invalid") return <span className="text-miss-700">Some fields need attention</span>;
  if (status === "failed") return <span className="text-miss-700">Couldn&apos;t save — your edits are still here</span>;
  if (dirty) return <>Unsaved changes</>;
  if (status === "saved") return <span className="text-good-700">All changes saved</span>;
  return isSample ? <>Curated sample</> : <>No changes</>;
}
