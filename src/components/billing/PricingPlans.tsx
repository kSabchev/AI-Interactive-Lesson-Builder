"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { type BillingInterval, type Plan, PLANS } from "@/lib/billing/plans";
import { redirectToStripe, useBilling } from "@/lib/billing/useBilling";
import { cn } from "@/lib/cn";
import type { Dictionary } from "@/lib/i18n";
import { useT } from "@/lib/i18n/client";

function features(plan: Plan, t: Dictionary): string[] {
  const f = t.pricing.features;
  return [
    f.aiLessons(plan.generationsPerMonth),
    plan.savedLessons === null ? f.unlimitedSaved : f.saveUpTo(plan.savedLessons),
    plan.referenceText ? f.reference : f.basics,
    ...(plan.webResearch ? [f.research] : []),
    ...(plan.highQuality ? [f.highQuality] : []),
    ...(plan.id === "classroom" ? [f.classroom] : []),
  ];
}

export function PricingPlans() {
  const t = useT();
  const { lookup } = useBilling();
  const cancelled = useSearchParams().get("checkout") === "cancelled";
  const [interval, setInterval] = useState<BillingInterval>("month");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const billing = lookup.status === "ready" ? lookup.billing : undefined;
  const currentPlan = billing?.signedIn ? billing.plan.id : undefined;

  async function go(path: "/api/billing/checkout" | "/api/billing/portal", body?: unknown) {
    setBusy(true);
    setError(undefined);
    try {
      await redirectToStripe(path, body);
    } catch (e) {
      setError((e as Error).message || t.pricing.billingUnavailable);
      setBusy(false);
    }
  }

  function proAction() {
    if (!billing) return <Button disabled>{t.common.loading}</Button>;
    if (!billing.billingEnabled) return <Button disabled>{t.common.comingSoon}</Button>;
    if (!billing.signedIn) {
      return (
        <ButtonLink href="/sign-in?next=/pricing" size="lg">
          {t.pricing.signInToUpgrade}
        </ButtonLink>
      );
    }
    if (currentPlan === "pro") {
      return (
        <Button variant="secondary" size="lg" disabled={busy} onClick={() => void go("/api/billing/portal")}>
          {t.plan.manage}
        </Button>
      );
    }
    return (
      <Button size="lg" disabled={busy} onClick={() => void go("/api/billing/checkout", { interval })}>
        {busy ? t.pricing.openingCheckout : t.plan.upgrade}
      </Button>
    );
  }

  return (
    <div className="space-y-6">
      {cancelled && (
        <p role="status" className="rounded-2xl bg-sun-100 p-4">
          {t.pricing.cancelled}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-2xl bg-miss-50 p-4 font-bold text-miss-700">
          {error}
        </p>
      )}

      <div
        role="radiogroup"
        aria-label={t.pricing.period}
        className="inline-flex rounded-full bg-surface p-1 ring-1 ring-line"
      >
        {(["month", "year"] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={interval === value}
            onClick={() => setInterval(value)}
            className={cn(
              "rounded-full px-5 py-2 font-bold",
              interval === value ? "bg-brand-600 text-white" : "text-muted hover:text-ink",
            )}
          >
            {value === "month" ? t.pricing.monthly : t.pricing.yearly}
          </button>
        ))}
      </div>

      <ul className="grid gap-4 lg:grid-cols-3">
        {Object.values(PLANS).map((plan) => {
          const price = plan.id === "pro" ? plan.prices[interval] : plan.prices.month;
          const per =
            plan.id === "pro"
              ? interval === "month"
                ? t.pricing.perMonth
                : t.pricing.perYear
              : plan.id === "classroom"
                ? t.pricing.perTeacherMonth
                : t.pricing.perMonth;
          const copy = t.pricing.plans[plan.id];
          return (
            <li
              key={plan.id}
              className={cn(
                "flex flex-col rounded-3xl bg-surface p-6 shadow-sm ring-1",
                plan.id === "pro" ? "ring-2 ring-brand-500" : "ring-line",
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-extrabold">{copy.name}</h2>
                {currentPlan === plan.id && (
                  <span className="rounded-full bg-good-50 px-3 py-1 text-sm font-bold text-good-700">
                    {t.pricing.yourPlan}
                  </span>
                )}
                {!plan.available && (
                  <span className="rounded-full bg-paper px-3 py-1 text-sm font-bold text-muted">
                    {t.common.comingSoon}
                  </span>
                )}
              </div>
              <p className="mt-1 text-muted">{copy.tagline}</p>
              <p className="mt-4">
                <span className="text-4xl font-extrabold">${price}</span>
                <span className="text-muted"> / {per}</span>
              </p>
              <ul className="mt-4 flex-1 space-y-2">
                {features(plan, t).map((f) => (
                  <li key={f} className="flex gap-2">
                    <span aria-hidden="true" className="text-good-500">
                      ✓
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                {plan.id === "pro" ? (
                  proAction()
                ) : plan.id === "free" ? (
                  billing?.signedIn ? null : (
                    <ButtonLink href="/sign-in?next=/create" variant="secondary" size="lg">
                      {t.pricing.startFree}
                    </ButtonLink>
                  )
                ) : (
                  <Button variant="secondary" size="lg" disabled>
                    {t.common.comingSoon}
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="text-sm text-muted">{t.pricing.footnote}</p>
    </div>
  );
}
