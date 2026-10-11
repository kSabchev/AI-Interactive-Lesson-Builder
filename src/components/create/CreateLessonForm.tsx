"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SelectField, TextArea, TextField } from "@/components/editor/fields";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { requestGeneration } from "@/lib/generation/client";
import { type GenerationEvent, type GenerationMode, type Stage, STAGE_LABELS } from "@/lib/generation/events";
import { EXAMPLE_INPUT, type GenerationFormValues, generationInputSchema, REFERENCE_MAX, TOPIC_MAX } from "@/lib/generation/input";
import { useStore } from "@/lib/storage/StoreProvider";

type StageState = { stage: Stage; status: "start" | "done"; retried: boolean };

type Run =
  | { status: "idle" }
  | { status: "running"; stages: StageState[] }
  | { status: "failed"; stages: StageState[]; message: string };

const EMPTY: GenerationFormValues = { topic: "", ageGroup: "8-10", durationMinutes: 10, referenceText: "" };

export function CreateLessonForm({ mode }: { mode: GenerationMode }) {
  const router = useRouter();
  const storeState = useStore();
  const [values, setValues] = useState<GenerationFormValues>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof GenerationFormValues, string>>>({});
  const [run, setRun] = useState<Run>({ status: "idle" });
  const abortRef = useRef<AbortController | null>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const running = run.status === "running";
  const set = <K extends keyof GenerationFormValues>(key: K, value: GenerationFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  async function generate(e?: React.FormEvent) {
    e?.preventDefault();
    const parsed = generationInputSchema.safeParse(values);
    if (!parsed.success) {
      const errors: typeof fieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof GenerationFormValues;
        errors[key] ??= issue.message;
      }
      setFieldErrors(errors);
      requestAnimationFrame(() => document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
      return;
    }
    setFieldErrors({});

    const controller = new AbortController();
    abortRef.current = controller;
    let stages: StageState[] = [];
    setRun({ status: "running", stages });
    requestAnimationFrame(() => statusRef.current?.focus());

    const onEvent = async (event: GenerationEvent) => {
      if (event.type === "stage") {
        const existing = stages.find((s) => s.stage === event.stage);
        stages = existing
          ? stages.map((s) => (s.stage === event.stage ? { ...s, status: event.status } : s))
          : [...stages, { stage: event.stage, status: event.status, retried: false }];
        setRun({ status: "running", stages });
      } else if (event.type === "retry") {
        stages = stages.map((s) => (s.stage === event.stage ? { ...s, retried: true } : s));
        setRun({ status: "running", stages });
      } else if (event.type === "error") {
        setRun({ status: "failed", stages, message: event.message });
      } else if (event.type === "done") {
        try {
          if (storeState.status !== "ready") throw new Error("store not ready");
          await storeState.store.saveLesson(event.lesson);
          router.push(`/lessons/${event.lesson.id}/edit?generated=1`);
        } catch {
          setRun({
            status: "failed",
            stages,
            message:
              storeState.status === "ready" && storeState.store.kind === "account"
                ? "The lesson was created but couldn't be saved to your account. Check your connection and try again."
                : "The lesson was created but couldn't be saved in this browser (private browsing can block storage). Try a normal window.",
          });
        }
      }
    };

    try {
      await requestGeneration(parsed.data, (event) => void onEvent(event), controller.signal);
    } catch {
      if (!controller.signal.aborted) setRun({ status: "failed", stages, message: "Generation stopped unexpectedly. Please try again." });
    }
  }

  function cancel() {
    abortRef.current?.abort();
    setRun({ status: "idle" });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <form onSubmit={generate} noValidate className="space-y-6 rounded-3xl bg-surface p-6 shadow-sm ring-1 ring-line md:p-8">
        <fieldset disabled={running} className="space-y-6">
          <TextField
              label="Topic"
              hint="What should the lesson explain? For example, “How the water cycle works”."
              value={values.topic}
              maxLength={TOPIC_MAX}
              error={fieldErrors.topic}
              onChange={(topic) => set("topic", topic)}
            />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Learner age"
              value={values.ageGroup}
              options={[
                { value: "8-10", label: "Ages 8–10" },
                { value: "11-12", label: "Ages 11–12" },
              ]}
              onChange={(ageGroup) => set("ageGroup", ageGroup)}
            />
            <SelectField
              label="Lesson length"
              value={String(values.durationMinutes) as "10" | "15"}
              options={[
                { value: "10", label: "10 minutes" },
                { value: "15", label: "15 minutes" },
              ]}
              onChange={(v) => set("durationMinutes", Number(v) as 10 | 15)}
            />
          </div>
          <TextArea
              label="Reference text (optional)"
              hint="Paste educational material to base the lesson on, such as a textbook page. The lesson will be labelled as reference-based."
              rows={5}
              value={values.referenceText ?? ""}
              maxLength={REFERENCE_MAX}
              error={fieldErrors.referenceText}
              onChange={(referenceText) => set("referenceText", referenceText)}
            />
          <p className="rounded-2xl bg-paper/60 p-4 text-sm">
            <strong>Template:</strong> Explore a concept — hook, prediction, explanation, hands-on activity, examples,
            sorting, recap, then a five-question quiz.
          </p>
        </fieldset>

        <div className="flex flex-wrap gap-3">
          {running ? (
            <Button variant="secondary" size="lg" onClick={cancel}>
              Cancel
            </Button>
          ) : (
            <>
              <Button type="submit" size="lg" disabled={storeState.status !== "ready"}>
                {run.status === "failed" ? "Try again" : "Generate lesson"}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => {
                  setValues(EXAMPLE_INPUT);
                  setFieldErrors({});
                }}
              >
                Load example
              </Button>
            </>
          )}
        </div>
      </form>

      {/* First on narrow screens so the mode notice and progress are seen before the long form. */}
      <aside className="order-first space-y-4 lg:order-none">
        <ModeNotice mode={mode} />
        {run.status !== "idle" && (
          <div
            ref={statusRef}
            tabIndex={-1}
            role="status"
            aria-live="polite"
            className="rounded-3xl bg-surface p-6 shadow-sm ring-1 ring-line outline-none"
          >
            <h2 className="mb-3 text-lg font-extrabold">{running ? "Creating your lesson…" : "Generation stopped"}</h2>
            <ol className="space-y-2">
              {run.stages.map((s) => (
                <li key={s.stage} className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                      s.status === "done" ? "bg-good-500 text-white" : "animate-pulse bg-brand-200",
                    )}
                  >
                    {s.status === "done" ? "✓" : ""}
                  </span>
                  <span className={s.status === "done" ? "text-muted" : "font-bold"}>
                    {STAGE_LABELS[s.stage]}
                    {s.retried && <span className="block text-sm font-normal text-muted">Fixed a problem and tried again</span>}
                    <span className="sr-only">{s.status === "done" ? " — done" : " — in progress"}</span>
                  </span>
                </li>
              ))}
              {running && run.stages.length === 0 && <li className="text-muted">Connecting…</li>}
            </ol>
            {run.status === "failed" && (
              <div className="mt-4 rounded-2xl bg-miss-50 p-4 ring-2 ring-miss-500">
                <p className="font-bold text-miss-700">{run.message}</p>
                <p className="mt-2 text-sm">
                  Your answers are still in the form.{" "}
                  <Link href="/" className="font-bold text-brand-700 underline underline-offset-2">
                    Or open a sample lesson
                  </Link>
                  .
                </p>
              </div>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}

function ModeNotice({ mode }: { mode: GenerationMode }) {
  if (mode === "live") {
    return (
      <p className="rounded-3xl bg-brand-50 p-5 text-sm leading-relaxed">
        <strong>AI-generated drafts.</strong> Lessons are written by Claude and checked for structure, but structure
        isn&apos;t proof of accuracy. You&apos;ll review and edit every lesson before presenting it.
      </p>
    );
  }
  return (
    <p className="rounded-3xl bg-sun-100 p-5 text-sm leading-relaxed">
      <strong>Sample mode.</strong> Live AI generation is switched off on this site. Generating gives you a copy of the
      closest curated lesson, so you can try the full workflow without an AI request.
    </p>
  );
}
