import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";
import { AccountPanel } from "@/components/account/AccountPanel";
import { AppHeader } from "@/components/account/AppHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { getT } from "@/lib/i18n/server";
import { isOperator } from "@/lib/server/admin";
import { getSessionUser } from "@/lib/server/auth";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.meta.page(t.account.title) };
}

/** A link to the operator pages, shown only to site operators. */
async function OperatorLinks() {
  const [user, t] = await Promise.all([headers().then(getSessionUser), getT()]);
  if (!user || !isOperator(user)) return null;
  return (
    <p className="mt-8 flex flex-wrap gap-4">
      <Link href="/admin/generations" className="font-bold text-brand-700 underline underline-offset-2">
        {t.generationLog.title}
      </Link>
      <Link href="/admin/errors" className="font-bold text-brand-700 underline underline-offset-2">
        {t.errorLog.title}
      </Link>
    </p>
  );
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
        <Suspense>
          <OperatorLinks />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
