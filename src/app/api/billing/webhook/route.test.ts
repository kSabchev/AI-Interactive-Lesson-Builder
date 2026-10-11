import Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getEntitlements, linkCustomer } from "@/lib/server/billing/account";
import { getDb } from "@/lib/server/db";
import { user } from "@/lib/server/db/schema";
import { POST } from "./route";

const SECRET = "whsec_test_secret";
const stripe = new Stripe("sk_test_dummy");

function subscriptionEvent(id: string, customer: string) {
  return JSON.stringify({
    id,
    object: "event",
    type: "customer.subscription.updated",
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: "sub_webhook",
        object: "subscription",
        customer,
        status: "active",
        cancel_at_period_end: false,
        cancel_at: null,
        metadata: {},
        items: { data: [{ price: { id: "price_pro_month" }, current_period_end: 1_800_000_000 }] },
      },
    },
  });
}

async function deliver(payload: string, secret = SECRET) {
  const signature = await stripe.webhooks.generateTestHeaderStringAsync({ payload, secret });
  return POST(
    new Request("http://localhost/api/billing/webhook", {
      method: "POST",
      headers: { "stripe-signature": signature },
      body: payload,
    }),
  );
}

beforeEach(() => {
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_dummy");
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", SECRET);
  vi.stubEnv("STRIPE_PRICE_PRO_MONTHLY", "price_pro_month");
});

describe("POST /api/billing/webhook", () => {
  it("applies a correctly signed event once and ignores redelivery", async () => {
    const db = await getDb();
    await db.insert(user).values({ id: "webhook-user", name: "w", email: "webhook@example.com" });
    await linkCustomer(db, "webhook-user", "cus_webhook");

    const payload = subscriptionEvent("evt_webhook_1", "cus_webhook");
    const first = await deliver(payload);
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ received: true, result: "applied" });
    expect((await getEntitlements(db, "webhook-user")).plan.id).toBe("pro");

    const again = await deliver(payload);
    expect(await again.json()).toEqual({ received: true, result: "duplicate" });
  });

  it("rejects events signed with the wrong secret", async () => {
    const response = await deliver(subscriptionEvent("evt_forged", "cus_webhook"), "whsec_attacker");
    expect(response.status).toBe(400);
  });

  it("rejects requests without a signature", async () => {
    const response = await POST(new Request("http://localhost/api/billing/webhook", { method: "POST", body: "{}" }));
    expect(response.status).toBe(400);
  });

  it("is unavailable until billing is configured", async () => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "");
    const response = await deliver(subscriptionEvent("evt_unconfigured", "cus_webhook"));
    expect(response.status).toBe(503);
  });
});
