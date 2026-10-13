import { getBillingAccount } from "@/lib/server/billing/account";
import { appUrl, billingConfig, getStripe } from "@/lib/server/billing/stripe";
import { getDb } from "@/lib/server/db";
import { jsonError, requestT, requireUser } from "@/lib/server/http";
import { localeFromRequest } from "@/lib/i18n/server";

/** Opens Stripe's billing portal, where customers change plan, update cards, see invoices or cancel. */
export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;
  const t = requestT(request);
  const config = billingConfig();
  if (!config.enabled) return jsonError(503, t.server.billingDisabled, "billing_disabled");

  const account = await getBillingAccount(await getDb(), auth.user.id);
  if (!account) return jsonError(404, t.server.noBillingHistory);

  const session = await getStripe(config).billingPortal.sessions.create({
    customer: account.stripeCustomerId,
    return_url: `${appUrl(request)}/account`,
    locale: localeFromRequest(request) === "bg" ? "bg" : "en",
  });
  return Response.json({ url: session.url });
}
