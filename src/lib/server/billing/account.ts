import "server-only";
import { and, count, eq, sql } from "drizzle-orm";
import type Stripe from "stripe";
import { nextQuotaReset, type Plan, type PlanId, PLANS, quotaPeriod } from "@/lib/billing/plans";
import type { Database } from "../db";
import { billingAccount, generationQuota, lesson, stripeEvent, user } from "../db/schema";
import { planForPrice } from "./stripe";

/** Statuses that keep paid features on. `past_due` is a grace period while Stripe retries the payment. */
const ENTITLED_STATUSES = new Set(["active", "trialing", "past_due"]);

export type BillingAccount = typeof billingAccount.$inferSelect;

export async function getBillingAccount(db: Database, userId: string): Promise<BillingAccount | undefined> {
  const [row] = await db.select().from(billingAccount).where(eq(billingAccount.userId, userId));
  return row;
}

/** Links a Stripe customer to a user. Keeps the existing link if one was created concurrently. */
export async function linkCustomer(db: Database, userId: string, stripeCustomerId: string): Promise<BillingAccount> {
  await db.insert(billingAccount).values({ userId, stripeCustomerId }).onConflictDoNothing();
  return (await getBillingAccount(db, userId))!;
}

export type Entitlements = {
  plan: Plan;
  account: BillingAccount | undefined;
  period: string;
  used: number;
  remaining: number;
  resetsAt: string;
  savedLessons: number;
};

/**
 * `DEV_PLAN_OVERRIDE=pro` puts every account on that plan while developing, to try paid features without
 * Stripe. Ignored in production.
 */
function devPlanOverride(): Plan | undefined {
  const id = process.env.DEV_PLAN_OVERRIDE;
  if (!id || process.env.NODE_ENV === "production") return undefined;
  return Object.hasOwn(PLANS, id) ? PLANS[id as PlanId] : undefined;
}

export async function getEntitlements(db: Database, userId: string, now = new Date()): Promise<Entitlements> {
  const account = await getBillingAccount(db, userId);
  const plan = devPlanOverride() ?? PLANS[(account?.plan as PlanId | undefined) ?? "free"] ?? PLANS.free;
  const period = quotaPeriod(now);
  const [quota] = await db
    .select({ used: generationQuota.used })
    .from(generationQuota)
    .where(and(eq(generationQuota.userId, userId), eq(generationQuota.period, period)));
  const [saved] = await db.select({ n: count() }).from(lesson).where(eq(lesson.userId, userId));
  const used = quota?.used ?? 0;
  return {
    plan,
    account,
    period,
    used,
    remaining: Math.max(plan.generationsPerMonth - used, 0),
    resetsAt: nextQuotaReset(now).toISOString(),
    savedLessons: saved?.n ?? 0,
  };
}

/**
 * Reserves `cost` generations if that keeps the user within `limit` for the period. A single upsert does the
 * check and the increment, so parallel requests can't both slip under the limit.
 */
export async function reserveGenerations(
  db: Database,
  userId: string,
  cost: number,
  limit: number,
  period = quotaPeriod(),
): Promise<boolean> {
  if (cost > limit) return false;
  const rows = await db
    .insert(generationQuota)
    .values({ userId, period, used: cost })
    .onConflictDoUpdate({
      target: [generationQuota.userId, generationQuota.period],
      set: { used: sql`${generationQuota.used} + ${cost}` },
      setWhere: sql`${generationQuota.used} + ${cost} <= ${limit}`,
    })
    .returning({ used: generationQuota.used });
  return rows.length > 0;
}

/** Gives back generations reserved for a request that failed through no fault of the user. */
export async function releaseGenerations(db: Database, userId: string, cost: number, period = quotaPeriod()) {
  await db
    .update(generationQuota)
    .set({ used: sql`greatest(${generationQuota.used} - ${cost}, 0)` })
    .where(and(eq(generationQuota.userId, userId), eq(generationQuota.period, period)));
}

function customerId(customer: Stripe.Subscription["customer"]): string {
  return typeof customer === "string" ? customer : customer.id;
}

/**
 * Applies a subscription's state from a webhook. Ignores events older than the last one applied (Stripe
 * doesn't guarantee order), and an ending subscription can't downgrade a newer, still-active one.
 */
export async function applySubscription(db: Database, subscription: Stripe.Subscription, eventCreated: Date) {
  const stripeCustomerId = customerId(subscription.customer);
  let account = (
    await db.select().from(billingAccount).where(eq(billingAccount.stripeCustomerId, stripeCustomerId))
  )[0];

  if (!account) {
    // Normally linked at checkout; fall back to the user id stored on the subscription.
    const userId = subscription.metadata?.userId;
    const [owner] = userId ? await db.select({ id: user.id }).from(user).where(eq(user.id, userId)) : [];
    if (!owner) {
      console.warn(`[billing] subscription ${subscription.id} has no known user; ignoring.`);
      return;
    }
    account = await linkCustomer(db, owner.id, stripeCustomerId);
  }

  if (account.stripeEventAt && eventCreated < account.stripeEventAt) return;

  const item = subscription.items.data[0];
  const priceId = item?.price.id;
  const plan = planForPrice(priceId);
  const entitled = ENTITLED_STATUSES.has(subscription.status) && plan !== undefined;
  if (!plan && priceId) console.warn(`[billing] unknown price ${priceId} on subscription ${subscription.id}.`);

  const otherSubscriptionActive =
    account.subscriptionId !== null &&
    account.subscriptionId !== subscription.id &&
    account.plan !== "free" &&
    ENTITLED_STATUSES.has(account.status ?? "");
  if (!entitled && otherSubscriptionActive) return;

  await db
    .update(billingAccount)
    .set({
      subscriptionId: subscription.id,
      status: subscription.status,
      priceId: priceId ?? null,
      plan: entitled ? plan : "free",
      currentPeriodEnd: item ? new Date(item.current_period_end * 1000) : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end || subscription.cancel_at !== null,
      stripeEventAt: eventCreated,
      updatedAt: new Date(),
    })
    .where(eq(billingAccount.userId, account.userId));
}

/** Subscription states that will still charge the customer. */
const BILLABLE_STATUSES = new Set(["active", "trialing", "past_due", "unpaid", "incomplete", "paused"]);

/**
 * Cancels a user's subscription immediately, before their account is deleted, so nobody keeps paying for
 * an account that no longer exists. Throws if it can't, which blocks the deletion.
 */
export async function cancelSubscriptionForDeletedUser(
  db: Database,
  userId: string,
  cancel: (subscriptionId: string) => Promise<unknown>,
) {
  const account = await getBillingAccount(db, userId);
  if (!account?.subscriptionId || !BILLABLE_STATUSES.has(account.status ?? "")) return;
  await cancel(account.subscriptionId);
}

const SUBSCRIPTION_EVENTS = new Set([
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
]);

/**
 * Handles one verified webhook event exactly once: the event id is recorded in the same transaction as
 * its effects, so a failure rolls both back and Stripe's retry is processed normally.
 */
export async function handleStripeEvent(db: Database, event: Stripe.Event): Promise<"applied" | "duplicate" | "ignored"> {
  return db.transaction(async (tx) => {
    const inserted = await tx
      .insert(stripeEvent)
      .values({ id: event.id, type: event.type })
      .onConflictDoNothing()
      .returning({ id: stripeEvent.id });
    if (inserted.length === 0) return "duplicate";

    const created = new Date(event.created * 1000);
    if (SUBSCRIPTION_EVENTS.has(event.type)) {
      await applySubscription(tx, event.data.object as Stripe.Subscription, created);
      return "applied";
    }
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      const customer = typeof session.customer === "string" ? session.customer : session.customer?.id;
      if (userId && customer) await linkCustomer(tx, userId, customer);
      return "applied";
    }
    return "ignored";
  });
}
