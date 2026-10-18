import { eq } from "drizzle-orm";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { type Database, getDb } from "./db";
import { appError } from "./db/schema";
import { listErrors, pruneErrors, reportError, resetAlertsForTests } from "./errors";

let db: Database;

beforeAll(async () => {
  db = await getDb();
});

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  resetAlertsForTests();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("reportError", () => {
  it("saves the error with where it happened, newest first", async () => {
    await reportError({ source: "request", error: new Error("first failure"), path: "/create", method: "GET" }, db);
    await reportError({ source: "generation", error: "second failure", digest: "123" }, db);
    const [latest, earlier] = await listErrors(db, 2);
    expect(latest).toMatchObject({ source: "generation", message: "second failure", digest: "123", stack: null });
    expect(earlier).toMatchObject({ source: "request", message: "first failure", path: "/create", method: "GET" });
    expect(earlier.stack).toContain("first failure");
  });

  it("keeps reports for 30 days", async () => {
    const [old] = await db
      .insert(appError)
      .values({ source: "request", message: "old", createdAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000) })
      .returning({ id: appError.id });
    await pruneErrors(db);
    expect(await db.select().from(appError).where(eq(appError.id, old.id))).toEqual([]);
  });

  it("posts a Slack- and Discord-compatible alert when a webhook is set, at most ten an hour", async () => {
    vi.stubEnv("ERROR_ALERT_WEBHOOK_URL", "https://hooks.example.com/alert");
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await reportError({ source: "auth", error: new Error("Resend refused the email"), path: "/api/auth/sign-in/magic-link", method: "POST" }, db);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://hooks.example.com/alert");
    const body = JSON.parse(init.body as string);
    expect(body.text).toBe("Lesson Builder error (auth POST /api/auth/sign-in/magic-link): Resend refused the email");
    expect(body.content).toBe(body.text);

    for (let i = 0; i < 15; i++) await reportError({ source: "request", error: new Error(`burst ${i}`) }, db);
    expect(fetchMock).toHaveBeenCalledTimes(10);
  });

  it("never throws, even when saving and alerting both fail", async () => {
    vi.stubEnv("ERROR_ALERT_WEBHOOK_URL", "https://hooks.example.com/alert");
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network down"); }));
    const broken = { insert: () => { throw new Error("database down"); } } as unknown as Database;
    await expect(reportError({ source: "request", error: new Error("boom") }, broken)).resolves.toBeUndefined();
  });
});
