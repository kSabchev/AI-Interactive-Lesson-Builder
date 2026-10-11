import { z } from "zod";

/** The most recent completed quiz attempt for a lesson. Only the latest one is kept. */
export const quizAttemptSchema = z.object({
  lessonId: z.string().min(1).max(64),
  answers: z.record(z.string().max(64), z.string().max(64)),
  score: z.number().int().min(0).max(20),
  total: z.number().int().min(1).max(20),
  completedAt: z.iso.datetime(),
});

export type QuizAttempt = z.infer<typeof quizAttemptSchema>;
