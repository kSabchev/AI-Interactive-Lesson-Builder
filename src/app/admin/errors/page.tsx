import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AppHeader } from "@/components/account/AppHeader";
import { logFormat } from "@/components/admin/format";
import { OperatorGate } from "@/components/admin/OperatorGate";
import { getLocale, getT } from "@/lib/i18n/server";
import { getDb } from "@/lib/server/db";
import { ERROR_RETENTION_DAYS, listErrors } from "@/lib/server/errors";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.meta.page(t.errorLog.title), robots: { index: false } };
}

async function ErrorList() {
  const [t, locale, db] = await Promise.all([getT(), getLocale(), getDb()]);
  const errors = await listErrors(db);
  const f = logFormat(locale);
  const log = t.errorLog;
  if (errors.length === 0) return <p className="text-muted">{log.empty}</p>;
  return (
    <ol className="space-y-3">
      {errors.map((e) => (
        <li key={e.id} className="rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-line">
          <p className="text-sm text-muted">
            {f.when(e.createdAt)} · {log.sources[e.source] ?? e.source}
            {e.path && (
              <>
                {" · "}
                <code>{[e.method, e.path].filter(Boolean).join(" ")}</code>
              </>
            )}
            {e.digest && <> · digest {e.digest}</>}
          </p>
          <p className="mt-1 font-bold break-words">{e.message}</p>
          {e.stack && (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm font-bold text-brand-700">{log.details}</summary>
              <pre className="mt-2 overflow-x-auto rounded-xl bg-paper p-3 text-xs">{e.stack}</pre>
            </details>
          )}
        </li>
      ))}
    </ol>
  );
}

export default async function ErrorLogPage() {
  const t = await getT();
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 md:px-8">
        <p className="mb-6">
          <Link href="/admin/generations" className="font-bold text-brand-700 underline-offset-2 hover:underline">
            <span aria-hidden="true">←</span> {t.generationLog.title}
          </Link>
        </p>
        <h1 className="mb-2 text-4xl font-extrabold">{t.errorLog.title}</h1>
        <p className="mb-8 max-w-3xl text-muted">{t.errorLog.intro(ERROR_RETENTION_DAYS)}</p>
        <Suspense fallback={<p className="text-muted">{t.common.loading}</p>}>
          <OperatorGate>{() => <ErrorList />}</OperatorGate>
        </Suspense>
      </main>
    </>
  );
}
