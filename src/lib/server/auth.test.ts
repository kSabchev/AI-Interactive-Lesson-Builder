import { rm } from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAuth } from "./auth";
import { readDevMailbox } from "./email";

const FILE = ".data/auth-test-mailbox.jsonl";

/** getAuth() keeps one instance per process; drop it so each test reads the environment it sets. */
function forgetAuth() {
  (globalThis as { lessonBuilderAuth?: unknown }).lessonBuilderAuth = undefined;
}

beforeEach(async () => {
  vi.stubEnv("MAILBOX_FILE", FILE);
  vi.stubEnv("EMAIL_TRANSPORT", "");
  vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000");
  vi.spyOn(console, "info").mockImplementation(() => {});
  await rm(FILE, { force: true });
  forgetAuth();
});

afterEach(() => {
  vi.unstubAllEnvs();
  forgetAuth();
});

describe("local sign-in without BETTER_AUTH_SECRET", () => {
  it("still sends the magic link to the development mailbox, and the link signs the person in", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("BETTER_AUTH_SECRET", "");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const auth = await getAuth();

    await auth.api.signInMagicLink({ body: { email: "parent@example.com", callbackURL: "/" }, headers: new Headers() });
    const [email] = await readDevMailbox();
    expect(email.to).toBe("parent@example.com");

    const token = new URL(email.url!).searchParams.get("token")!;
    const result = await auth.api.magicLinkVerify({ query: { token }, headers: new Headers() });
    expect(result).toMatchObject({ user: { email: "parent@example.com" } });
  });
});
