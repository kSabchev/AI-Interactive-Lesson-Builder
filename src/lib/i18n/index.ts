import type { Locale } from "./config";
import { bg } from "./dictionaries/bg";
import { type Dictionary, en } from "./dictionaries/en";

export type { Dictionary };
export * from "./config";

const DICTIONARIES: Record<Locale, Dictionary> = { en, bg };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}
