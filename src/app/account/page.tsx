import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountPanel } from "@/components/account/AccountPanel";
import { AppHeader } from "@/components/account/AppHeader";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.meta.page(t.account.title) };
}

export default async function AccountPage() {
  const t = await getT();
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
        <h1 className="mb-8 text-4xl font-extrabold">{t.account.title}</h1>
        <Suspense fallback={<p className="text-muted">{t.common.loading}</p>}>
          <AccountPanel />
        </Suspense>
      </main>
    </>
  );
}
