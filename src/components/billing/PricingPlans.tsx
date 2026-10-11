"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { type BillingInterval, type Plan, PLANS } from "@/lib/billing/plans";
import { redirectToStripe, useBilling } from "@/lib/billing/useBilling";
import { cn } from "@/lib/cn";

function features(plan: Plan): string[] {
  return [
    `${plan.generationsPerMonth} AI-generated lessons a month`,
    plan.savedLessons === null ? "Unlimited saved lessons" : `Save up to ${plan.savedLessons} lessons`,
    plan.referenceText ? "Lessons from your own reference material" : "Curated samples, editor, player and quizzes",
    ...(plan.highQuality ? ["High-quality generation option"] : []),
    ...(plan.id === "classroom" ? ["Shared school library and teacher seats"] : []),
  ];
}

export function PricingPlans() {
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
      setError((e as Error).message);
      setBusy(false);
    }
  }

  function proAction() {
    if (!billing) return <Button disabled>Loading…</Button>;
    if (!billing.billingEnabled) return <Button disabled>Coming soon</Button>;
    if (!billing.signedIn) {
      return (
        <ButtonLink href="/sign-in?next=/pricing" size="lg">
          Sign in to upgrade
        </ButtonLink>
      );
    }
    if (currentPlan === "pro") {
      return (
        <Button variant="secondary" size="lg" disabled={busy} onClick={() => void go("/api/billing/portal")}>
          Manage billing
        </Button>
      );
    }
    return (
      <Button size="lg" disabled={busy} onClick={() => void go("/api/billing/checkout", { interval })}>
        {busy ? "Opening checkout…" : "Upgrade to Pro"}
      </Button>
    );
  }

  return (
    <div className="space-y-6">
      {cancelled && (
        <p role="status" className="rounded-2xl bg-sun-100 p-4">
          Checkout was cancelled, so nothing was charged. You can upgrade whenever you&apos;re ready.
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-2xl bg-miss-50 p-4 font-bold text-miss-700">
          {error}
        </p>
      )}

      <div role="radiogroup" aria-label="Billing period" className="inline-flex rounded-full bg-surface p-1 ring-1 ring-line">
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
            {value === "month" ? "Monthly" : "Yearly (2 months free)"}
          </button>
        ))}
      </div>

      <ul className="grid gap-4 lg:grid-cols-3">
        {Object.values(PLANS).map((plan) => {
          const price = plan.id === "pro" ? plan.prices[interval] : plan.prices.month;
          const per = plan.id === "pro" ? (interval === "month" ? "month" : "year") : plan.id === "classroom" ? "teacher / month" : "month";
          return (
            <li
              key={plan.id}
              className={cn(
                "flex flex-col rounded-3xl bg-surface p-6 shadow-sm ring-1",
                plan.id === "pro" ? "ring-2 ring-brand-500" : "ring-line",
              )}
            >
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-extrabold">{plan.name}</h2>
                {currentPlan === plan.id && (
                  <span className="rounded-full bg-good-50 px-3 py-1 text-sm font-bold text-good-700">Your plan</span>
                )}
                {!plan.available && (
                  <span className="rounded-full bg-paper px-3 py-1 text-sm font-bold text-muted">Coming soon</span>
                )}
              </div>
              <p className="mt-1 text-muted">{plan.tagline}</p>
              <p className="mt-4">
                <span className="text-4xl font-extrabold">${price}</span>
                <span className="text-muted"> / {per}</span>
              </p>
              <ul className="mt-4 flex-1 space-y-2">
                {features(plan).map((f) => (
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
                      Start free
                    </ButtonLink>
                  )
                ) : (
                  <Button variant="secondary" size="lg" disabled>
                    Coming soon
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="text-sm text-muted">
        Prices in US dollars. AI lesson allowances reset on the 1st of each month. A high-quality lesson counts as two.
        Cancel any time from Manage billing; you keep Pro until the end of the period you paid for.
      </p>
    </div>
  );
}
