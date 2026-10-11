"use client";

import Link from "next/link";
import { useStore } from "@/lib/storage/StoreProvider";

const linkClass = "rounded-full px-3 py-2 font-bold text-muted hover:bg-brand-50 hover:text-ink";

export function AppHeader() {
  const state = useStore();
  return (
    <header className="border-b border-line bg-surface/70">
      <nav aria-label="Main" className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-3 md:px-8">
        <Link href="/" className="mr-auto text-lg font-extrabold text-brand-700">
          Lesson Builder
        </Link>
        <Link href="/create" className={linkClass}>
          Create
        </Link>
        <Link href="/pricing" className={linkClass}>
          Pricing
        </Link>
        {state.status === "loading" ? (
          <span className="w-20" aria-hidden="true" />
        ) : state.user ? (
          <Link href="/account" className={linkClass} title={state.user.email}>
            Account
          </Link>
        ) : (
          <Link href="/sign-in" className="rounded-full bg-brand-600 px-4 py-2 font-bold text-white hover:bg-brand-700">
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}
