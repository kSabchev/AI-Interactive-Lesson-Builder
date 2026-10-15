import { beforeAll, describe, expect, it } from "vitest";
import type { UsageReport } from "@/lib/generation/server/claude";
import { type Database, getDb } from "./db";
import { user } from "./db/schema";
import { countLiveGenerationsSince, getGeneration, listGenerations, saveGenerationLog } from "./generationLog";

let db: Database;

beforeAll(async () => {
  db = await getDb();
  await db.insert(user).values({ id: "log-user", name: "Log user", email: "log@example.com" });
});

const call = (stage: string, overrides: Partial<UsageReport> = {}): UsageReport => ({
  stage,
  model: "claude-sonnet-5-5",
  inputTokens: 1000,
  outputTokens: 500,
  cacheReadTokens: 0,
  cacheWriteTokens: 0,
  webSearches: 0,
  estimatedUsd: 0.007,
  durationMs: 1200,
  ...overrides,
});

describe("generation log", () => {
  it("stores a request with its calls in order, numbering repairs per stage and totalling the calls", async () => {
    await saveGenerationLog(db, {
      userId: "log-user",
      mode: "live",
      status: "succeeded",
      lessonId: "lesson-log-1",
      lessonTitle: "Magnets",
      topic: "How magnets work",
      ageGroup: "8-10",
      language: "en",
      quality: "standard",
      evidence: "web",
      durationMs: 42_000,
      calls: [
        call("research", { webSearches: 3, estimatedUsd: 0.05 }),
        call("outline"),
        call("content", { outputTokens: 4000 }),
        call("content", { cacheReadTokens: 900 }),
        call("quiz"),
      ],
    });

    const [latest] = await listGenerations(db, 1);
    expect(latest).toMatchObject({
      lessonTitle: "Magnets",
      email: "log@example.com",
      inputTokens: 5000,
      outputTokens: 6000,
      cacheReadTokens: 900,
      webSearches: 3,
      estimatedUsd: "0.0780",
    });

    const detail = await getGeneration(db, latest.id);
    expect(detail?.calls.map((c) => [c.stage, c.attempt])).toEqual([
      ["research", 1],
      ["outline", 1],
      ["content", 1],
      ["content", 2],
      ["quiz", 1],
    ]);
  });

  it("logs guests and requests that made no model calls", async () => {
    await saveGenerationLog(db, {
      userId: null,
      mode: "sample",
      status: "succeeded",
      lessonId: "lesson-log-2",
      lessonTitle: "The Water Cycle",
      topic: "rain",
      ageGroup: "8-10",
      language: "en",
      quality: "standard",
      evidence: "none",
      durationMs: 5,
      calls: [],
    });
    const [latest] = await listGenerations(db, 1);
    expect(latest).toMatchObject({ email: null, inputTokens: 0, estimatedUsd: "0.0000" });
    expect((await getGeneration(db, latest.id))?.calls).toEqual([]);
    expect(await getGeneration(db, 999_999)).toBeNull();
  });

  it("counts only live requests for the daily cap", async () => {
    const since = new Date(Date.now() - 60_000);
    const before = await countLiveGenerationsSince(db, since);
    const base = { userId: null, status: "succeeded", lessonId: "lesson-count", lessonTitle: null, topic: "x", ageGroup: "8-10", language: "en", quality: "standard", evidence: "none", durationMs: 1, calls: [] };
    await saveGenerationLog(db, { ...base, mode: "live" });
    await saveGenerationLog(db, { ...base, mode: "sample" });
    expect(await countLiveGenerationsSince(db, since)).toBe(before + 1);
    expect(await countLiveGenerationsSince(db, new Date(Date.now() + 60_000))).toBe(0);
  });
});
