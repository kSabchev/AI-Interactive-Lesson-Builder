"use client";

import { useParams, useSearchParams } from "next/navigation";
import { LessonEditor } from "@/components/editor/LessonEditor";
import { useLesson } from "@/lib/lesson/useLesson";
import { LessonLoading, LessonNotFound } from "./LessonNotFound";

export function EditRoute() {
  const { id } = useParams<{ id: string }>();
  const justCopied = useSearchParams().get("copied") === "1";
  const lookup = useLesson(id);

  if (lookup.status === "loading") return <LessonLoading />;
  if (lookup.status === "missing") return <LessonNotFound />;
  return <LessonEditor key={id} lesson={lookup.lesson} isSample={lookup.isSample} justCopied={justCopied} />;
}
