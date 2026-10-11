import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GenerationEvent } from "@/lib/generation/events";
import { GenerationError } from "@/lib/generation/events";
import { resetLimitsForTests } from "@/lib/generation/server/limits";
import { lessonSchema } from "@/lib/lesson/schema";

const send = vi.fn();
vi.mock("@/lib/generation/server/claude", () => ({ createClaudeClient: () => ({ send }) }));

let sessionUser: { id: string; email: string; name: string } | null = null;
vi.mock("@/lib/server/auth", () => ({ getSessionUser: async () => sessionUser }));

const { POST } = await import("./route");
const { getDb } = await import("@/lib/server/db");
const { billingAccount, user } = await import("@/lib/server/db/schema");

let userCount = 0;
/** Signs the test in as a fresh user (with a clean quota), optionally on Pro. */
async function signInAs(plan: "free" | "pro" = "free") {
  const id = `gen-user-${++userCount}`;
  const db = await getDb();
  await db.insert(user).values({ id, name: id, email: `${id}@example.com` });
  if (plan === "pro") {
    await db
      .insert(billingAccount)
      .values({ userId: id, stripeCustomerId: `cus_${id}`, plan: "pro", status: "active" });
  }
  sessionUser = { id, email: `${id}@example.com`, name: id };
  return id;
}

function post(body: unknown, headers: Record<string, string> = {}) {
  return POST(
    new Request("http://localhost/api/lessons/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "203.0.113.7", ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

async function events(response: Response): Promise<GenerationEvent[]> {
  const text = await response.text();
  return text
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as GenerationEvent);
}

const valid = { topic: "Why it rains", ageGroup: "8-10", durationMinutes: 10 };

beforeEach(() => {
  resetLimitsForTests();
  send.mockReset();
  sessionUser = null;
  vi.stubEnv("ANTHROPIC_API_KEY", "");
  vi.stubEnv("GENERATION_MODE", "");
});

afterEach(() => vi.unstubAllEnvs());

describe("POST /api/lessons/generate", () => {
  it("rejects invalid input before streaming", async () => {
    const response = await post({ ...valid, topic: "x" });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: { code: "invalid_input", message: "Enter a topic of at least 3 characters." },
    });
  });

  it("rejects oversized requests", async () => {
    const response = await post({ ...valid, referenceText: "a".repeat(70_000) });
    expect(response.status).toBe(413);
  });

  it("rejects bodies that aren't JSON", async () => {
    expect((await post("not json")).status).toBe(400);
  });

  it("serves a labelled sample copy without calling the AI when live mode is off", async () => {
    const response = await post(valid);
    expect(response.headers.get("content-type")).toContain("application/x-ndjson");
    const stream = await events(response);

    expect(stream[0]).toEqual({ type: "start", mode: "sample" });
    const done = stream.at(-1);
    if (done?.type !== "done") throw new Error("expected a done event");
    expect(lessonSchema.safeParse(done.lesson).success).toBe(true);
    expect(done.lesson.id).toMatch(/^lesson-/);
    expect(done.lesson.contentOrigin).toBe("curated");
    expect(done.lesson.title).toMatch(/Water Cycle/);
    expect(done.notice).toContain("Sample mode");
    expect(send).not.toHaveBeenCalled();
  });

  it("falls back to sample mode when live mode is requested without a key", async () => {
    vi.stubEnv("GENERATION_MODE", "live");
    const stream = await events(await post(valid));
    expect(stream[0]).toEqual({ type: "start", mode: "sample" });
  });

  describe("live mode", () => {
    beforeEach(async () => {
      vi.stubEnv("GENERATION_MODE", "live");
      vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
      vi.stubEnv("GENERATION_HOURLY_LIMIT", "2");
      await signInAs("free");
    });

    it("asks guests to sign in", async () => {
      sessionUser = null;
      const response = await post(valid);
      expect(response.status).toBe(401);
      expect((await response.json()).error.code).toBe("sign_in_required");
    });

    it("keeps reference text and high quality for paid plans", async () => {
      const withReference = await post({ ...valid, referenceText: "Rain falls from clouds." });
      expect(withReference.status).toBe(403);
      expect((await withReference.json()).error.code).toBe("upgrade_required");
      const high = await post({ ...valid, quality: "high" });
      expect(high.status).toBe(403);
      expect(send).not.toHaveBeenCalled();
    });

    it("refuses to generate when the library is full, before spending anything", async () => {
      const db = await getDb();
      const { lesson } = await import("@/lib/server/db/schema");
      const { getSampleLesson } = await import("@/content/samples");
      const sample = getSampleLesson("sample-water-cycle")!;
      const owner = sessionUser!.id;
      for (let i = 0; i < 10; i++) {
        const id = `full-${i}`;
        await db.insert(lesson).values({
          userId: owner,
          id,
          title: "t",
          topic: "t",
          ageGroup: "8-10",
          durationMinutes: 10,
          contentOrigin: "curated",
          data: { ...sample, id },
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      const response = await post(valid);
      expect(response.status).toBe(403);
      expect((await response.json()).error.message).toContain("library is full");
      expect(send).not.toHaveBeenCalled();
    });

    it("keeps web research for Pro", async () => {
      const response = await post({ ...valid, research: true });
      expect(response.status).toBe(403);
      expect((await response.json()).error.message).toContain("Web-researched lessons");
    });

    it("allows Pro features once subscribed", async () => {
      await signInAs("pro");
      send.mockRejectedValueOnce(new GenerationError("refused", "No."));
      const response = await post({ ...valid, quality: "high", referenceText: "Rain falls from clouds." });
      expect(response.status).toBe(200);
      await response.text();
    });

    it("stops at the monthly quota and refunds service failures but not refusals", async () => {
      vi.stubEnv("GENERATION_HOURLY_LIMIT", "50");
      // Service failures are refunded, so they don't use up the 3 free lessons...
      send.mockRejectedValue(new GenerationError("busy", "busy"));
      for (let i = 0; i < 4; i++) await (await post(valid)).text();
      // ...but refusals count.
      send.mockRejectedValue(new GenerationError("refused", "No."));
      for (let i = 0; i < 3; i++) expect((await post(valid)).status).toBe(200);
      const over = await post(valid);
      expect(over.status).toBe(429);
      const body = await over.json();
      expect(body.error.code).toBe("quota_exceeded");
      expect(body.error.message).toContain("used all 3 AI lessons");
    });

    it("streams model errors as a classified error event", async () => {
      send.mockRejectedValueOnce(new GenerationError("busy", "The AI service is busy right now."));
      const stream = await events(await post(valid));
      expect(stream[0]).toEqual({ type: "start", mode: "live" });
      expect(stream).toContainEqual({ type: "stage", stage: "outline", status: "start" });
      expect(stream.at(-1)).toEqual({ type: "error", code: "busy", message: "The AI service is busy right now." });
    });

    it("records one usage row per request, including failures", async () => {
      const { getDb } = await import("@/lib/server/db");
      const { generationUsage } = await import("@/lib/server/db/schema");
      const db = await getDb();
      const before = (await db.select().from(generationUsage)).length;

      send.mockRejectedValueOnce(new GenerationError("busy", "busy"));
      await (await post(valid)).text();

      const rows = await db.select().from(generationUsage);
      expect(rows).toHaveLength(before + 1);
      expect(rows.at(-1)).toMatchObject({ mode: "live", status: "busy", userId: sessionUser!.id });
    });

    it("never leaks unexpected error details to the client", async () => {
      send.mockRejectedValueOnce(new Error("secret internal detail"));
      vi.spyOn(console, "error").mockImplementation(() => {});
      const stream = await events(await post(valid));
      const last = stream.at(-1);
      expect(last).toMatchObject({ type: "error", code: "unavailable" });
      expect(JSON.stringify(last)).not.toContain("secret");
    });

    it("limits live generations per visitor", async () => {
      send.mockRejectedValue(new GenerationError("busy", "busy"));
      await (await post(valid)).text();
      await (await post(valid)).text();
      const third = await post(valid);
      expect(third.status).toBe(429);
      expect(Number(third.headers.get("retry-after"))).toBeGreaterThan(0);
      expect((await third.json()).error.code).toBe("rate_limited");

      // Another visitor is unaffected.
      await signInAs("free");
      const other = await post(valid, { "x-forwarded-for": "198.51.100.1" });
      expect(other.status).toBe(200);
      await other.text();
    });

    it("enforces the daily cap across visitors", async () => {
      vi.stubEnv("GENERATION_DAILY_CAP", "1");
      send.mockRejectedValue(new GenerationError("busy", "busy"));
      await (await post(valid)).text();
      await signInAs("free");
      const response = await post(valid, { "x-forwarded-for": "198.51.100.2" });
      expect(response.status).toBe(429);
    });
  });
});
