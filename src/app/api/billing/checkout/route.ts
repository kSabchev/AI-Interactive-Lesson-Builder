import { z } from "zod";
import { getBillingAccount, getEntitlements, linkCustomer } from "@/lib/server/billing/account";
import { appUrl, billingConfig, getStripe } from "@/lib/server/billing/stripe";
import { getDb } from "@/lib/server/db";
import { jsonError, readJson, requireUser } from "@/lib/server/http";

const bodySchema = z.object({ interval: z.enum(["month", "year"]) });

/** Starts a Stripe Checkout session for Pro and returns its URL. */
export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;
  const config = billingConfig();
  if (!config.enabled) return jsonError(503, "Subscriptions aren't available yet.", "billing_disabled");

  const read = await readJson(request, 1_000);
  if ("error" in read) return read.error;
  const parsed = bodySchema.safeParse(read.body);
  if (!parsed.success) return jsonError(400, "Choose monthly or yearly billing.");
  const price = config.proPrices[parsed.data.interval];
  if (!price) return jsonError(400, "That billing interval isn't offered.");

  const db = await getDb();
  const { plan } = await getEntitlements(db, auth.user.id);
  if (plan.id !== "free") {
    return jsonError(409, "You already have a subscription. Use Manage billing to change it.", "already_subscribed");
  }

  const stripe = getStripe(config);
  let account = await getBillingAccount(db, auth.user.id);
  if (!account) {
    const customer = await stripe.customers.create({ email: auth.user.email, metadata: { userId: auth.user.id } });
    account = await linkCustomer(db, auth.user.id, customer.id);
  }

  const base = appUrl(request);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: account.stripeCustomerId,
    client_reference_id: auth.user.id,
    line_items: [{ price, quantity: 1 }],
    subscription_data: { metadata: { userId: auth.user.id } },
    allow_promotion_codes: true,
    success_url: `${base}/account?checkout=success`,
    cancel_url: `${base}/pricing?checkout=cancelled`,
    ...(config.automaticTax ? { automatic_tax: { enabled: true }, customer_update: { address: "auto" as const } } : {}),
  });
  if (!session.url) return jsonError(502, "Stripe didn't return a checkout page. Please try again.");
  return Response.json({ url: session.url });
}
