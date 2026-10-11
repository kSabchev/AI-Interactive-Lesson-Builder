import { type BillingStatus } from "@/lib/billing/status";
import { nextQuotaReset, PLANS } from "@/lib/billing/plans";
import { getEntitlements } from "@/lib/server/billing/account";
import { billingConfig } from "@/lib/server/billing/stripe";
import { getSessionUser } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";

/** The caller's plan, usage and limits, for display. Limits are enforced where they apply, not here. */
export async function GET(request: Request) {
  const billingEnabled = billingConfig().enabled;
  const user = await getSessionUser(request.headers);
  if (!user) {
    const status: BillingStatus = {
      signedIn: false,
      billingEnabled,
      plan: PLANS.free,
      used: 0,
      remaining: PLANS.free.generationsPerMonth,
      resetsAt: nextQuotaReset().toISOString(),
      savedLessons: 0,
      subscription: null,
    };
    return Response.json(status);
  }

  const e = await getEntitlements(await getDb(), user.id);
  const status: BillingStatus = {
    signedIn: true,
    billingEnabled,
    plan: e.plan,
    used: e.used,
    remaining: e.remaining,
    resetsAt: e.resetsAt,
    savedLessons: e.savedLessons,
    hasBillingAccount: Boolean(e.account),
    subscription:
      e.account?.subscriptionId && e.account.status
        ? {
            status: e.account.status,
            currentPeriodEnd: e.account.currentPeriodEnd?.toISOString() ?? null,
            cancelAtPeriodEnd: e.account.cancelAtPeriodEnd,
          }
        : null,
  };
  return Response.json(status);
}
