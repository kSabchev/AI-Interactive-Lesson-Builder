import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { type Database, getDb } from "../db";
import { billingAccount, stripeEvent, user } from "../db/schema";
import {
  applySubscription,
  cancelSubscriptionForDeletedUser,
  getEntitlements,
  handleStripeEvent,
  linkCustomer,
  releaseGenerations,
  reserveGenerations,
} from "./account";

let db: Database;
let n = 0;

async function newUser() {
  const id = `billing-user-${++n}`;
  await db.insert(user).values({ id, name: id, email: `${id}@example.com` });
  return id;
}

function subscription(overrides: {
  id?: string;
  customer: string;
  status?: Stripe.Subscription.Status;
  price?: string;
  cancelAtPeriodEnd?: boolean;
  metadata?: Record<string, string>;
}): Stripe.Subscription {
  return {
    id: overrides.id ?? "sub_1",
    object: "subscription",
    customer: overrides.customer,
    status: overrides.status ?? "active",
    cancel_at_period_end: overrides.cancelAtPeriodEnd ?? false,
    cancel_at: null,
    metadata: overrides.metadata ?? {},
    items: { data: [{ price: { id: overrides.price ?? "price_pro_month" }, current_period_end: 1_800_000_000 }] },
  } as unknown as Stripe.Subscription;
}

function event(id: string, type: string, object: unknown, created = 1_700_000_000): Stripe.Event {
  return { id, type, created, data: { object } } as unknown as Stripe.Event;
}

beforeAll(async () => {
  db = await getDb();
});

beforeEach(() => {
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_x");
  vi.stubEnv("STRIPE_PRICE_PRO_MONTHLY", "price_pro_month");
  vi.stubEnv("STRIPE_PRICE_PRO_YEARLY", "price_pro_year");
});

describe("generation quota", () => {
  it("never lets parallel requests exceed the limit", async () => {
    const userId = await newUser();
    const results = await Promise.all(Array.from({ length: 20 }, () => reserveGenerations(db, userId, 1, 3, "2026-10")));
    expect(results.filter(Boolean)).toHaveLength(3);
    expect((await getEntitlements(db, userId, new Date("2026-10-15"))).used).toBe(3);
  });

  it("counts high-quality generations double and refunds failures", async () => {
    const userId = await newUser();
    expect(await reserveGenerations(db, userId, 2, 3, "2026-10")).toBe(true);
    expect(await reserveGenerations(db, userId, 2, 3, "2026-10")).toBe(false);
    await releaseGenerations(db, userId, 2, "2026-10");
    expect(await reserveGenerations(db, userId, 2, 3, "2026-10")).toBe(true);
  });

  it("resets each month", async () => {
    const userId = await newUser();
    expect(await reserveGenerations(db, userId, 3, 3, "2026-10")).toBe(true);
    expect(await reserveGenerations(db, userId, 1, 3, "2026-11")).toBe(true);
    const november = await getEntitlements(db, userId, new Date("2026-11-02T00:00:00Z"));
    expect(november).toMatchObject({ used: 1, remaining: 2, resetsAt: "2026-12-01T00:00:00.000Z" });
  });
});

describe("subscription sync", () => {
  it("upgrades on an active Pro subscription and downgrades when it ends", async () => {
    const userId = await newUser();
    await linkCustomer(db, userId, "cus_a");

    await applySubscription(db, subscription({ customer: "cus_a" }), new Date(1_000));
    let ent = await getEntitlements(db, userId);
    expect(ent.plan.id).toBe("pro");
    expect(ent.account?.currentPeriodEnd?.toISOString()).toBe(new Date(1_800_000_000_000).toISOString());

    await applySubscription(db, subscription({ customer: "cus_a", status: "canceled" }), new Date(2_000));
    ent = await getEntitlements(db, userId);
    expect(ent.plan.id).toBe("free");
  });

  it("keeps Pro during a past-due grace period but not once unpaid", async () => {
    const userId = await newUser();
    await linkCustomer(db, userId, "cus_b");
    await applySubscription(db, subscription({ customer: "cus_b", status: "past_due" }), new Date(1_000));
    expect((await getEntitlements(db, userId)).plan.id).toBe("pro");
    await applySubscription(db, subscription({ customer: "cus_b", status: "unpaid" }), new Date(2_000));
    expect((await getEntitlements(db, userId)).plan.id).toBe("free");
  });

  it("ignores events older than the last one applied", async () => {
    const userId = await newUser();
    await linkCustomer(db, userId, "cus_c");
    await applySubscription(db, subscription({ customer: "cus_c", status: "canceled" }), new Date(5_000));
    await applySubscription(db, subscription({ customer: "cus_c", status: "active" }), new Date(4_000));
    expect((await getEntitlements(db, userId)).plan.id).toBe("free");
  });

  it("doesn't let an old subscription ending downgrade a newer active one", async () => {
    const userId = await newUser();
    await linkCustomer(db, userId, "cus_d");
    await applySubscription(db, subscription({ id: "sub_new", customer: "cus_d" }), new Date(1_000));
    await applySubscription(db, subscription({ id: "sub_old", customer: "cus_d", status: "canceled" }), new Date(2_000));
    expect((await getEntitlements(db, userId)).plan.id).toBe("pro");
  });

  it("ignores unknown prices rather than granting a plan", async () => {
    const userId = await newUser();
    await linkCustomer(db, userId, "cus_e");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    await applySubscription(db, subscription({ customer: "cus_e", price: "price_other" }), new Date(1_000));
    expect((await getEntitlements(db, userId)).plan.id).toBe("free");
  });

  it("links the customer from subscription metadata when checkout linking was missed", async () => {
    const userId = await newUser();
    await applySubscription(db, subscription({ customer: "cus_f", metadata: { userId } }), new Date(1_000));
    expect((await getEntitlements(db, userId)).plan.id).toBe("pro");
  });
});

describe("webhook events", () => {
  it("processes each event once", async () => {
    const userId = await newUser();
    await linkCustomer(db, userId, "cus_g");
    const e = event("evt_once", "customer.subscription.created", subscription({ customer: "cus_g" }));
    expect(await handleStripeEvent(db, e)).toBe("applied");
    expect(await handleStripeEvent(db, e)).toBe("duplicate");
  });

  it("links the customer on checkout completion", async () => {
    const userId = await newUser();
    await handleStripeEvent(db, event("evt_checkout", "checkout.session.completed", { client_reference_id: userId, customer: "cus_h" }));
    const [row] = await db.select().from(billingAccount).where(eq(billingAccount.userId, userId));
    expect(row.stripeCustomerId).toBe("cus_h");
  });

  it("rolls back the event record when processing fails, so Stripe's retry is handled", async () => {
    const userId = await newUser();
    await linkCustomer(db, userId, "cus_x");
    // A malformed subscription (no items) makes processing throw after the event id was recorded.
    const broken = event("evt_broken", "customer.subscription.updated", { customer: "cus_x", items: null, metadata: {} });
    await expect(handleStripeEvent(db, broken)).rejects.toThrow();
    const rows = await db.select().from(stripeEvent).where(eq(stripeEvent.id, "evt_broken"));
    expect(rows).toHaveLength(0);
  });
});

describe("account deletion", () => {
  it("cancels a live subscription first", async () => {
    const userId = await newUser();
    await linkCustomer(db, userId, "cus_del");
    await applySubscription(db, subscription({ id: "sub_del", customer: "cus_del" }), new Date(1_000));
    const cancel = vi.fn().mockResolvedValue({});
    await cancelSubscriptionForDeletedUser(db, userId, cancel);
    expect(cancel).toHaveBeenCalledWith("sub_del");
  });

  it("does nothing without a billable subscription", async () => {
    const userId = await newUser();
    const cancel = vi.fn();
    await cancelSubscriptionForDeletedUser(db, userId, cancel);
    await linkCustomer(db, userId, "cus_gone");
    await applySubscription(db, subscription({ customer: "cus_gone", status: "canceled" }), new Date(1_000));
    await cancelSubscriptionForDeletedUser(db, userId, cancel);
    expect(cancel).not.toHaveBeenCalled();
  });

  it("blocks deletion when Stripe can't cancel", async () => {
    const userId = await newUser();
    await linkCustomer(db, userId, "cus_err");
    await applySubscription(db, subscription({ id: "sub_err", customer: "cus_err" }), new Date(1_000));
    await expect(
      cancelSubscriptionForDeletedUser(db, userId, () => Promise.reject(new Error("Stripe is down"))),
    ).rejects.toThrow("Stripe is down");
  });
});
