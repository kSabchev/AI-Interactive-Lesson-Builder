import "server-only";
import Stripe from "stripe";
import type { BillingInterval, PlanId } from "@/lib/billing/plans";

export type BillingConfig = {
  enabled: boolean;
  secretKey: string | undefined;
  webhookSecret: string | undefined;
  /** Stripe price ids for Pro, by billing interval. */
  proPrices: Partial<Record<BillingInterval, string>>;
  /** Let Stripe Tax calculate VAT and sales tax at checkout (needs Stripe Tax set up in the dashboard). */
  automaticTax: boolean;
};

/** Read per request so a deployment's environment applies without rebuilding. Billing stays off until configured. */
export function billingConfig(env: NodeJS.ProcessEnv = process.env): BillingConfig {
  const proPrices: BillingConfig["proPrices"] = {};
  if (env.STRIPE_PRICE_PRO_MONTHLY) proPrices.month = env.STRIPE_PRICE_PRO_MONTHLY;
  if (env.STRIPE_PRICE_PRO_YEARLY) proPrices.year = env.STRIPE_PRICE_PRO_YEARLY;
  const secretKey = env.STRIPE_SECRET_KEY || undefined;
  return {
    enabled: Boolean(secretKey && (proPrices.month || proPrices.year)),
    secretKey,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET || undefined,
    proPrices,
    automaticTax: env.STRIPE_AUTOMATIC_TAX === "true",
  };
}

export function planForPrice(priceId: string | undefined, config = billingConfig()): PlanId | undefined {
  if (!priceId) return undefined;
  return Object.values(config.proPrices).includes(priceId) ? "pro" : undefined;
}

let client: Stripe | undefined;

/** Created on first use, so builds and pages that don't touch billing never need a key. */
export function getStripe(config = billingConfig()): Stripe {
  if (!config.secretKey) throw new Error("STRIPE_SECRET_KEY is not set");
  client ??= new Stripe(config.secretKey);
  return client;
}

/** The public base URL for redirects back from Stripe. */
export function appUrl(request: Request): string {
  return process.env.BETTER_AUTH_URL || new URL(request.url).origin;
}
