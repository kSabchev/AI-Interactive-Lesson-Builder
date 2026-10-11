"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SelectField, TextArea, TextField } from "@/components/editor/fields";
import { Button, ButtonLink } from "@/components/ui/Button";
import { HIGH_QUALITY_COST } from "@/lib/billing/plans";
import { useBilling } from "@/lib/billing/useBilling";
import { cn } from "@/lib/cn";
import { requestGeneration } from "@/lib/generation/client";
import {
  type GenerationErrorCode,
  type GenerationEvent,
  type GenerationMode,
  type Stage,
  STAGE_LABELS,
} from "@/lib/generation/events";
import {
  EXAMPLE_INPUT,
  type GenerationFormValues,
  generationInputSchema,
  REFERENCE_MAX,
  TOPIC_MAX,
} from "@/lib/generation/input";
import { StoreError } from "@/lib/storage/store";
import { useStore } from "@/lib/storage/StoreProvider";

type StageState = { stage: Stage; status: "start" | "done"; retried: boolean };

type Run =
  | { status: "idle" }
  | { status: "running"; stages: StageState[] }
  | { status: "failed"; stages: StageState[]; message: string; code?: GenerationErrorCode };

const EMPTY: GenerationFormValues = {
  topic: "",
  ageGroup: "8-10",
  durationMinutes: 10,
  referenceText: "",
  quality: "standard",
};

export function CreateLessonForm({ mode, webResearch = false }: { mode: GenerationMode; webResearch?: boolean }) {
  const router = useRouter();
  const storeState = useStore();
  const { lookup: billingLookup } = useBilling();
  const billing = billingLookup.status === "ready" ? billingLookup.billing : undefined;
  // Plan limits only apply to live AI generation; sample mode is open to everyone.
  const live = mode === "live";
  const plan = billing?.plan;
  const needsSignIn = live && billing !== undefined && !billing.signedIn;
  const canUseReference = !live || Boolean(plan?.referenceText);
  const canUseHighQuality = live && Boolean(plan?.highQuality);
  const offerResearch = live && webResearch;
  const canResearch = offerResearch && Boolean(plan?.webResearch);
  const [values, setValues] = useState<GenerationFormValues>(EMPTY);
  const hasReference = Boolean(values.referenceText?.trim());
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
    const parsed = generationInputSchema.safeParse({
      ...values,
      referenceText: canUseReference ? values.referenceText : "",
      quality: canUseHighQuality ? values.quality : "standard",
      research: canResearch && !hasReference && Boolean(values.research),
    });
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
        setRun({ status: "failed", stages, message: event.message, code: event.code });
      } else if (event.type === "done") {
        try {
          if (storeState.status !== "ready") throw new Error("store not ready");
          await storeState.store.saveLesson(event.lesson);
          router.push(`/lessons/${event.lesson.id}/edit?generated=1`);
        } catch (error) {
          setRun({
            status: "failed",
            stages,
            message:
              error instanceof StoreError && error.status === 403
                ? `${error.message} The lesson wasn't saved.`
                : storeState.status === "ready" && storeState.store.kind === "account"
                  ? "The lesson was created but couldn't be saved to your account. Check your connection and try again."
                  : "The lesson was created but couldn't be saved in this browser (private browsing can block storage). Try a normal window.",
          });
        }
      }
    };

    try {
      await requestGeneration(parsed.data, (event) => void onEvent(event), controller.signal);
    } catch {
      if (!controller.signal.aborted)
        setRun({ status: "failed", stages, message: "Generation stopped unexpectedly. Please try again." });
    }
  }

  function cancel() {
    abortRef.current?.abort();
    setRun({ status: "idle" });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <form
        onSubmit={generate}
        noValidate
        className="space-y-6 rounded-3xl bg-surface p-6 shadow-sm ring-1 ring-line md:p-8"
      >
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
          {canUseReference ? (
            <TextArea
              label="Reference text (optional)"
              hint="Paste educational material to base the lesson on, such as a textbook page. The lesson will be labelled as reference-based."
              rows={5}
              value={values.referenceText ?? ""}
              maxLength={REFERENCE_MAX}
              error={fieldErrors.referenceText}
              onChange={(referenceText) => set("referenceText", referenceText)}
            />
          ) : (
            <p className="rounded-2xl border-2 border-dashed border-line p-4 text-sm">
              <strong>Reference text</strong> — base lessons on your own material with{" "}
              <Link href="/pricing" className="font-bold text-brand-700 underline underline-offset-2">
                Pro
              </Link>
              .
            </p>
          )}
          {offerResearch && (
            <div className="rounded-2xl border-2 border-line p-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 size-5 accent-brand-600"
                  checked={Boolean(values.research) && !hasReference}
                  disabled={!canResearch || hasReference}
                  onChange={(e) => set("research", e.target.checked)}
                  aria-describedby="research-hint"
                />
                <span>
                  <span className="font-bold">Research the topic on the web</span>
                  <span id="research-hint" className="block text-sm text-muted">
                    {!canResearch ? (
                      <>
                        Finds reliable pages and cites them in the lesson. Part of{" "}
                        <Link href="/pricing" className="font-bold text-brand-700 underline underline-offset-2">
                          Pro
                        </Link>
                        .
                      </>
                    ) : hasReference ? (
                      "Your reference text is used instead."
                    ) : (
                      "Finds reliable pages and cites them, so you can check every fact. Takes a little longer."
                    )}
                  </span>
                </span>
              </label>
            </div>
          )}
          {canUseHighQuality && (
            <SelectField
              label="Quality"
              hint={`High quality uses a larger model and counts as ${HIGH_QUALITY_COST} AI lessons.`}
              value={values.quality ?? "standard"}
              options={[
                { value: "standard", label: "Standard" },
                { value: "high", label: `High quality (counts as ${HIGH_QUALITY_COST})` },
              ]}
              onChange={(quality) => set("quality", quality)}
            />
          )}
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
              <Button type="submit" size="lg" disabled={storeState.status !== "ready" || needsSignIn}>
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
        {needsSignIn && (
          <div className="rounded-3xl bg-surface p-5 ring-1 ring-line">
            <p className="font-bold">Sign in to create AI lessons</p>
            <p className="mt-1 text-sm text-muted">
              Free accounts get {billing?.plan.generationsPerMonth} AI lessons a month. Sample lessons work without one.
            </p>
            <ButtonLink href="/sign-in?next=/create" className="mt-3">
              Sign in
            </ButtonLink>
          </div>
        )}
        {live && billing?.signedIn && plan && (
          <p className="rounded-3xl bg-surface p-5 text-sm ring-1 ring-line">
            <strong>
              {billing.remaining} of {plan.generationsPerMonth} AI lessons left
            </strong>{" "}
            this month on {plan.name}.
            {plan.id === "free" && (
              <>
                {" "}
                <Link href="/pricing" className="font-bold text-brand-700 underline underline-offset-2">
                  Get more with Pro
                </Link>
              </>
            )}
          </p>
        )}
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
                    {s.retried && (
                      <span className="block text-sm font-normal text-muted">Fixed a problem and tried again</span>
                    )}
                    <span className="sr-only">{s.status === "done" ? " — done" : " — in progress"}</span>
                  </span>
                </li>
              ))}
              {running && run.stages.length === 0 && <li className="text-muted">Connecting…</li>}
            </ol>
            {run.status === "failed" && (
              <div className="mt-4 rounded-2xl bg-miss-50 p-4 ring-2 ring-miss-500">
                <p className="font-bold text-miss-700">{run.message}</p>
                {run.code === "sign_in_required" && (
                  <ButtonLink href="/sign-in?next=/create" className="mt-3">
                    Sign in
                  </ButtonLink>
                )}
                {(run.code === "upgrade_required" || run.code === "quota_exceeded") && (
                  <ButtonLink href="/pricing" className="mt-3">
                    See plans
                  </ButtonLink>
                )}
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
