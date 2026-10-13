import "server-only";
import { cookies, headers } from "next/headers";
import { cookieLocale, type Dictionary, getDictionary, type Locale, LOCALE_COOKIE, resolveLocale } from ".";

/** The interface locale for this request (cookie first, then the browser's languages). Request-time only. */
export async function getLocale(): Promise<Locale> {
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()]);
  return resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value, headerList.get("accept-language"));
}

export async function getT(): Promise<Dictionary> {
  return getDictionary(await getLocale());
}

/** For route handlers, which get the raw request. */
export function localeFromRequest(request: Request): Locale {
  return resolveLocale(cookieLocale(request.headers.get("cookie")), request.headers.get("accept-language"));
}
