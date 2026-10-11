import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { type Lesson, lessonSchema } from "@/lib/lesson/schema";
import type { QuizAttempt } from "@/lib/quiz/attempt";
import type { Database } from "./db";
import { lesson as lessonTable, quizAttempt } from "./db/schema";

/**
 * Lesson and attempt storage for signed-in users. Every function takes the owner's id and every query
 * filters on it, so one user can never read or change another user's rows.
 */

function parseStored(data: unknown): Lesson | undefined {
  const result = lessonSchema.safeParse(data);
  return result.success ? result.data : undefined;
}

export async function listLessons(db: Database, userId: string): Promise<Lesson[]> {
  const rows = await db
    .select({ data: lessonTable.data })
    .from(lessonTable)
    .where(eq(lessonTable.userId, userId))
    .orderBy(desc(lessonTable.updatedAt));
  return rows.map((r) => parseStored(r.data)).filter((l): l is Lesson => l !== undefined);
}

export async function getLesson(db: Database, userId: string, id: string): Promise<Lesson | undefined> {
  const [row] = await db
    .select({ data: lessonTable.data })
    .from(lessonTable)
    .where(and(eq(lessonTable.userId, userId), eq(lessonTable.id, id)));
  return row ? parseStored(row.data) : undefined;
}

/** Validates, then inserts or replaces. */
export async function saveLesson(db: Database, userId: string, input: unknown): Promise<Lesson> {
  const lesson = lessonSchema.parse(input);
  const changes = {
    title: lesson.title,
    topic: lesson.topic,
    ageGroup: lesson.ageGroup,
    durationMinutes: lesson.durationMinutes,
    contentOrigin: lesson.contentOrigin,
    data: lesson,
    createdAt: new Date(lesson.createdAt),
    updatedAt: new Date(lesson.updatedAt),
  };
  await db
    .insert(lessonTable)
    .values({ userId, id: lesson.id, ...changes })
    .onConflictDoUpdate({ target: [lessonTable.userId, lessonTable.id], set: changes });
  return lesson;
}

export async function deleteLesson(db: Database, userId: string, id: string): Promise<void> {
  await db.delete(quizAttempt).where(and(eq(quizAttempt.userId, userId), eq(quizAttempt.lessonId, id)));
  await db.delete(lessonTable).where(and(eq(lessonTable.userId, userId), eq(lessonTable.id, id)));
}

export async function listAttempts(db: Database, userId: string): Promise<QuizAttempt[]> {
  const rows = await db.select().from(quizAttempt).where(eq(quizAttempt.userId, userId));
  return rows.map(toAttempt);
}

export async function getAttempt(db: Database, userId: string, lessonId: string): Promise<QuizAttempt | undefined> {
  const [row] = await db
    .select()
    .from(quizAttempt)
    .where(and(eq(quizAttempt.userId, userId), eq(quizAttempt.lessonId, lessonId)));
  return row ? toAttempt(row) : undefined;
}

export async function saveAttempt(db: Database, userId: string, attempt: QuizAttempt): Promise<void> {
  const row = { userId, ...attempt, completedAt: new Date(attempt.completedAt) };
  await db
    .insert(quizAttempt)
    .values(row)
    .onConflictDoUpdate({
      target: [quizAttempt.userId, quizAttempt.lessonId],
      set: { answers: row.answers, score: row.score, total: row.total, completedAt: row.completedAt },
    });
}

export async function deleteAttempt(db: Database, userId: string, lessonId: string): Promise<void> {
  await db.delete(quizAttempt).where(and(eq(quizAttempt.userId, userId), eq(quizAttempt.lessonId, lessonId)));
}

/**
 * Copies a guest's browser data into their account. Lessons already in the account are kept when they are
 * newer, so importing twice (or from an older browser) never overwrites more recent work.
 */
export async function importGuestData(
  db: Database,
  userId: string,
  data: { lessons: unknown[]; attempts: QuizAttempt[] },
  /** How many new lessons the account may still add (plan cap); undefined means no limit. */
  newLessonAllowance?: number,
): Promise<{ imported: number; skipped: number; overLimit: number }> {
  let imported = 0;
  let skipped = 0;
  let overLimit = 0;
  let allowance = newLessonAllowance ?? Infinity;
  for (const candidate of data.lessons) {
    const parsed = lessonSchema.safeParse(candidate);
    if (!parsed.success) {
      skipped++;
      continue;
    }
    const existing = await getLesson(db, userId, parsed.data.id);
    if (existing && existing.updatedAt >= parsed.data.updatedAt) {
      skipped++;
      continue;
    }
    if (!existing) {
      if (allowance <= 0) {
        overLimit++;
        continue;
      }
      allowance--;
    }
    await saveLesson(db, userId, parsed.data);
    imported++;
  }
  for (const attempt of data.attempts) {
    const existing = await getAttempt(db, userId, attempt.lessonId);
    if (!existing || existing.completedAt < attempt.completedAt) await saveAttempt(db, userId, attempt);
  }
  return { imported, skipped, overLimit };
}

function toAttempt(row: typeof quizAttempt.$inferSelect): QuizAttempt {
  return {
    lessonId: row.lessonId,
    answers: row.answers,
    score: row.score,
    total: row.total,
    completedAt: row.completedAt.toISOString(),
  };
}
