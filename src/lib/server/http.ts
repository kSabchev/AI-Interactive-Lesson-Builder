import "server-only";
import { type Dictionary, getDictionary } from "@/lib/i18n";
import { localeFromRequest } from "@/lib/i18n/server";
import { getSessionUser, type SessionUser } from "./auth";

/** The interface dictionary for whoever sent this request, for user-facing error messages. */
export function requestT(request: Request): Dictionary {
  return getDictionary(localeFromRequest(request));
}

export function jsonError(status: number, message: string, code?: string) {
  return Response.json({ error: code ? { code, message } : { message } }, { status });
}

/**
 * Rejects cross-site writes. Browsers send `Origin` on every cross-origin request and on same-origin
 * POST/PUT/DELETE, so a mismatch means another site is trying to act with the user's cookies.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Reads a JSON body up to `maxBytes`, or returns an error response. */
export async function readJson(request: Request, maxBytes: number): Promise<{ body: unknown } | { error: Response }> {
  const t = requestT(request);
  const raw = await request.text();
  if (raw.length > maxBytes) return { error: jsonError(413, t.server.tooLarge) };
  try {
    return { body: JSON.parse(raw) };
  } catch {
    return { error: jsonError(400, t.server.unreadable) };
  }
}

/** Resolves the signed-in user for an API route, or the error response to return. */
export async function requireUser(request: Request): Promise<{ user: SessionUser } | { error: Response }> {
  const t = requestT(request);
  if (request.method !== "GET" && !isSameOrigin(request)) {
    return { error: jsonError(403, t.server.crossSite) };
  }
  const user = await getSessionUser(request.headers);
  return user ? { user } : { error: jsonError(401, t.server.signInToContinue) };
}
