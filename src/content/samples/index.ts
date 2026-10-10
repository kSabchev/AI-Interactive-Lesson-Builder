import { lessonSchema, type Lesson } from "@/lib/lesson/schema";
import { waterCycleLesson } from "./water-cycle";

/** Curated lessons, validated at load so a broken fixture fails loudly in dev and tests. */
export const SAMPLE_LESSONS: Lesson[] = [waterCycleLesson].map((lesson) => lessonSchema.parse(lesson));

export function getSampleLesson(id: string): Lesson | undefined {
  return SAMPLE_LESSONS.find((lesson) => lesson.id === id);
}
