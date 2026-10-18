import type { Instrumentation } from "next";

/** On server start: clear out error reports past their retention period. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const [{ getDb }, { pruneErrors }] = await Promise.all([import("@/lib/server/db"), import("@/lib/server/errors")]);
  await pruneErrors(await getDb()).catch((error) => console.error("[error] couldn't prune old error reports:", error));
}

/** Server errors Next.js catches (pages, route handlers, server actions) go to the operator error log. */
export const onRequestError: Instrumentation.onRequestError = async (error, request) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { reportError } = await import("@/lib/server/errors");
  const digest =
    typeof error === "object" && error !== null && "digest" in error ? String((error as { digest: unknown }).digest) : undefined;
  await reportError({ source: "request", error, path: request.path, method: request.method, digest });
};
