import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AppHeader } from "@/components/account/AppHeader";
import { logFormat } from "@/components/admin/format";
import { OperatorGate } from "@/components/admin/OperatorGate";
import { getLocale, getT } from "@/lib/i18n/server";
import type { SessionUser } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { getGeneration } from "@/lib/server/generationLog";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.meta.page(t.generationLog.title), robots: { index: false } };
}

async function GenerationDetail({ id, viewer }: { id: string; viewer: SessionUser }) {
  const [t, locale, db] = await Promise.all([getT(), getLocale(), getDb()]);
  const log = t.generationLog;
  const f = logFormat(locale);
  const found = /^\d+$/.test(id) ? await getGeneration(db, Number(id)) : null;
  if (!found) return <p className="text-muted">{log.notFound}</p>;
  const { request: r, calls } = found;

  const settings =
    r.mode === "sample"
      ? [log.sampleMode]
      : [r.ageGroup, r.language?.toUpperCase(), r.quality && (log.quality[r.quality] ?? r.quality), r.evidence && (log.evidence[r.evidence] ?? r.evidence)];
  const total = (key: "inputTokens" | "cacheReadTokens" | "cacheWriteTokens" | "outputTokens" | "webSearches") =>
    calls.reduce((sum, c) => sum + c[key], 0);
  const cell = "px-3 py-2 text-right tabular-nums";

  return (
    <>
      <h1 className="mb-2 text-3xl font-extrabold md:text-4xl" lang={r.language ?? undefined}>
        {r.lessonTitle ?? r.topic ?? `#${r.id}`}
      </h1>
      <p className="mb-1 text-muted">
        {f.when(r.createdAt)} · {r.isDemo ? log.demo : (r.email ?? log.guest)} ·{" "}
        {r.status === "succeeded" ? log.succeeded : <span className="text-miss-700">{log.failed(r.status)}</span>}
      </p>
      {r.topic && r.topic !== r.lessonTitle && (
        <p className="mb-1 text-muted" lang={r.language ?? undefined}>
          “{r.topic}”
        </p>
      )}
      <p className="mb-6 text-muted">{settings.filter(Boolean).join(" · ")}</p>
      {r.status === "succeeded" && r.lessonId && r.userId === viewer.id && (
        <p className="mb-6">
          <Link href={`/lessons/${r.lessonId}/edit`} className="font-bold text-brand-700 underline underline-offset-2">
            {log.openLesson}
          </Link>
        </p>
      )}

      {calls.length === 0 ? (
        <p className="text-muted">{log.noCalls}</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl bg-surface shadow-sm ring-1 ring-line">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-muted">
                <tr>
                  <th className="px-3 py-2 font-bold">{log.columns.stage}</th>
                  <th className="px-3 py-2 font-bold">{log.columns.model}</th>
                  <th className="px-3 py-2 text-right font-bold">{log.columns.input}</th>
                  <th className="px-3 py-2 text-right font-bold">{log.columns.cacheRead}</th>
                  <th className="px-3 py-2 text-right font-bold">{log.columns.cacheWrite}</th>
                  <th className="px-3 py-2 text-right font-bold">{log.columns.output}</th>
                  <th className="px-3 py-2 text-right font-bold">{log.columns.searches}</th>
                  <th className="px-3 py-2 text-right font-bold">{log.columns.cost}</th>
                  <th className="px-3 py-2 text-right font-bold">{log.columns.time}</th>
                </tr>
              </thead>
              <tbody>
                {calls.map((c) => (
                  <tr key={c.id} className="border-b border-line">
                    <td className="px-3 py-2">
                      <span className="font-bold">{log.stages[c.stage] ?? c.stage}</span>
                      {c.attempt > 1 && (
                        <span className="text-muted">
                          {" "}
                          ({c.stage === "research" ? log.continuation : log.repair} {c.attempt - 1})
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-muted">{c.model}</td>
                    <td className={cell}>{f.count(c.inputTokens)}</td>
                    <td className={cell}>{f.count(c.cacheReadTokens)}</td>
                    <td className={cell}>{f.count(c.cacheWriteTokens)}</td>
                    <td className={cell}>{f.count(c.outputTokens)}</td>
                    <td className={cell}>{f.count(c.webSearches)}</td>
                    <td className={`${cell} font-bold`}>{f.usd(c.estimatedUsd)}</td>
                    <td className={`${cell} whitespace-nowrap`}>{f.duration(c.durationMs)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="font-extrabold">
                <tr>
                  <td className="px-3 py-2" colSpan={2}>
                    {log.total}
                  </td>
                  <td className={cell}>{f.count(total("inputTokens"))}</td>
                  <td className={cell}>{f.count(total("cacheReadTokens"))}</td>
                  <td className={cell}>{f.count(total("cacheWriteTokens"))}</td>
                  <td className={cell}>{f.count(total("outputTokens"))}</td>
                  <td className={cell}>{f.count(total("webSearches"))}</td>
                  <td className={cell}>{f.usd(r.estimatedUsd)}</td>
                  <td className={`${cell} whitespace-nowrap`}>{f.duration(r.durationMs)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="mt-4 max-w-3xl text-sm text-muted">{log.perSectionNote}</p>
          <p className="mt-2 max-w-3xl text-sm text-muted">{log.cacheNote}</p>
        </>
      )}
    </>
  );
}

export default async function GenerationDetailPage({ params }: PageProps<"/admin/generations/[id]">) {
  const t = await getT();
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 md:px-8">
        <p className="mb-6">
          <Link href="/admin/generations" className="font-bold text-brand-700 underline-offset-2 hover:underline">
            <span aria-hidden="true">←</span> {t.generationLog.back}
          </Link>
        </p>
        <Suspense fallback={<p className="text-muted">{t.common.loading}</p>}>
          <OperatorGate>
            {async (viewer) => <GenerationDetail id={(await params).id} viewer={viewer} />}
          </OperatorGate>
        </Suspense>
      </main>
    </>
  );
}
