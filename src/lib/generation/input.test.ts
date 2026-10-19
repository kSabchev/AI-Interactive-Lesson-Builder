import { describe, expect, it } from "vitest";
import { generationInputSchema } from "./input";
import { bg } from "@/lib/i18n/dictionaries/bg";
import { en } from "@/lib/i18n/dictionaries/en";
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
      research: false,
      experiment: false,
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
  const input = { ageGroup: "8-10", durationMinutes: 10, quality: "standard", research: false, experiment: false } as const;

  it("picks the closest curated lesson and says so", () => {
    const { lesson, notice } = sampleLesson({ ...input, topic: "Why do leaves need sunlight?" }, "lesson-x", "2026-10-11T00:00:00.000Z", en);
    expect(lesson.title).toMatch(/Photosynthesis/);
    expect(lesson).toMatchObject({ id: "lesson-x", contentOrigin: "curated", createdAt: "2026-10-11T00:00:00.000Z" });
    expect(notice).toContain("closest match");
  });

  it("is upfront when no curated lesson covers the topic", () => {
    const { notice } = sampleLesson({ ...input, topic: "Volcanoes" }, "lesson-y", "2026-10-11T00:00:00.000Z", en);
    expect(notice).toContain("none of our curated lessons covers “Volcanoes”");
  });
});

describe("sampleLesson with Bulgarian topics", () => {
  const input = { ageGroup: "8-10", durationMinutes: 10, quality: "standard", research: false, experiment: false } as const;

  it("matches Bulgarian keywords and explains in Bulgarian that samples are in English", () => {
    const { lesson, notice } = sampleLesson({ ...input, topic: "Защо листата имат нужда от светлина?" }, "lesson-z", "2026-10-11T00:00:00.000Z", bg);
    expect(lesson.title).toMatch(/Photosynthesis/);
    expect(notice).toContain("Режим с примерни уроци");
    expect(notice).toContain("на английски");
  });

  it("finds the water cycle for a Bulgarian water topic", () => {
    const { lesson } = sampleLesson({ ...input, topic: "Кръговратът на водата" }, "lesson-w", "2026-10-11T00:00:00.000Z", bg);
    expect(lesson.title).toMatch(/Water Cycle/);
  });
});
