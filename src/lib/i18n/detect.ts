import type { Locale } from "./config";

/**
 * Guesses the language of a lesson topic from its script: mostly Cyrillic means Bulgarian, otherwise English.
 * The interface only offers these two, so a script check is enough and works for very short topics.
 */
export function detectLanguage(text: string): Locale {
  let cyrillic = 0;
  let latin = 0;
  for (const char of text) {
    if (/\p{Script=Cyrillic}/u.test(char)) cyrillic++;
    else if (/\p{Script=Latin}/u.test(char)) latin++;
  }
  return cyrillic > latin ? "bg" : "en";
}

export const LANGUAGE_NAMES: Record<Locale, { en: string; native: string }> = {
  en: { en: "English", native: "English" },
  bg: { en: "Bulgarian", native: "български" },
};
