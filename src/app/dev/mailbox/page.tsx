import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { AppHeader } from "@/components/account/AppHeader";
import { isDevMailboxEnabled, readDevMailbox } from "@/lib/server/email";

export const metadata: Metadata = { title: "Development mailbox — Lesson Builder", robots: { index: false } };

const timeFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "medium" });

/** Lists emails the app "sent" during local development, so sign-in links can be opened without a provider. */
async function Mailbox() {
  await connection();
  if (!isDevMailboxEnabled()) notFound();
  const emails = await readDevMailbox();

  if (emails.length === 0) {
    return <p className="text-muted">No emails yet. Request a sign-in link and refresh this page.</p>;
  }
  return (
    <ol className="space-y-3">
      {emails.map((email) => (
        <li key={`${email.sentAt}-${email.to}`} className="rounded-3xl bg-surface p-5 shadow-sm ring-1 ring-line">
          <p className="text-sm text-muted">
            {timeFormat.format(new Date(email.sentAt))} · to <strong className="text-ink">{email.to}</strong>
          </p>
          <p className="mt-1 font-bold">{email.subject}</p>
          {email.url && (
            <a
              href={email.url}
              className="mt-3 inline-block rounded-full bg-brand-600 px-4 py-2 font-bold text-white hover:bg-brand-700"
            >
              Open link
            </a>
          )}
        </li>
      ))}
    </ol>
  );
}

export default function DevMailboxPage() {
  // Production builds fix NODE_ENV at build time, so this route is a plain 404 there, before anything streams.
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
        <h1 className="text-3xl font-extrabold">Development mailbox</h1>
        <p className="mt-2 mb-6 text-muted">
          Emails aren&apos;t really sent while developing; they&apos;re kept here instead. This page doesn&apos;t
          exist in production. Links work once and expire after 15 minutes.
        </p>
        <Suspense fallback={<p className="text-muted">Loading…</p>}>
          <Mailbox />
        </Suspense>
      </main>
    </>
  );
}
