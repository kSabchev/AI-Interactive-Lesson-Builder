import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { getSampleLesson } from "@/content/samples";
import type { Lesson } from "@/lib/lesson/schema";
import {
  deleteSavedLesson,
  getLatestAttempt,
  getSavedLesson,
  listLatestAttempts,
  listSavedLessons,
  saveAttempt,
  saveLesson,
} from "./db";

const sample = getSampleLesson("sample-water-cycle")!;

function lesson(id: string, updatedAt: string): Lesson {
  return { ...structuredClone(sample), id, title: `Lesson ${id}`, updatedAt };
}

beforeEach(async () => {
  for (const saved of await listSavedLessons()) await deleteSavedLesson(saved.id);
});

describe("lesson storage", () => {
  it("saves and reloads a lesson", async () => {
    await saveLesson(lesson("a", "2026-10-05T10:00:00.000Z"));
    expect((await getSavedLesson("a"))?.title).toBe("Lesson a");
  });

  it("lists the most recently updated lessons first", async () => {
    await saveLesson(lesson("old", "2026-10-01T10:00:00.000Z"));
    await saveLesson(lesson("new", "2026-10-06T10:00:00.000Z"));
    expect((await listSavedLessons()).map((l) => l.id)).toEqual(["new", "old"]);
  });

  it("refuses to save an invalid lesson", async () => {
    const broken = lesson("bad", "2026-10-05T10:00:00.000Z");
    broken.quiz = broken.quiz.slice(0, 2); // fewer than the three a lesson needs
    await expect(saveLesson(broken)).rejects.toThrow();
    expect(await getSavedLesson("bad")).toBeUndefined();
  });

  it("deleting a lesson also deletes its latest attempt", async () => {
    await saveLesson(lesson("c", "2026-10-05T10:00:00.000Z"));
    await saveAttempt({ lessonId: "c", answers: {}, score: 0, total: 5, completedAt: "2026-10-05T11:00:00.000Z" });
    await deleteSavedLesson("c");
    expect(await getSavedLesson("c")).toBeUndefined();
    expect(await getLatestAttempt("c")).toBeUndefined();
  });
});

describe("attempt storage", () => {
  it("keeps only the latest attempt per lesson", async () => {
    const base = { lessonId: "sample-water-cycle", answers: {}, total: 5 };
    await saveAttempt({ ...base, score: 2, completedAt: "2026-10-05T10:00:00.000Z" });
    await saveAttempt({ ...base, score: 4, completedAt: "2026-10-05T11:00:00.000Z" });
    expect((await getLatestAttempt("sample-water-cycle"))?.score).toBe(4);
    expect((await listLatestAttempts()).filter((a) => a.lessonId === "sample-water-cycle")).toHaveLength(1);
  });
});
