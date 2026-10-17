import Link from "next/link";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import { getT } from "@/lib/i18n/server";
import { isOperator } from "@/lib/server/admin";
import { getSessionUser, type SessionUser } from "@/lib/server/auth";

/** Renders `children(user)` for site operators, and an explanation for everyone else. Use inside <Suspense>. */
export async function OperatorGate({ children }: { children: (user: SessionUser) => ReactNode | Promise<ReactNode> }) {
  const [user, t] = await Promise.all([headers().then(getSessionUser), getT()]);
  if (!user) {
    return (
      <p className="text-muted">
        <Link href="/sign-in" className="font-bold text-brand-700 underline underline-offset-2">
          {t.common.signIn}
        </Link>
        {" · "}
        {t.generationLog.signIn}
      </p>
    );
  }
  if (!isOperator(user)) return <p className="text-muted">{t.generationLog.forbidden}</p>;
  return children(user);
}
