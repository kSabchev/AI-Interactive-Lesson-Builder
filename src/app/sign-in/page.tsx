import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { AppHeader } from "@/components/account/AppHeader";
import { SignInForm } from "@/components/account/SignInForm";
import { isGoogleSignInEnabled } from "@/lib/server/auth";
import { isDevMailboxEnabled } from "@/lib/server/email";

export const metadata: Metadata = { title: "Sign in — Lesson Builder" };

async function Form() {
  await connection();
  return <SignInForm googleEnabled={isGoogleSignInEnabled()} devMailbox={isDevMailboxEnabled()} />;
}

export default function SignInPage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-12">
        <h1 className="text-4xl font-extrabold">Sign in</h1>
        <p className="mt-2 mb-8 text-lg text-muted">
          Save your lessons to your account and use them on any device. Accounts are for adults; learners never need
          one.
        </p>
        <Suspense fallback={<p className="text-muted">Loading…</p>}>
          <Form />
        </Suspense>
      </main>
    </>
  );
}
