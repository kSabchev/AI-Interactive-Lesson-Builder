import { rm } from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { waterCycleLesson } from "@/content/samples/water-cycle";
import { getAuth } from "./auth";
import { DEMO_CODE_HEADER } from "./demo";
import { readDevMailbox } from "./email";
import { getDb } from "./db";
import { listLessons, saveLesson } from "./lessons";

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

/** The session cookie a response sets, as a request header for the next call. */
function cookieFrom(headers: Headers): Headers {
  const cookie = headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
  return new Headers({ cookie });
}

describe("demo sign-in", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("BETTER_AUTH_SECRET", "");
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("doesn't exist unless DEMO_SIGN_IN is on", async () => {
    vi.stubEnv("DEMO_SIGN_IN", "");
    const auth = await getAuth();
    await expect(auth.api.signInAnonymous({ headers: new Headers() })).rejects.toMatchObject({ statusCode: 404 });
  });

  it("needs one of the access codes when codes are set, and creates a demo account with one", async () => {
    vi.stubEnv("DEMO_SIGN_IN", "true");
    vi.stubEnv("DEMO_ACCESS_CODES", "spring-class,ana-2026");
    const auth = await getAuth();

    await expect(auth.api.signInAnonymous({ headers: new Headers() })).rejects.toMatchObject({ statusCode: 403 });
    await expect(
      auth.api.signInAnonymous({ headers: new Headers({ [DEMO_CODE_HEADER]: "guess" }) }),
    ).rejects.toMatchObject({ statusCode: 403 });

    const result = await auth.api.signInAnonymous({ headers: new Headers({ [DEMO_CODE_HEADER]: "Ana-2026" }) });
    expect(result?.user).toMatchObject({ name: "Demo account", isAnonymous: true });
    expect(result?.user.email).toMatch(/@demo\.lesson-builder\.invalid$/);
  });

  it("is open to anyone when no codes are set", async () => {
    vi.stubEnv("DEMO_SIGN_IN", "true");
    vi.stubEnv("DEMO_ACCESS_CODES", "");
    const auth = await getAuth();
    const result = await auth.api.signInAnonymous({ headers: new Headers() });
    expect(result?.user.isAnonymous).toBe(true);
  });

  it("moves the demo account's lessons to the real account its owner then signs in with", async () => {
    vi.stubEnv("DEMO_SIGN_IN", "true");
    vi.stubEnv("DEMO_ACCESS_CODES", "");
    const auth = await getAuth();
    const db = await getDb();

    const demo = await auth.api.signInAnonymous({ headers: new Headers(), returnHeaders: true });
    const demoCookie = cookieFrom(demo.headers);
    const demoUserId = demo.response!.user.id;
    await saveLesson(db, demoUserId, { ...structuredClone(waterCycleLesson), id: "lesson-made-in-demo" });

    await auth.api.signInMagicLink({ body: { email: "teacher@example.com", callbackURL: "/" }, headers: demoCookie });
    const [email] = await readDevMailbox();
    const token = new URL(email.url!).searchParams.get("token")!;
    const signedIn = await auth.api.magicLinkVerify({ query: { token }, headers: demoCookie });

    const realUserId = (signedIn as { user: { id: string } }).user.id;
    expect(realUserId).not.toBe(demoUserId);
    expect((await listLessons(db, realUserId)).map((l) => l.id)).toContain("lesson-made-in-demo");
    expect(await listLessons(db, demoUserId)).toEqual([]);
  });
});
