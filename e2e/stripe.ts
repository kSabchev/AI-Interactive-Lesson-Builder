import type { APIRequestContext, Page } from "@playwright/test";
import Stripe from "stripe";

/** Shared with the test server's environment (see playwright.config.ts). */
export const STRIPE_WEBHOOK_SECRET = "whsec_e2e_only_secret";

const stripe = new Stripe("sk_test_e2e_dummy");

/** Sends the webhook Stripe would send after a successful Pro checkout, signed like the real thing. */
export async function deliverSubscriptionWebhook(
  request: APIRequestContext,
  userId: string,
  status: "active" | "canceled" = "active",
) {
  const payload = JSON.stringify({
    id: `evt_e2e_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    object: "event",
    type: status === "active" ? "customer.subscription.created" : "customer.subscription.deleted",
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: `sub_e2e_${userId}`,
        object: "subscription",
        customer: `cus_e2e_${userId}`,
        status,
        cancel_at_period_end: false,
        cancel_at: null,
        metadata: { userId },
        items: {
          data: [{ price: { id: "price_e2e_pro_month" }, current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400 }],
        },
      },
    },
  });
  const signature = await stripe.webhooks.generateTestHeaderStringAsync({ payload, secret: STRIPE_WEBHOOK_SECRET });
  const response = await request.post("/api/billing/webhook", {
    headers: { "stripe-signature": signature, "content-type": "application/json" },
    data: payload,
  });
  if (!response.ok()) throw new Error(`webhook failed: ${response.status()} ${await response.text()}`);
}

export async function currentUserId(page: Page): Promise<string> {
  const response = await page.request.get("/api/auth/get-session");
  const body = (await response.json()) as { user: { id: string } };
  return body.user.id;
}
