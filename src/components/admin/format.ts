import { intlLocale, type Locale } from "@/lib/i18n";

/** Number, cost and duration formatting for the operator pages, in the interface language. */
export function logFormat(locale: Locale) {
  const tag = intlLocale(locale);
  const count = new Intl.NumberFormat(tag);
  const usd = new Intl.NumberFormat(tag, { style: "currency", currency: "USD", minimumFractionDigits: 4, maximumFractionDigits: 4 });
  const seconds = new Intl.NumberFormat(tag, { maximumFractionDigits: 1 });
  const when = new Intl.DateTimeFormat(tag, { dateStyle: "medium", timeStyle: "short" });
  return {
    count: (n: number) => count.format(n),
    usd: (n: number | string) => usd.format(Number(n)),
    duration: (ms: number | null) => (ms === null ? "—" : `${seconds.format(ms / 1000)} s`),
    when: (date: Date) => when.format(date),
  };
}
