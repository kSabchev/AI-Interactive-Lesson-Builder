/**
 * Subscription plans: what each tier allows. The server enforces these limits; the interface only displays
 * them. Prices are shown for information and must match the Stripe prices configured for checkout.
 */

export type PlanId = "free" | "pro" | "classroom";
export type BillingInterval = "month" | "year";
export type GenerationQuality = "standard" | "high";

export type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  /** Display prices in USD; Stripe is the source of truth for what is charged. */
  prices: Partial<Record<BillingInterval, number>>;
  /** Live AI generations per calendar month (UTC). */
  generationsPerMonth: number;
  /** Lessons saved to the account; `null` means unlimited. */
  savedLessons: number | null;
  /** Base lessons on pasted reference material. */
  referenceText: boolean;
  /** "High quality" generation with the larger model, counted as `HIGH_QUALITY_COST` generations. */
  highQuality: boolean;
  /** Whether it can be bought yet. */
  available: boolean;
};

export const HIGH_QUALITY_COST = 2;

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    tagline: "Try AI lessons at home",
    prices: { month: 0 },
    generationsPerMonth: 3,
    savedLessons: 10,
    referenceText: false,
    highQuality: false,
    available: true,
  },
  pro: {
    id: "pro",
    name: "Pro",
    tagline: "For parents and teachers who teach every week",
    prices: { month: 9, year: 90 },
    generationsPerMonth: 30,
    savedLessons: null,
    referenceText: true,
    highQuality: true,
    available: true,
  },
  classroom: {
    id: "classroom",
    name: "Classroom",
    tagline: "Shared library and seats for a school",
    prices: { month: 6 },
    generationsPerMonth: 50,
    savedLessons: null,
    referenceText: true,
    highQuality: true,
    available: false,
  },
};

export function generationCost(quality: GenerationQuality): number {
  return quality === "high" ? HIGH_QUALITY_COST : 1;
}

/** The quota period a moment falls in, e.g. "2026-10". Quotas reset at the start of each UTC month. */
export function quotaPeriod(now: Date = new Date()): string {
  return now.toISOString().slice(0, 7);
}

export function nextQuotaReset(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}
