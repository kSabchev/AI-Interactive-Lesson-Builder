import "server-only";
import { getSessionUser, type SessionUser } from "./auth";

export function jsonError(status: number, message: string) {
  return Response.json({ error: { message } }, { status });
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
  const raw = await request.text();
  if (raw.length > maxBytes) return { error: jsonError(413, "That request is too large.") };
  try {
    return { body: JSON.parse(raw) };
  } catch {
    return { error: jsonError(400, "The request couldn't be read.") };
  }
}

/** Resolves the signed-in user for an API route, or the error response to return. */
export async function requireUser(request: Request): Promise<{ user: SessionUser } | { error: Response }> {
  if (request.method !== "GET" && !isSameOrigin(request)) {
    return { error: jsonError(403, "Cross-site requests aren't allowed.") };
  }
  const user = await getSessionUser(request.headers);
  return user ? { user } : { error: jsonError(401, "Sign in to continue.") };
}
