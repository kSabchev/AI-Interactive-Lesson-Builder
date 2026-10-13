"use client";

import { useCallback, useEffect, useState } from "react";
import { useStore } from "@/lib/storage/StoreProvider";
import type { BillingStatus } from "./status";

export type BillingLookup = { status: "loading" } | { status: "ready"; billing: BillingStatus } | { status: "error" };

/** The caller's plan and usage. Refetches when the signed-in user changes. */
export function useBilling() {
  const state = useStore();
  const userKey = state.status === "ready" ? (state.user?.id ?? "guest") : undefined;
  const [result, setResult] = useState<{ key: string; value: BillingLookup }>();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!userKey) return;
    let cancelled = false;
    fetch("/api/billing/status", { credentials: "same-origin" })
      .then((r) => (r.ok ? (r.json() as Promise<BillingStatus>) : Promise.reject(new Error(String(r.status)))))
      .then(
        (billing) => !cancelled && setResult({ key: userKey, value: { status: "ready", billing } }),
        () => !cancelled && setResult({ key: userKey, value: { status: "error" } }),
      );
    return () => {
      cancelled = true;
    };
  }, [userKey, version]);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  const lookup: BillingLookup = userKey && result?.key === userKey ? result.value : { status: "loading" };
  return { lookup, refresh };
}

/** Posts to a billing endpoint that answers with a Stripe URL, then sends the browser there. */
export async function redirectToStripe(path: "/api/billing/checkout" | "/api/billing/portal", body?: unknown) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
    credentials: "same-origin",
  });
  const data = (await response.json().catch(() => null)) as { url?: string; error?: { message?: string } } | null;
  if (!response.ok || !data?.url) throw new Error(data?.error?.message ?? "");
  window.location.assign(data.url);
}
