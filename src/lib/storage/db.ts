/** Browser storage (IndexedDB) for guests. Signed-in users' data lives on the server; see `store.ts`. */
import { type DBSchema, type IDBPDatabase, openDB } from "idb";
import { type Lesson, lessonSchema } from "@/lib/lesson/schema";
import type { QuizAttempt } from "@/lib/quiz/attempt";

export type { QuizAttempt };

interface LessonBuilderDB extends DBSchema {
  lessons: { key: string; value: Lesson; indexes: { updatedAt: string } };
  attempts: { key: string; value: QuizAttempt };
}

const DB_NAME = "lesson-builder";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<LessonBuilderDB>> | undefined;

function db() {
  dbPromise ??= openDB<LessonBuilderDB>(DB_NAME, DB_VERSION, {
    upgrade(database) {
      const lessons = database.createObjectStore("lessons", { keyPath: "id" });
      lessons.createIndex("updatedAt", "updatedAt");
      database.createObjectStore("attempts", { keyPath: "lessonId" });
    },
  });
  return dbPromise;
}

/** Stored data may predate a schema change, so it is re-validated and anything invalid is skipped. */
function parseStored(value: unknown): Lesson | undefined {
  const result = lessonSchema.safeParse(value);
  return result.success ? result.data : undefined;
}

export async function listSavedLessons(): Promise<Lesson[]> {
  const all = await (await db()).getAllFromIndex("lessons", "updatedAt");
  return all
    .map(parseStored)
    .filter((lesson): lesson is Lesson => lesson !== undefined)
    .reverse();
}

export async function getSavedLesson(id: string): Promise<Lesson | undefined> {
  return parseStored(await (await db()).get("lessons", id));
}

/** Validates before writing so nothing malformed ever reaches the player. */
export async function saveLesson(lesson: Lesson): Promise<Lesson> {
  const valid = lessonSchema.parse(lesson);
  await (await db()).put("lessons", valid);
  return valid;
}

export async function deleteSavedLesson(id: string): Promise<void> {
  const tx = (await db()).transaction(["lessons", "attempts"], "readwrite");
  await Promise.all([tx.objectStore("lessons").delete(id), tx.objectStore("attempts").delete(id), tx.done]);
}

export async function getLatestAttempt(lessonId: string): Promise<QuizAttempt | undefined> {
  return (await db()).get("attempts", lessonId);
}

export async function listLatestAttempts(): Promise<QuizAttempt[]> {
  return (await db()).getAll("attempts");
}

export async function deleteAttempt(lessonId: string): Promise<void> {
  await (await db()).delete("attempts", lessonId);
}

export async function saveAttempt(attempt: QuizAttempt): Promise<void> {
  await (await db()).put("attempts", attempt);
}
