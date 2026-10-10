import { Suspense } from "react";
import { LessonLoading } from "@/components/lesson/LessonNotFound";
import { PresentRoute } from "@/components/lesson/PresentRoute";

export default function PresentPage() {
  return (
    <Suspense fallback={<LessonLoading />}>
      <PresentRoute />
    </Suspense>
  );
}
