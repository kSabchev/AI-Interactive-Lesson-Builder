"use client";

import { useParams, useSearchParams } from "next/navigation";
import { LessonEditor } from "@/components/editor/LessonEditor";
import { useLesson } from "@/lib/lesson/useLesson";
import { useStore } from "@/lib/storage/StoreProvider";
import { LessonLoadError, LessonLoading, LessonNotFound } from "./LessonNotFound";

export function EditRoute() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const justCopied = searchParams.get("copied") === "1";
  const justGenerated = searchParams.get("generated") === "1";
  const lookup = useLesson(id);
  // Samples resolve before the session does, but the editor needs to know where saving goes.
  const storeReady = useStore().status === "ready";

  if (lookup.status === "loading" || !storeReady) return <LessonLoading />;
  if (lookup.status === "missing") return <LessonNotFound />;
  if (lookup.status === "error") return <LessonLoadError message={lookup.message} />;
  return (
    <LessonEditor
      key={id}
      lesson={lookup.lesson}
      isSample={lookup.isSample}
      justCopied={justCopied}
      justGenerated={justGenerated}
    />
  );
}
