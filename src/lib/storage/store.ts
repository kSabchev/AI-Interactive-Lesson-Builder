import { type Lesson, lessonSchema } from "@/lib/lesson/schema";
import type { QuizAttempt } from "@/lib/quiz/attempt";
import * as local from "./db";

/** Where saved lessons and quiz attempts live. The editor, player and library only talk to this interface. */
export interface LessonStore {
  readonly kind: "browser" | "account";
  listLessons(): Promise<Lesson[]>;
  getLesson(id: string): Promise<Lesson | undefined>;
  saveLesson(lesson: Lesson): Promise<Lesson>;
  deleteLesson(id: string): Promise<void>;
  listAttempts(): Promise<QuizAttempt[]>;
  getAttempt(lessonId: string): Promise<QuizAttempt | undefined>;
  saveAttempt(attempt: QuizAttempt): Promise<void>;
  deleteAttempt(lessonId: string): Promise<void>;
}

/** Guests: everything stays in this browser's IndexedDB. */
export const browserStore: LessonStore = {
  kind: "browser",
  listLessons: local.listSavedLessons,
  getLesson: local.getSavedLesson,
  saveLesson: local.saveLesson,
  deleteLesson: local.deleteSavedLesson,
  listAttempts: local.listLatestAttempts,
  getAttempt: local.getLatestAttempt,
  saveAttempt: local.saveAttempt,
  deleteAttempt: local.deleteAttempt,
};

export class StoreError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    credentials: "same-origin",
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new StoreError(response.status, body?.error?.message ?? "Couldn't reach your account. Please try again.");
  }
  return (response.status === 204 ? undefined : await response.json()) as T;
}

const enc = encodeURIComponent;

/** Signed-in users: lessons are stored in their account on the server. */
export const accountStore: LessonStore = {
  kind: "account",
  async listLessons() {
    const { lessons } = await api<{ lessons: unknown[] }>("/api/lessons");
    return lessons.map((l) => lessonSchema.parse(l));
  },
  async getLesson(id) {
    try {
      const { lesson } = await api<{ lesson: unknown }>(`/api/lessons/${enc(id)}`);
      return lessonSchema.parse(lesson);
    } catch (error) {
      if (error instanceof StoreError && error.status === 404) return undefined;
      throw error;
    }
  },
  async saveLesson(lesson) {
    const valid = lessonSchema.parse(lesson);
    await api(`/api/lessons/${enc(valid.id)}`, { method: "PUT", body: JSON.stringify(valid) });
    return valid;
  },
  async deleteLesson(id) {
    await api(`/api/lessons/${enc(id)}`, { method: "DELETE" });
  },
  async listAttempts() {
    return (await api<{ attempts: QuizAttempt[] }>("/api/attempts")).attempts;
  },
  async getAttempt(lessonId) {
    return (await api<{ attempt: QuizAttempt | null }>(`/api/attempts/${enc(lessonId)}`)).attempt ?? undefined;
  },
  async saveAttempt(attempt) {
    await api(`/api/attempts/${enc(attempt.lessonId)}`, { method: "PUT", body: JSON.stringify(attempt) });
  },
  async deleteAttempt(lessonId) {
    await api(`/api/attempts/${enc(lessonId)}`, { method: "DELETE" });
  },
};

/** Copies everything saved in this browser into the signed-in account, then clears the browser copies. */
export async function importBrowserData(): Promise<{ imported: number; skipped: number }> {
  const [lessons, attempts] = await Promise.all([local.listSavedLessons(), local.listLatestAttempts()]);
  const result = await api<{ imported: number; skipped: number }>("/api/import", {
    method: "POST",
    body: JSON.stringify({ lessons, attempts }),
  });
  for (const lesson of lessons) await local.deleteSavedLesson(lesson.id);
  for (const attempt of attempts) await local.deleteAttempt(attempt.lessonId);
  return result;
}
