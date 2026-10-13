"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { redirectToStripe, useBilling } from "@/lib/billing/useBilling";
import { intlLocale } from "@/lib/i18n";
import { useLocale, useT } from "@/lib/i18n/client";

/** Plan, usage and billing controls on the account page. */
export function PlanSummary() {
  const t = useT();
  const { locale } = useLocale();
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

  if (lookup.status === "loading") return <p className="text-muted">{t.plan.loading}</p>;
  if (lookup.status === "error" || !billing) return <p className="text-miss-700">{t.plan.loadFailed}</p>;

  const { plan, subscription } = billing;
  const planName = t.pricing.plans[plan.id].name;
  const date = (iso: string) =>
    new Intl.DateTimeFormat(intlLocale(locale), { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
      new Date(iso),
    );

  async function manage() {
    setBusy(true);
    setError(undefined);
    try {
      await redirectToStripe("/api/billing/portal");
    } catch (e) {
      setError((e as Error).message || t.pricing.billingUnavailable);
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="plan-heading" className="rounded-3xl bg-surface p-6 shadow-sm ring-1 ring-line">
      {justPaid && (
        <p role="status" className="mb-4 rounded-2xl bg-good-50 p-4 font-semibold text-good-700">
          {waitingForWebhook ? (polls >= 10 ? t.plan.paymentSlow : t.plan.confirming) : t.plan.thanks(planName)}
        </p>
      )}
      <h2 id="plan-heading" className="text-xl font-extrabold">
        {t.plan.title(planName)}
      </h2>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-sm font-bold text-muted">{t.plan.aiThisMonth}</dt>
          <dd className="text-lg font-semibold">{t.plan.used(billing.used, plan.generationsPerMonth)}</dd>
          <dd className="text-sm text-muted">{t.plan.resetsOn(date(billing.resetsAt))}</dd>
        </div>
        <div>
          <dt className="text-sm font-bold text-muted">{t.plan.savedLessons}</dt>
          <dd className="text-lg font-semibold">{t.plan.savedOf(billing.savedLessons, plan.savedLessons)}</dd>
        </div>
      </dl>

      {subscription && (
        <p className="mt-4 text-sm">
          {subscription.status === "past_due" ? (
            <strong className="text-miss-700">{t.plan.pastDue(planName)}</strong>
          ) : subscription.cancelAtPeriodEnd && subscription.currentPeriodEnd ? (
            t.plan.cancels(date(subscription.currentPeriodEnd))
          ) : subscription.currentPeriodEnd && plan.id !== "free" ? (
            t.plan.renews(date(subscription.currentPeriodEnd))
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
          <ButtonLink href="/pricing">{billing.billingEnabled ? t.plan.upgrade : t.common.seePlans}</ButtonLink>
        )}
        {billing.billingEnabled && billing.hasBillingAccount && (
          <Button variant="secondary" disabled={busy} onClick={() => void manage()}>
            {t.plan.manage}
          </Button>
        )}
      </div>
    </section>
  );
}
