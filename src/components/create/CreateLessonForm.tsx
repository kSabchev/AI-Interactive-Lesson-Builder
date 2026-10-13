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
import { type GenerationErrorCode, type GenerationEvent, type GenerationMode, type Stage } from "@/lib/generation/events";
import {
  EXAMPLE_INPUT,
  type GenerationFormValues,
  generationInputSchema,
  inputIssueMessage,
  REFERENCE_MAX,
  TOPIC_MAX,
} from "@/lib/generation/input";
import { useT } from "@/lib/i18n/client";
import { detectLanguage } from "@/lib/i18n/detect";
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

const linkClass = "font-bold text-brand-700 underline underline-offset-2";

export function CreateLessonForm({ mode, webResearch = false }: { mode: GenerationMode; webResearch?: boolean }) {
  const t = useT();
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
  const lessonLanguage = values.topic.trim() ? detectLanguage(values.topic) : undefined;

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
        errors[key] ??= inputIssueMessage(issue, t);
      }
      setFieldErrors(errors);
      requestAnimationFrame(() => document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
      return;
    }
    setFieldErrors({});

    const controller = new AbortController();
    abortRef.current = controller;
    let stages: StageState[] = [];
    let researchFallback = false;
    setRun({ status: "running", stages });
    requestAnimationFrame(() => statusRef.current?.focus());

    const onEvent = async (event: GenerationEvent) => {
      if (event.type === "stage") {
        const existing = stages.find((s) => s.stage === event.stage);
        stages = existing
          ? stages.map((s) => (s.stage === event.stage ? { ...s, status: event.status } : s))
          : [...stages, { stage: event.stage, status: event.status, retried: false }];
        setRun({ status: "running", stages });
      } else if (event.type === "research_fallback") {
        researchFallback = true;
      } else if (event.type === "retry") {
        stages = stages.map((s) => (s.stage === event.stage ? { ...s, retried: true } : s));
        setRun({ status: "running", stages });
      } else if (event.type === "error") {
        setRun({ status: "failed", stages, message: event.message, code: event.code });
      } else if (event.type === "done") {
        try {
          if (storeState.status !== "ready") throw new Error("store not ready");
          await storeState.store.saveLesson(event.lesson);
          router.push(`/lessons/${event.lesson.id}/edit?generated=${researchFallback ? "no-sources" : "1"}`);
        } catch (error) {
          setRun({
            status: "failed",
            stages,
            message:
              error instanceof StoreError && error.status === 403
                ? t.create.savedButLimit(error.message)
                : storeState.status === "ready" && storeState.store.kind === "account"
                  ? t.create.saveFailedAccount
                  : t.create.saveFailedBrowser,
          });
        }
      }
    };

    try {
      await requestGeneration(parsed.data, (event) => void onEvent(event), t, controller.signal);
    } catch {
      if (!controller.signal.aborted) setRun({ status: "failed", stages, message: t.create.stoppedUnexpectedly });
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
          <div className="space-y-1">
            <TextField
              label={t.create.topic}
              hint={t.create.topicHint}
              value={values.topic}
              maxLength={TOPIC_MAX}
              error={fieldErrors.topic}
              onChange={(topic) => set("topic", topic)}
            />
            {lessonLanguage && (
              <p className="text-sm font-semibold text-brand-700" aria-live="polite">
                {t.create.lessonLanguage(t.language.names[lessonLanguage])}
              </p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label={t.create.learnerAge}
              value={values.ageGroup}
              options={[
                { value: "8-10", label: t.common.ages("8–10") },
                { value: "11-12", label: t.common.ages("11–12") },
              ]}
              onChange={(ageGroup) => set("ageGroup", ageGroup)}
            />
            <SelectField
              label={t.create.lessonLength}
              value={String(values.durationMinutes) as "10" | "15"}
              options={[
                { value: "10", label: t.common.minutesLong(10) },
                { value: "15", label: t.common.minutesLong(15) },
              ]}
              onChange={(v) => set("durationMinutes", Number(v) as 10 | 15)}
            />
          </div>
          {canUseReference ? (
            <TextArea
              label={t.create.reference}
              hint={t.create.referenceHint}
              rows={5}
              value={values.referenceText ?? ""}
              maxLength={REFERENCE_MAX}
              error={fieldErrors.referenceText}
              onChange={(referenceText) => set("referenceText", referenceText)}
            />
          ) : (
            <p className="rounded-2xl border-2 border-dashed border-line p-4 text-sm">
              <strong>{t.create.referenceLocked}</strong> {t.create.referenceLockedText}{" "}
              <Link href="/pricing" className={linkClass}>
                {t.common.pro}
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
                  <span className="font-bold">{t.create.research}</span>
                  <span id="research-hint" className="block text-sm text-muted">
                    {!canResearch ? (
                      <>
                        {t.create.researchLocked}{" "}
                        <Link href="/pricing" className={linkClass}>
                          {t.common.pro}
                        </Link>
                        .
                      </>
                    ) : hasReference ? (
                      t.create.researchUsesReference
                    ) : (
                      t.create.researchHint
                    )}
                  </span>
                </span>
              </label>
            </div>
          )}
          {canUseHighQuality && (
            <SelectField
              label={t.create.quality}
              hint={t.create.qualityHint(HIGH_QUALITY_COST)}
              value={values.quality ?? "standard"}
              options={[
                { value: "standard", label: t.create.standard },
                { value: "high", label: t.create.high(HIGH_QUALITY_COST) },
              ]}
              onChange={(quality) => set("quality", quality)}
            />
          )}
          <p className="rounded-2xl bg-paper/60 p-4 text-sm">
            <strong>{t.create.template}</strong> {t.create.templateText}
          </p>
        </fieldset>

        <div className="flex flex-wrap gap-3">
          {running ? (
            <Button variant="secondary" size="lg" onClick={cancel}>
              {t.common.cancel}
            </Button>
          ) : (
            <>
              <Button type="submit" size="lg" disabled={storeState.status !== "ready" || needsSignIn}>
                {run.status === "failed" ? t.create.tryAgain : t.create.generate}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => {
                  setValues({ ...EXAMPLE_INPUT, topic: t.create.exampleTopic });
                  setFieldErrors({});
                }}
              >
                {t.create.loadExample}
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
            <p className="font-bold">{t.create.signInTitle}</p>
            <p className="mt-1 text-sm text-muted">{t.create.signInBody(billing?.plan.generationsPerMonth ?? 0)}</p>
            <ButtonLink href="/sign-in?next=/create" className="mt-3">
              {t.common.signIn}
            </ButtonLink>
          </div>
        )}
        {live && billing?.signedIn && plan && (
          <p className="rounded-3xl bg-surface p-5 text-sm ring-1 ring-line">
            <strong>{t.create.remaining(billing.remaining, plan.generationsPerMonth)}</strong>{" "}
            {t.create.remainingSuffix(t.pricing.plans[plan.id].name)}
            {plan.id === "free" && (
              <>
                {" "}
                <Link href="/pricing" className={linkClass}>
                  {t.create.getMore}
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
            <h2 className="mb-3 text-lg font-extrabold">{running ? t.create.creating : t.create.stopped}</h2>
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
                    {t.create.stages[s.stage]}
                    {s.retried && (
                      <span className="block text-sm font-normal text-muted">{t.create.fixedProblem}</span>
                    )}
                    <span className="sr-only">{s.status === "done" ? t.create.done : t.create.inProgress}</span>
                  </span>
                </li>
              ))}
              {running && run.stages.length === 0 && <li className="text-muted">{t.create.connecting}</li>}
            </ol>
            {run.status === "failed" && (
              <div className="mt-4 rounded-2xl bg-miss-50 p-4 ring-2 ring-miss-500">
                <p className="font-bold text-miss-700">{run.message}</p>
                {run.code === "sign_in_required" && (
                  <ButtonLink href="/sign-in?next=/create" className="mt-3">
                    {t.common.signIn}
                  </ButtonLink>
                )}
                {(run.code === "upgrade_required" || run.code === "quota_exceeded") && (
                  <ButtonLink href="/pricing" className="mt-3">
                    {t.common.seePlans}
                  </ButtonLink>
                )}
                <p className="mt-2 text-sm">
                  {t.create.stillInForm}{" "}
                  <Link href="/" className={linkClass}>
                    {t.create.orOpenSample}
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
  const t = useT();
  if (mode === "live") {
    return (
      <p className="rounded-3xl bg-brand-50 p-5 text-sm leading-relaxed">
        <strong>{t.create.liveNoticeTitle}</strong> {t.create.liveNotice}
      </p>
    );
  }
  return (
    <p className="rounded-3xl bg-sun-100 p-5 text-sm leading-relaxed">
      <strong>{t.create.sampleNoticeTitle}</strong> {t.create.sampleNotice}
    </p>
  );
}
