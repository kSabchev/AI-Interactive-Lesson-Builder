import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AppHeader } from "@/components/account/AppHeader";
import { logFormat } from "@/components/admin/format";
import { OperatorGate } from "@/components/admin/OperatorGate";
import { getLocale, getT } from "@/lib/i18n/server";
import { getDb } from "@/lib/server/db";
import { generationTotals, listGenerations } from "@/lib/server/generationLog";

const LIMIT = 100;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.meta.page(t.generationLog.title), robots: { index: false } };
}

async function GenerationList() {
  const [t, locale, db] = await Promise.all([getT(), getLocale(), getDb()]);
  const [rows, totals] = await Promise.all([listGenerations(db, LIMIT), generationTotals(db)]);
  const log = t.generationLog;
  const f = logFormat(locale);

  if (rows.length === 0) return <p className="text-muted">{log.empty}</p>;

  const figures = [
    [log.totals.requests, f.count(totals.requests)],
    [log.totals.succeeded, f.count(totals.succeeded)],
    [log.totals.inputTokens, f.count(totals.inputTokens)],
    [log.totals.outputTokens, f.count(totals.outputTokens)],
    [log.totals.cachedTokens, f.count(totals.cacheReadTokens)],
    [log.totals.cost, f.usd(totals.estimatedUsd)],
  ];

  return (
    <>
      <dl className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {figures.map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-line">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="text-xl font-extrabold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="overflow-x-auto rounded-2xl bg-surface shadow-sm ring-1 ring-line">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-muted">
            <tr>
              <th className="px-3 py-2 font-bold">{log.columns.when}</th>
              <th className="px-3 py-2 font-bold">{log.columns.lesson}</th>
              <th className="px-3 py-2 font-bold">{log.columns.settings}</th>
              <th className="px-3 py-2 font-bold">{log.columns.model}</th>
              <th className="px-3 py-2 font-bold">{log.columns.status}</th>
              <th className="px-3 py-2 text-right font-bold">{log.columns.input}</th>
              <th className="px-3 py-2 text-right font-bold">{log.columns.cacheRead}</th>
              <th className="px-3 py-2 text-right font-bold">{log.columns.output}</th>
              <th className="px-3 py-2 text-right font-bold">{log.columns.cost}</th>
              <th className="px-3 py-2 text-right font-bold">{log.columns.time}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-line last:border-0 align-top">
                <td className="px-3 py-2 whitespace-nowrap text-muted">{f.when(r.createdAt)}</td>
                <td className="min-w-48 px-3 py-2">
                  <Link
                    href={`/admin/generations/${r.id}`}
                    className="font-bold text-brand-700 underline-offset-2 hover:underline"
                    lang={r.language ?? undefined}
                  >
                    {r.lessonTitle ?? r.topic ?? `#${r.id}`}
                  </Link>
                  <span className="block text-muted">{r.isDemo ? log.demo : (r.email ?? log.guest)}</span>
                </td>
                <td className="px-3 py-2 text-muted">
                  {r.mode === "sample" ? (
                    log.sampleMode
                  ) : (
                    <>
                      {[r.ageGroup, r.language?.toUpperCase(), r.quality && (log.quality[r.quality] ?? r.quality)]
                        .filter(Boolean)
                        .join(" · ")}
                      {r.evidence && <span className="block">{log.evidence[r.evidence] ?? r.evidence}</span>}
                    </>
                  )}
                </td>
                {/* The model that answered the last call; the request page lists the model of every call. */}
                <td className="px-3 py-2 whitespace-nowrap text-muted">{r.model ?? "—"}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {r.status === "succeeded" ? log.succeeded : <span className="text-miss-700">{log.failed(r.status)}</span>}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{f.count(r.inputTokens)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{f.count(r.cacheReadTokens)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{f.count(r.outputTokens)}</td>
                <td className="px-3 py-2 text-right font-bold tabular-nums">{f.usd(r.estimatedUsd)}</td>
                <td className="px-3 py-2 text-right whitespace-nowrap tabular-nums">{f.duration(r.durationMs)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totals.requests > rows.length && <p className="mt-3 text-sm text-muted">{log.showingLatest(rows.length)}</p>}
    </>
  );
}

export default async function GenerationLogPage() {
  const t = await getT();
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 md:px-8">
        <h1 className="mb-2 text-4xl font-extrabold">{t.generationLog.title}</h1>
        <p className="mb-8 max-w-3xl text-muted">{t.generationLog.intro}</p>
        <Suspense fallback={<p className="text-muted">{t.common.loading}</p>}>
          <OperatorGate>{() => <GenerationList />}</OperatorGate>
        </Suspense>
      </main>
    </>
  );
}
