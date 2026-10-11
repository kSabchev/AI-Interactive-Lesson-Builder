"use client";

import { useParams, useSearchParams } from "next/navigation";
import { LessonPlayer } from "@/components/player/LessonPlayer";
import { useLesson } from "@/lib/lesson/useLesson";
import { LessonLoadError, LessonLoading, LessonNotFound } from "./LessonNotFound";

export function PresentRoute() {
  const { id } = useParams<{ id: string }>();
  const sectionId = useSearchParams().get("section") ?? undefined;
  const lookup = useLesson(id);

  if (lookup.status === "loading") return <LessonLoading />;
  if (lookup.status === "missing") return <LessonNotFound />;
  if (lookup.status === "error") return <LessonLoadError message={lookup.message} />;
  // Re-mount when the section param changes so "Revisit" links land on the right section.
  return <LessonPlayer key={sectionId} lesson={lookup.lesson} initialSectionId={sectionId} />;
}
