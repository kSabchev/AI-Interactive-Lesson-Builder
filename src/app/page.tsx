import { AppHeader } from "@/components/account/AppHeader";
import { LibraryLessons } from "@/components/lesson/LibraryLessons";
import { ButtonLink } from "@/components/ui/Button";

export default function Home() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 md:px-8 md:py-16">
        <section className="max-w-3xl">
          <p className="font-extrabold uppercase tracking-widest text-brand-600">Lesson Builder</p>
          <h1 className="mt-2 text-4xl font-extrabold leading-tight text-balance md:text-6xl">
            Turn a science topic into an interactive lesson.
          </h1>
          <p className="mt-4 text-xl leading-relaxed text-muted">
            For parents and teachers of 8–12 year olds. Review the lesson, present it on one shared screen with hands-on
            activities, then check understanding with a short quiz tied to what was taught.
          </p>
          <ButtonLink href="/create" size="lg" className="mt-6">
            Create a lesson
          </ButtonLink>
        </section>

        <LibraryLessons />
      </main>
    </>
  );
}
