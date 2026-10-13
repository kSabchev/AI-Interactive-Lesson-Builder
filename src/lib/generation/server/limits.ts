import "server-only";

/**
 * In-memory rate limits. They hold within one server process only, which is enough for local use and a
 * single instance; a multi-instance deployment needs shared storage (planned for launch readiness).
 * This is also the hook where per-account plan quotas will plug in.
 */

const visitorHits = new Map<string, number[]>();
let daily = { day: "", count: 0 };

export type LimitResult =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number; reason: "visitor" | "daily"; limit: number };

export function checkVisitorLimit(visitor: string, limit: number, windowMs: number, now = Date.now()): LimitResult {
  const recent = (visitorHits.get(visitor) ?? []).filter((t) => now - t < windowMs);
  visitorHits.set(visitor, recent);
  if (recent.length < limit) return { ok: true };
  return {
    ok: false,
    retryAfterSeconds: Math.ceil((recent[0] + windowMs - now) / 1000),
    reason: "visitor",
    limit,
  };
}

export function checkDailyCap(cap: number, now = new Date()): LimitResult {
  const day = now.toISOString().slice(0, 10);
  if (daily.day !== day) daily = { day, count: 0 };
  if (daily.count < cap) return { ok: true };
  const midnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return {
    ok: false,
    retryAfterSeconds: Math.ceil((midnight - now.getTime()) / 1000),
    reason: "daily",
    limit: cap,
  };
}

/** Counts a generation against both limits. Called when a generation starts, so failed runs still count. */
export function recordGeneration(visitor: string, now = new Date()) {
  visitorHits.set(visitor, [...(visitorHits.get(visitor) ?? []), now.getTime()]);
  const day = now.toISOString().slice(0, 10);
  daily = daily.day === day ? { day, count: daily.count + 1 } : { day, count: 1 };
}

export function resetLimitsForTests() {
  visitorHits.clear();
  daily = { day: "", count: 0 };
}
