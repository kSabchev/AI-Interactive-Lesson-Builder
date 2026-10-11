import type { Plan } from "./plans";

/** What the interface shows about the caller's plan and usage (from GET /api/billing/status). */
export type BillingStatus = {
  signedIn: boolean;
  billingEnabled: boolean;
  plan: Plan;
  used: number;
  remaining: number;
  resetsAt: string;
  savedLessons: number;
  hasBillingAccount?: boolean;
  subscription: { status: string; currentPeriodEnd: string | null; cancelAtPeriodEnd: boolean } | null;
};
