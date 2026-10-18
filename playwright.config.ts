import { defineConfig, devices } from "@playwright/test";

import { MAILBOX_FILE } from "./e2e/mailbox";
import { STRIPE_WEBHOOK_SECRET } from "./e2e/stripe";

const PORT = 3100;
const CI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  // In CI: fail on a stray test.only, retry once (retried tests are still reported as flaky), keep a report.
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  reporter: CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "tablet", use: { ...devices["Desktop Chrome"], viewport: { width: 820, height: 1180 }, hasTouch: true } },
  ],
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !CI,
    timeout: 180_000,
    // Tests must never call the paid API, even if .env.local enables live generation.
    env: {
      // Its own build folder, so running the tests can't disturb a dev server running at the same time.
      NEXT_DIST_DIR: ".next-e2e",
      GENERATION_MODE: "sample",
      ANTHROPIC_API_KEY: "",
      // A throwaway database and a file mailbox the tests read sign-in links from. DATABASE_URL is blanked so
      // a real database configured in .env.local is never touched.
      DATABASE_URL: "",
      PGLITE_DIR: "memory://",
      EMAIL_TRANSPORT: "file",
      MAILBOX_FILE: MAILBOX_FILE,
      BETTER_AUTH_SECRET: "e2e-only-secret-not-for-production-0123456789",
      BETTER_AUTH_URL: `http://localhost:${PORT}`,
      DISABLE_AUTH_RATE_LIMIT: "true",
      // One operator per project, so parallel projects don't read each other's sign-in links.
      ADMIN_EMAILS: "operator-desktop@example.com,operator-tablet@example.com",
      DEMO_SIGN_IN: "true",
      DEMO_ACCESS_CODES: "e2e-demo-code",
      // Billing switched on with test values. Tests never reach Stripe's API; they deliver signed webhooks.
      STRIPE_SECRET_KEY: "sk_test_e2e_dummy",
      STRIPE_WEBHOOK_SECRET: STRIPE_WEBHOOK_SECRET,
      STRIPE_PRICE_PRO_MONTHLY: "price_e2e_pro_month",
      STRIPE_PRICE_PRO_YEARLY: "price_e2e_pro_year",
    },
  },
});
