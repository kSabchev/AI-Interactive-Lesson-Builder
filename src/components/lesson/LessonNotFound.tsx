"use client";

import { ButtonLink } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/client";

export function LessonNotFound() {
  const t = useT();
  return (
    <main className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-3xl font-extrabold">{t.lessonStates.notFoundTitle}</h1>
      <p className="text-lg text-muted">{t.lessonStates.notFoundBody}</p>
      <ButtonLink href="/" size="lg">
        {t.common.backToLibrary}
      </ButtonLink>
    </main>
  );
}

export function LessonLoadError({ message }: { message: string }) {
  const t = useT();
  return (
    <main className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-3xl font-extrabold">{t.lessonStates.loadErrorTitle}</h1>
      <p className="text-lg text-muted">{message || t.library.loadErrorAccount}</p>
      <ButtonLink href="/" size="lg">
        {t.common.backToLibrary}
      </ButtonLink>
    </main>
  );
}

export function LessonLoading() {
  const t = useT();
  return (
    <main className="flex flex-1 items-center justify-center p-16" aria-busy="true">
      <p className="text-lg font-bold text-muted">{t.lessonStates.loading}</p>
    </main>
  );
}
