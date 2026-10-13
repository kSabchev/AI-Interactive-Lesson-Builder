"use client";

import Link from "next/link";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { useT } from "@/lib/i18n/client";
import { useStore } from "@/lib/storage/StoreProvider";

const linkClass = "rounded-full px-2 py-2 font-bold text-muted hover:bg-brand-50 hover:text-ink sm:px-3";

export function AppHeader() {
  const state = useStore();
  const t = useT();
  return (
    <header className="border-b border-line bg-surface/70">
      {/* Wraps on narrow screens: Bulgarian labels are longer than English ones. */}
      <nav
        aria-label={t.header.nav}
        className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-1 gap-y-2 px-4 py-3 sm:gap-x-2 md:px-8"
      >
        <Link href="/" className="mr-auto text-lg font-extrabold text-brand-700">
          {t.common.appName}
        </Link>
        <Link href="/create" className={linkClass}>
          {t.header.create}
        </Link>
        <Link href="/pricing" className={linkClass}>
          {t.header.pricing}
        </Link>
        {state.status === "loading" ? (
          <span className="w-20" aria-hidden="true" />
        ) : state.user ? (
          <Link href="/account" className={linkClass} title={state.user.email}>
            {t.header.account}
          </Link>
        ) : (
          <Link
            href="/sign-in"
            className="rounded-full bg-brand-600 px-3 py-2 font-bold whitespace-nowrap text-white hover:bg-brand-700 sm:px-4"
          >
            {t.common.signIn}
          </Link>
        )}
        <LanguageToggle />
      </nav>
    </header>
  );
}
