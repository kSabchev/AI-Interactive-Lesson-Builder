"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { redirectToStripe, useBilling } from "@/lib/billing/useBilling";

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** Plan, usage and billing controls on the account page. */
export function PlanSummary() {
  const { lookup, refresh } = useBilling();
  const justPaid = useSearchParams().get("checkout") === "success";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [polls, setPolls] = useState(0);

  const billing = lookup.status === "ready" ? lookup.billing : undefined;
  const waitingForWebhook = justPaid && billing?.plan.id === "free";

  // Stripe confirms the subscription by webhook, which can arrive a few seconds after the redirect.
  useEffect(() => {
    if (!waitingForWebhook || polls >= 10) return;
    const timer = setTimeout(() => {
      setPolls((n) => n + 1);
      refresh();
    }, 2000);
    return () => clearTimeout(timer);
  }, [waitingForWebhook, polls, refresh]);

  if (lookup.status === "loading") return <p className="text-muted">Loading your plan…</p>;
  if (lookup.status === "error" || !billing) return <p className="text-miss-700">Your plan couldn&apos;t be loaded.</p>;

  const { plan, subscription } = billing;

  async function manage() {
    setBusy(true);
    setError(undefined);
    try {
      await redirectToStripe("/api/billing/portal");
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="plan-heading" className="rounded-3xl bg-surface p-6 shadow-sm ring-1 ring-line">
      {justPaid && (
        <p role="status" className="mb-4 rounded-2xl bg-good-50 p-4 font-semibold text-good-700">
          {waitingForWebhook
            ? polls >= 10
              ? "Payment received. Your plan is taking longer than usual to update. Refresh in a minute."
              : "Thanks! Confirming your subscription…"
            : `Thanks! You're on ${plan.name}.`}
        </p>
      )}
      <h2 id="plan-heading" className="text-xl font-extrabold">
        {plan.name} plan
      </h2>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-sm font-bold text-muted">AI lessons this month</dt>
          <dd className="text-lg font-semibold">
            {billing.used} of {plan.generationsPerMonth} used
          </dd>
          <dd className="text-sm text-muted">Resets on {dateFormat.format(new Date(billing.resetsAt))}</dd>
        </div>
        <div>
          <dt className="text-sm font-bold text-muted">Saved lessons</dt>
          <dd className="text-lg font-semibold">
            {billing.savedLessons}
            {plan.savedLessons !== null ? ` of ${plan.savedLessons}` : ""}
          </dd>
        </div>
      </dl>

      {subscription && (
        <p className="mt-4 text-sm">
          {subscription.status === "past_due" ? (
            <strong className="text-miss-700">
              Your last payment didn&apos;t go through. Update your card in Manage billing to keep {plan.name}.
            </strong>
          ) : subscription.cancelAtPeriodEnd && subscription.currentPeriodEnd ? (
            <>Cancels on {dateFormat.format(new Date(subscription.currentPeriodEnd))}. You keep Pro until then.</>
          ) : subscription.currentPeriodEnd && plan.id !== "free" ? (
            <>Renews on {dateFormat.format(new Date(subscription.currentPeriodEnd))}.</>
          ) : null}
        </p>
      )}

      {error && (
        <p role="alert" className="mt-3 font-bold text-miss-700">
          {error}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {plan.id === "free" && (
          <ButtonLink href="/pricing">{billing.billingEnabled ? "Upgrade to Pro" : "See plans"}</ButtonLink>
        )}
        {billing.billingEnabled && billing.hasBillingAccount && (
          <Button variant="secondary" disabled={busy} onClick={() => void manage()}>
            Manage billing
          </Button>
        )}
      </div>
    </section>
  );
}
