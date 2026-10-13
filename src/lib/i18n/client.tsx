"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { type Dictionary, getDictionary, type Locale, LOCALE_COOKIE } from ".";

type LocaleContextValue = { locale: Locale; t: Dictionary; setLocale?: (locale: Locale) => void };

const LocaleContext = createContext<LocaleContextValue>({ locale: "en", t: getDictionary("en") });

const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * The interface language. The server resolves the first value from the cookie, so pages render in the right
 * language straight away; switching writes the cookie and refreshes server-rendered parts.
 */
export function LocaleProvider({ initialLocale, children }: { initialLocale: Locale; children: React.ReactNode }) {
  const router = useRouter();
  const [locale, setLocaleState] = useState(initialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback(
    (next: Locale) => {
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
      setLocaleState(next);
      router.refresh();
    },
    [router],
  );

  const value = useMemo(() => ({ locale, t: getDictionary(locale), setLocale }), [locale, setLocale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/**
 * Renders children in another language without changing the interface setting: learner-facing parts of a
 * lesson follow the lesson's language, whatever language the adult uses for the app.
 */
export function LocaleScope({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const parent = useContext(LocaleContext);
  const value = useMemo(() => ({ ...parent, locale, t: getDictionary(locale) }), [parent, locale]);
  return (
    <LocaleContext.Provider value={value}>
      <div lang={locale} className="contents">
        {children}
      </div>
    </LocaleContext.Provider>
  );
}

export function useT(): Dictionary {
  return useContext(LocaleContext).t;
}

export function useLocale() {
  const { locale, setLocale } = useContext(LocaleContext);
  return { locale, setLocale };
}
