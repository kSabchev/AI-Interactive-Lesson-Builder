import { handleStripeEvent } from "@/lib/server/billing/account";
import { billingConfig, getStripe } from "@/lib/server/billing/stripe";
import { getDb } from "@/lib/server/db";

/**
 * Stripe webhook. Verifies the signature against the raw body, then applies the event once.
 * A 500 makes Stripe retry later; a 400 tells it the request was not genuine.
 */
export async function POST(request: Request) {
  const config = billingConfig();
  if (!config.secretKey || !config.webhookSecret) return new Response("Billing is not configured.", { status: 503 });

  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature.", { status: 400 });
  const payload = await request.text();

  let event;
  try {
    event = await getStripe(config).webhooks.constructEventAsync(payload, signature, config.webhookSecret);
  } catch {
    return new Response("Invalid signature.", { status: 400 });
  }

  try {
    const result = await handleStripeEvent(await getDb(), event);
    return Response.json({ received: true, result });
  } catch (error) {
    console.error(`[billing] failed to process ${event.type} ${event.id}:`, error);
    return new Response("Processing failed.", { status: 500 });
  }
}
