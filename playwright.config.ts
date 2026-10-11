import { defineConfig, devices } from "@playwright/test";

import { MAILBOX_FILE } from "./e2e/mailbox";

const PORT = 3100;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
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
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    // Tests must never call the paid API, even if .env.local enables live generation.
    env: {
      GENERATION_MODE: "sample",
      ANTHROPIC_API_KEY: "",
      // A throwaway database and a file mailbox the tests read sign-in links from.
      PGLITE_DIR: "memory://",
      EMAIL_TRANSPORT: "file",
      MAILBOX_FILE: MAILBOX_FILE,
      BETTER_AUTH_SECRET: "e2e-only-secret-not-for-production-0123456789",
      BETTER_AUTH_URL: `http://localhost:${PORT}`,
      DISABLE_AUTH_RATE_LIMIT: "true",
    },
  },
});
