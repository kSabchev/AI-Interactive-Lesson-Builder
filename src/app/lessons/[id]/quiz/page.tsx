import { Suspense } from "react";
import { LessonLoading } from "@/components/lesson/LessonNotFound";
import { QuizRoute } from "@/components/lesson/QuizRoute";

export default function QuizPage() {
  return (
    <Suspense fallback={<LessonLoading />}>
      <QuizRoute />
    </Suspense>
  );
}
