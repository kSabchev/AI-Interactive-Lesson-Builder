import { lessonSchema, type Lesson } from "@/lib/lesson/schema";
import { photosynthesisLesson } from "./photosynthesis";
import { solarSystemLesson } from "./solar-system";
import { waterCycleLesson } from "./water-cycle";

export const SAMPLE_LESSON_INPUTS = [waterCycleLesson, solarSystemLesson, photosynthesisLesson];

/** Curated lessons, validated at load so a broken fixture fails loudly in dev and tests. */
export const SAMPLE_LESSONS: Lesson[] = SAMPLE_LESSON_INPUTS.map((lesson) => lessonSchema.parse(lesson));

export function getSampleLesson(id: string): Lesson | undefined {
  return SAMPLE_LESSONS.find((lesson) => lesson.id === id);
}
