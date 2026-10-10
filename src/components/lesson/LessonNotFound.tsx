import { ButtonLink } from "@/components/ui/Button";

export function LessonNotFound() {
  return (
    <main className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-3xl font-extrabold">We couldn&apos;t find that lesson</h1>
      <p className="text-lg text-muted">It may have been deleted, or the link is incomplete. Try a sample lesson instead.</p>
      <ButtonLink href="/" size="lg">
        Back to the library
      </ButtonLink>
    </main>
  );
}

export function LessonLoading() {
  return (
    <main className="flex flex-1 items-center justify-center p-16" aria-busy="true">
      <p className="text-lg font-bold text-muted">Loading lesson…</p>
    </main>
  );
}
