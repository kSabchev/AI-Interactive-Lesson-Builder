"use client";

import { cn } from "@/lib/cn";
import { LOCALES } from "@/lib/i18n";
import { useLocale, useT } from "@/lib/i18n/client";

/** EN | БГ switch for the interface language. */
export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  const t = useT();
  return (
    <div role="group" aria-label={t.language.label} className={cn("inline-flex rounded-full bg-paper p-0.5 ring-1 ring-line", className)}>
      {LOCALES.map((option) => (
        <button
          key={option}
          type="button"
          lang={option}
          aria-pressed={locale === option}
          aria-label={t.language.switchTo[option]}
          onClick={() => locale !== option && setLocale?.(option)}
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-extrabold",
            locale === option ? "bg-brand-600 text-white" : "text-muted hover:text-ink",
          )}
        >
          {t.language.short[option]}
        </button>
      ))}
    </div>
  );
}
