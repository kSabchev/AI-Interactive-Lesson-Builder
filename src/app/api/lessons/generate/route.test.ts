import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GenerationEvent } from "@/lib/generation/events";
import { GenerationError } from "@/lib/generation/events";
import { resetLimitsForTests } from "@/lib/generation/server/limits";
import { lessonSchema } from "@/lib/lesson/schema";

const send = vi.fn();
vi.mock("@/lib/generation/server/claude", () => ({ createClaudeClient: () => ({ send }) }));

const { POST } = await import("./route");

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
    beforeEach(() => {
      vi.stubEnv("GENERATION_MODE", "live");
      vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
      vi.stubEnv("GENERATION_HOURLY_LIMIT", "2");
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
      expect(rows.at(-1)).toMatchObject({ mode: "live", status: "busy", userId: null });
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
      const other = await post(valid, { "x-forwarded-for": "198.51.100.1" });
      expect(other.status).toBe(200);
      await other.text();
    });

    it("enforces the daily cap across visitors", async () => {
      vi.stubEnv("GENERATION_DAILY_CAP", "1");
      send.mockRejectedValue(new GenerationError("busy", "busy"));
      await (await post(valid)).text();
      const response = await post(valid, { "x-forwarded-for": "198.51.100.2" });
      expect(response.status).toBe(429);
    });
  });
});
