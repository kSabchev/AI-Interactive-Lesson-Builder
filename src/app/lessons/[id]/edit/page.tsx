import { Suspense } from "react";
import { EditRoute } from "@/components/lesson/EditRoute";
import { LessonLoading } from "@/components/lesson/LessonNotFound";

export default function EditPage() {
  return (
    <Suspense fallback={<LessonLoading />}>
      <EditRoute />
    </Suspense>
  );
}
