import "server-only";
import { desc, lt } from "drizzle-orm";
import { getDb, type Database } from "./db";
import { appError } from "./db/schema";

/** How long error reports are kept. The privacy notice states this too. */
export const ERROR_RETENTION_DAYS = 30;
/** At most this many webhook alerts per hour, so an outage doesn't flood the channel. */
const ALERTS_PER_HOUR = 10;
const MAX_MESSAGE = 1_000;
const MAX_STACK = 4_000;

export type ErrorReport = {
  source: "request" | "auth" | "generation";
  error: unknown;
  path?: string;
  method?: string;
  digest?: string;
};

export type AppErrorRow = typeof appError.$inferSelect;

function describe(error: unknown): { message: string; stack: string | null } {
  if (error instanceof Error) {
    return { message: error.message.slice(0, MAX_MESSAGE) || error.name, stack: error.stack?.slice(0, MAX_STACK) ?? null };
  }
  return { message: String(error).slice(0, MAX_MESSAGE), stack: null };
}

const alertTimes: number[] = [];

/**
 * Posts a short alert to `ERROR_ALERT_WEBHOOK_URL` if it's set. The body has both `text` (Slack) and
 * `content` (Discord), so either kind of incoming webhook works. Limited to a few alerts an hour.
 */
async function sendAlert(report: ErrorReport, message: string, now = Date.now()): Promise<void> {
  const url = process.env.ERROR_ALERT_WEBHOOK_URL;
  if (!url) return;
  while (alertTimes.length && now - alertTimes[0] > 60 * 60 * 1000) alertTimes.shift();
  if (alertTimes.length >= ALERTS_PER_HOUR) return;
  alertTimes.push(now);
  const where = report.path ? ` ${report.method ?? ""} ${report.path}`.trimEnd() : "";
  const text = `Lesson Builder error (${report.source}${where}): ${message.slice(0, 300)}`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, content: text }),
    signal: AbortSignal.timeout(5_000),
  });
}

/**
 * Records a server error: printed to the server log, saved for the operator error log, and optionally sent
 * as an alert. Never throws, so reporting an error can't cause another one.
 */
export async function reportError(report: ErrorReport, db?: Database): Promise<void> {
  const { message, stack } = describe(report.error);
  console.error(`[error] ${report.source}${report.path ? ` ${report.path}` : ""}:`, report.error);
  try {
    const database = db ?? (await getDb());
    await database.insert(appError).values({
      source: report.source,
      message,
      stack,
      path: report.path?.slice(0, 500) ?? null,
      method: report.method ?? null,
      digest: report.digest ?? null,
    });
    await pruneErrors(database);
  } catch (saveError) {
    console.error("[error] couldn't save the error report:", saveError);
  }
  try {
    await sendAlert(report, message);
  } catch (alertError) {
    console.error("[error] couldn't send the error alert:", alertError);
  }
}

/** Deletes reports older than the retention period. Runs on each new report and when the server starts. */
export async function pruneErrors(db: Database, now = new Date()): Promise<void> {
  const cutoff = new Date(now.getTime() - ERROR_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  await db.delete(appError).where(lt(appError.createdAt, cutoff));
}

/** The most recent errors, newest first. */
export async function listErrors(db: Database, limit = 100): Promise<AppErrorRow[]> {
  return db.select().from(appError).orderBy(desc(appError.createdAt), desc(appError.id)).limit(limit);
}

export function resetAlertsForTests() {
  alertTimes.length = 0;
}
