import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { AppHeader } from "@/components/account/AppHeader";
import { SignInForm } from "@/components/account/SignInForm";
import { getT } from "@/lib/i18n/server";
import { isGoogleSignInEnabled } from "@/lib/server/auth";
import { isDevMailboxEnabled } from "@/lib/server/email";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.meta.page(t.signIn.title) };
}

async function Form() {
  await connection();
  return <SignInForm googleEnabled={isGoogleSignInEnabled()} devMailbox={isDevMailboxEnabled()} />;
}

export default async function SignInPage() {
  const t = await getT();
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-12">
        <h1 className="text-4xl font-extrabold">{t.signIn.title}</h1>
        <p className="mt-2 mb-8 text-lg text-muted">{t.signIn.intro}</p>
        <Suspense fallback={<p className="text-muted">{t.common.loading}</p>}>
          <Form />
        </Suspense>
      </main>
    </>
  );
}
