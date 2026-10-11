import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AppHeader } from "@/components/account/AppHeader";
import { CreateLessonForm } from "@/components/create/CreateLessonForm";
import { generationConfig } from "@/lib/generation/server/config";

export const metadata: Metadata = { title: "Create a lesson — Lesson Builder" };

/** The mode comes from the deployment's environment at request time, not from the build. */
async function FormWithMode() {
  await connection();
  const config = generationConfig();
  return <CreateLessonForm mode={config.mode} webResearch={config.webResearch} />;
}

export default function CreatePage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-8 md:py-12">
        <Link href="/" className="font-bold text-muted hover:text-ink">
          <span aria-hidden="true">←</span> Library
        </Link>
        <h1 className="mt-4 mb-2 text-4xl font-extrabold">Create a lesson</h1>
        <p className="mb-8 max-w-2xl text-lg text-muted">
          Describe the topic and your learners. You&apos;ll get an editable draft with activities and a quiz to review
          before presenting.
        </p>
        <Suspense fallback={<p className="text-muted">Loading…</p>}>
          <FormWithMode />
        </Suspense>
      </main>
    </>
  );
}
