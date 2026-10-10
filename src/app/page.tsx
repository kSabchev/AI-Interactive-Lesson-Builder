import { LessonCard } from "@/components/lesson/LessonCard";
import { SAMPLE_LESSONS } from "@/content/samples";

export default function Home() {
  return (
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
      </section>

      <section className="mt-12" aria-labelledby="samples-heading">
        <h2 id="samples-heading" className="mb-4 text-2xl font-extrabold">
          Try a sample lesson
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SAMPLE_LESSONS.map((lesson) => (
            <li key={lesson.id}>
              <LessonCard lesson={lesson} />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
