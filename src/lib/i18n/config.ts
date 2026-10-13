/** Interface languages. Lesson content has its own language (see `detectLanguage`). */
export const LOCALES = ["en", "bg"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "locale";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** The locale used with `Intl` formatters for dates and numbers. */
export function intlLocale(locale: Locale): string {
  return locale === "bg" ? "bg-BG" : "en-GB";
}

/** Picks Bulgarian if the browser prefers it over English; otherwise the default. */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE;
  const preferences = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { lang: tag.toLowerCase().split("-")[0], q: q ? Number(q) : 1 };
    })
    .filter((p) => !Number.isNaN(p.q))
    .sort((a, b) => b.q - a.q);
  const match = preferences.find((p) => isLocale(p.lang));
  return match && isLocale(match.lang) ? match.lang : DEFAULT_LOCALE;
}

/** Resolves the interface locale from the cookie, falling back to the browser's languages. */
export function resolveLocale(cookieValue: string | undefined, acceptLanguage: string | null | undefined): Locale {
  return isLocale(cookieValue) ? cookieValue : localeFromAcceptLanguage(acceptLanguage);
}

/** Reads the locale cookie from a raw `Cookie` header (route handlers). */
export function cookieLocale(cookieHeader: string | null | undefined): string | undefined {
  for (const part of cookieHeader?.split(";") ?? []) {
    const [name, ...value] = part.trim().split("=");
    if (name === LOCALE_COOKIE) return value.join("=");
  }
  return undefined;
}
