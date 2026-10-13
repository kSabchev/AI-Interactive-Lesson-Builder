import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { AppHeader } from "@/components/account/AppHeader";
import { intlLocale } from "@/lib/i18n";
import { getLocale, getT } from "@/lib/i18n/server";
import { isDevMailboxEnabled, readDevMailbox } from "@/lib/server/email";

export const metadata: Metadata = { title: "Development mailbox — Lesson Builder", robots: { index: false } };

/** Lists emails the app "sent" during local development, so sign-in links can be opened without a provider. */
async function Mailbox() {
  await connection();
  if (!isDevMailboxEnabled()) notFound();
  const [emails, t, locale] = await Promise.all([readDevMailbox(), getT(), getLocale()]);
  const timeFormat = new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "medium", timeStyle: "medium" });

  if (emails.length === 0) {
    return <p className="text-muted">{t.devMailbox.empty}</p>;
  }
  return (
    <ol className="space-y-3">
      {emails.map((email) => (
        <li key={`${email.sentAt}-${email.to}`} className="rounded-3xl bg-surface p-5 shadow-sm ring-1 ring-line">
          <p className="text-sm text-muted">
            {timeFormat.format(new Date(email.sentAt))} · {t.devMailbox.to}{" "}
            <strong className="text-ink">{email.to}</strong>
          </p>
          <p className="mt-1 font-bold">{email.subject}</p>
          {email.url && (
            <a
              href={email.url}
              className="mt-3 inline-block rounded-full bg-brand-600 px-4 py-2 font-bold text-white hover:bg-brand-700"
            >
              {t.devMailbox.openLink}
            </a>
          )}
        </li>
      ))}
    </ol>
  );
}

export default async function DevMailboxPage() {
  // Production builds don't include this route at all (see pageExtensions in next.config.ts); this is a backstop.
  if (process.env.NODE_ENV === "production") notFound();
  const t = await getT();
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
        <h1 className="text-3xl font-extrabold">{t.devMailbox.title}</h1>
        <p className="mt-2 mb-6 text-muted">{t.devMailbox.intro}</p>
        <Suspense fallback={<p className="text-muted">{t.common.loading}</p>}>
          <Mailbox />
        </Suspense>
      </main>
    </>
  );
}
