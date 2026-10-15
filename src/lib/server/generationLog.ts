import "server-only";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import type { UsageReport } from "@/lib/generation/server/claude";
import type { Database } from "./db";
import { generationCall, generationUsage, user } from "./db/schema";

export type GenerationRecord = {
  userId: string | null;
  mode: string;
  status: string;
  lessonId: string;
  lessonTitle: string | null;
  topic: string;
  ageGroup: string;
  language: string;
  quality: string;
  /** "none", "reference", "web", or "web-fallback" when research found too few sources. */
  evidence: string;
  durationMs: number;
  calls: UsageReport[];
};

const sum = (calls: UsageReport[], key: keyof Omit<UsageReport, "stage" | "model">) =>
  calls.reduce((total, call) => total + call[key], 0);

/** Stores one request and its model calls. Totals are derived from the calls so the two never disagree. */
export async function saveGenerationLog(db: Database, record: GenerationRecord): Promise<void> {
  const { calls, ...request } = record;
  await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(generationUsage)
      .values({
        ...request,
        model: calls.at(-1)?.model ?? null,
        inputTokens: sum(calls, "inputTokens"),
        outputTokens: sum(calls, "outputTokens"),
        cacheReadTokens: sum(calls, "cacheReadTokens"),
        cacheWriteTokens: sum(calls, "cacheWriteTokens"),
        webSearches: sum(calls, "webSearches"),
        estimatedUsd: sum(calls, "estimatedUsd").toFixed(4),
      })
      .returning({ id: generationUsage.id });
    if (calls.length === 0) return;
    // Attempts count per stage: a stage's second call is its repair (or, for research, a continuation).
    const attempts = new Map<string, number>();
    await tx.insert(generationCall).values(
      calls.map((call, seq) => {
        const attempt = (attempts.get(call.stage) ?? 0) + 1;
        attempts.set(call.stage, attempt);
        return {
          usageId: row.id,
          seq,
          attempt,
          stage: call.stage,
          model: call.model,
          inputTokens: call.inputTokens,
          outputTokens: call.outputTokens,
          cacheReadTokens: call.cacheReadTokens,
          cacheWriteTokens: call.cacheWriteTokens,
          webSearches: call.webSearches,
          estimatedUsd: call.estimatedUsd.toFixed(4),
          durationMs: call.durationMs,
        };
      }),
    );
  });
}

/** A logged request with the email of the account that made it (null for guests and deleted accounts). */
export type GenerationSummary = typeof generationUsage.$inferSelect & { email: string | null };
export type GenerationCallRow = typeof generationCall.$inferSelect;

/** The most recent requests, newest first. */
export async function listGenerations(db: Database, limit = 100): Promise<GenerationSummary[]> {
  const rows = await db
    .select({ request: generationUsage, email: user.email })
    .from(generationUsage)
    .leftJoin(user, eq(user.id, generationUsage.userId))
    .orderBy(desc(generationUsage.createdAt), desc(generationUsage.id))
    .limit(limit);
  return rows.map((r) => ({ ...r.request, email: r.email }));
}

/** Live (paid) generation requests logged since `since`, for the daily spending cap. */
export async function countLiveGenerationsSince(db: Database, since: Date): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(generationUsage)
    .where(and(eq(generationUsage.mode, "live"), gte(generationUsage.createdAt, since)));
  return row.n;
}

/** Totals across every logged request, for the figures above the list. */
export async function generationTotals(db: Database) {
  const [row] = await db
    .select({
      requests: sql<number>`count(*)::int`,
      succeeded: sql<number>`count(*) filter (where ${generationUsage.status} = 'succeeded')::int`,
      inputTokens: sql<number>`coalesce(sum(${generationUsage.inputTokens}), 0)::int`,
      outputTokens: sql<number>`coalesce(sum(${generationUsage.outputTokens}), 0)::int`,
      cacheReadTokens: sql<number>`coalesce(sum(${generationUsage.cacheReadTokens}), 0)::int`,
      estimatedUsd: sql<string>`coalesce(sum(${generationUsage.estimatedUsd}), 0)::text`,
    })
    .from(generationUsage);
  return row;
}

/** One request with its calls in order, or null if there is no such request. */
export async function getGeneration(
  db: Database,
  id: number,
): Promise<{ request: GenerationSummary; calls: GenerationCallRow[] } | null> {
  const [row] = await db
    .select({ request: generationUsage, email: user.email })
    .from(generationUsage)
    .leftJoin(user, eq(user.id, generationUsage.userId))
    .where(eq(generationUsage.id, id));
  if (!row) return null;
  const request = { ...row.request, email: row.email };
  const calls = await db.select().from(generationCall).where(eq(generationCall.usageId, id)).orderBy(generationCall.seq);
  return { request, calls };
}
