import { describe, expect, it } from "vitest";
import { generationInputSchema } from "./input";
import { sampleLesson } from "./sample";

describe("generationInputSchema", () => {
  const base = { topic: "  Volcanoes  ", ageGroup: "11-12", durationMinutes: 15 };

  it("trims the topic and drops empty reference text", () => {
    expect(generationInputSchema.parse({ ...base, referenceText: "   " })).toEqual({
      topic: "Volcanoes",
      ageGroup: "11-12",
      durationMinutes: 15,
      referenceText: undefined,
      quality: "standard",
    });
  });

  it("rejects unsupported age groups and durations", () => {
    expect(generationInputSchema.safeParse({ ...base, ageGroup: "5-7" }).success).toBe(false);
    expect(generationInputSchema.safeParse({ ...base, durationMinutes: 20 }).success).toBe(false);
  });

  it("limits topic and reference length", () => {
    expect(generationInputSchema.safeParse({ ...base, topic: "x".repeat(121) }).success).toBe(false);
    expect(generationInputSchema.safeParse({ ...base, referenceText: "x".repeat(20_001) }).success).toBe(false);
  });
});

describe("sampleLesson", () => {
  const input = { ageGroup: "8-10", durationMinutes: 10, quality: "standard" } as const;

  it("picks the closest curated lesson and says so", () => {
    const { lesson, notice } = sampleLesson({ ...input, topic: "Why do leaves need sunlight?" }, "lesson-x", "2026-10-11T00:00:00.000Z");
    expect(lesson.title).toMatch(/Photosynthesis/);
    expect(lesson).toMatchObject({ id: "lesson-x", contentOrigin: "curated", createdAt: "2026-10-11T00:00:00.000Z" });
    expect(notice).toContain("closest match");
  });

  it("is upfront when no curated lesson covers the topic", () => {
    const { notice } = sampleLesson({ ...input, topic: "Volcanoes" }, "lesson-y", "2026-10-11T00:00:00.000Z");
    expect(notice).toContain("none of our curated lessons covers “Volcanoes”");
  });
});
