import { getBillingAccount } from "@/lib/server/billing/account";
import { appUrl, billingConfig, getStripe } from "@/lib/server/billing/stripe";
import { getDb } from "@/lib/server/db";
import { jsonError, requireUser } from "@/lib/server/http";

/** Opens Stripe's billing portal, where customers change plan, update cards, see invoices or cancel. */
export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;
  const config = billingConfig();
  if (!config.enabled) return jsonError(503, "Billing isn't available yet.", "billing_disabled");

  const account = await getBillingAccount(await getDb(), auth.user.id);
  if (!account) return jsonError(404, "There's no billing history for this account yet.");

  const session = await getStripe(config).billingPortal.sessions.create({
    customer: account.stripeCustomerId,
    return_url: `${appUrl(request)}/account`,
  });
  return Response.json({ url: session.url });
}
