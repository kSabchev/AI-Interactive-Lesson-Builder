import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

export { DEMO_CODE_HEADER } from "@/lib/auth/demo";

/** Demo accounts get a placeholder address on a reserved domain, so it can never belong to a real person. */
export const DEMO_EMAIL_DOMAIN = "demo.lesson-builder.invalid";

export type DemoSignInConfig = { enabled: boolean; codes: string[] };

/**
 * Demo sign-in creates a throwaway account with no email, for showing the app to people without accounts.
 * Off unless `DEMO_SIGN_IN=true`. With `DEMO_ACCESS_CODES` (comma-separated) set, a visitor needs one of the
 * codes; give different people different codes so one can be withdrawn without affecting the others.
 */
export function demoSignInConfig(env: NodeJS.ProcessEnv = process.env): DemoSignInConfig {
  const codes = (env.DEMO_ACCESS_CODES ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  return { enabled: env.DEMO_SIGN_IN === "true", codes };
}

const digest = (value: string) => createHash("sha256").update(value.trim().toLowerCase()).digest();

/** Whether `code` matches one of `codes`, ignoring case and surrounding spaces, in constant time per code. */
export function isDemoCodeValid(code: string | null | undefined, codes: string[]): boolean {
  if (!code?.trim()) return false;
  const given = digest(code);
  let valid = false;
  for (const candidate of codes) valid = timingSafeEqual(given, digest(candidate)) || valid;
  return valid;
}
