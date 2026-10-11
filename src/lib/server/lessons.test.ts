import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { getSampleLesson } from "@/content/samples";
import type { Lesson } from "@/lib/lesson/schema";
import { type Database, getDb } from "./db";
import { user } from "./db/schema";
import {
  deleteLesson,
  getAttempt,
  getLesson,
  importGuestData,
  listAttempts,
  listLessons,
  saveAttempt,
  saveLesson,
} from "./lessons";

process.env.PGLITE_DIR = "memory://";
delete process.env.DATABASE_URL;

let db: Database;
const sample = getSampleLesson("sample-water-cycle")!;

function lesson(id: string, updatedAt: string, title = `Lesson ${id}`): Lesson {
  return { ...structuredClone(sample), id, title, updatedAt };
}

async function createUser(id: string) {
  await db.insert(user).values({ id, name: id, email: `${id}@example.com` });
}

beforeAll(async () => {
  db = await getDb();
  await createUser("alice");
  await createUser("bob");
});

describe("server lesson storage", () => {
  it("keeps each user's lessons private, even with the same lesson id", async () => {
    await saveLesson(db, "alice", lesson("shared-id", "2026-10-01T00:00:00.000Z", "Alice's"));
    await saveLesson(db, "bob", lesson("shared-id", "2026-10-01T00:00:00.000Z", "Bob's"));

    expect((await getLesson(db, "alice", "shared-id"))?.title).toBe("Alice's");
    expect((await getLesson(db, "bob", "shared-id"))?.title).toBe("Bob's");

    await deleteLesson(db, "bob", "shared-id");
    expect(await getLesson(db, "bob", "shared-id")).toBeUndefined();
    expect(await getLesson(db, "alice", "shared-id")).toBeDefined();
  });

  it("updates in place and lists newest first", async () => {
    await saveLesson(db, "alice", lesson("a1", "2026-10-02T00:00:00.000Z"));
    await saveLesson(db, "alice", lesson("a2", "2026-10-03T00:00:00.000Z"));
    await saveLesson(db, "alice", lesson("a1", "2026-10-04T00:00:00.000Z", "Renamed"));

    const ids = (await listLessons(db, "alice")).map((l) => l.id);
    expect(ids.slice(0, 2)).toEqual(["a1", "a2"]);
    expect((await getLesson(db, "alice", "a1"))?.title).toBe("Renamed");
  });

  it("refuses invalid lessons", async () => {
    const broken = { ...lesson("bad", "2026-10-02T00:00:00.000Z"), quiz: [] };
    await expect(saveLesson(db, "alice", broken)).rejects.toThrow();
    expect(await getLesson(db, "alice", "bad")).toBeUndefined();
  });

  it("stores the latest attempt and removes it with its lesson", async () => {
    await saveLesson(db, "alice", lesson("quizzed", "2026-10-02T00:00:00.000Z"));
    const attempt = { lessonId: "quizzed", answers: { q1: "a" }, score: 1, total: 5, completedAt: "2026-10-02T10:00:00.000Z" };
    await saveAttempt(db, "alice", attempt);
    await saveAttempt(db, "alice", { ...attempt, score: 4, completedAt: "2026-10-02T11:00:00.000Z" });
    expect((await getAttempt(db, "alice", "quizzed"))?.score).toBe(4);
    expect(await getAttempt(db, "bob", "quizzed")).toBeUndefined();

    await deleteLesson(db, "alice", "quizzed");
    expect(await getAttempt(db, "alice", "quizzed")).toBeUndefined();
  });

  it("imports guest data without overwriting newer account copies", async () => {
    await createUser("carol");
    await saveLesson(db, "carol", lesson("kept", "2026-10-09T00:00:00.000Z", "Account copy"));

    const result = await importGuestData(db, "carol", {
      lessons: [
        lesson("kept", "2026-10-01T00:00:00.000Z", "Older browser copy"),
        lesson("new", "2026-10-05T00:00:00.000Z"),
        { not: "a lesson" },
      ],
      attempts: [{ lessonId: "sample-water-cycle", answers: {}, score: 3, total: 5, completedAt: "2026-10-05T00:00:00.000Z" }],
    });

    expect(result).toEqual({ imported: 1, skipped: 2 });
    expect((await getLesson(db, "carol", "kept"))?.title).toBe("Account copy");
    expect(await getLesson(db, "carol", "new")).toBeDefined();
    expect((await listAttempts(db, "carol")).map((a) => a.score)).toEqual([3]);
  });

  it("deleting a user deletes their lessons and attempts", async () => {
    await createUser("dave");
    await saveLesson(db, "dave", lesson("d1", "2026-10-02T00:00:00.000Z"));
    await saveAttempt(db, "dave", { lessonId: "d1", answers: {}, score: 1, total: 5, completedAt: "2026-10-02T00:00:00.000Z" });
    await db.delete(user).where(eq(user.id, "dave"));
    expect(await listLessons(db, "dave")).toEqual([]);
    expect(await listAttempts(db, "dave")).toEqual([]);
  });
});
