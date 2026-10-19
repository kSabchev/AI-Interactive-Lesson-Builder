import type { SectionOfType } from "./schema";

/**
 * Words that mean an experiment isn't safe for children to watch or join at home or in class: fire and heat,
 * sharp blades, strong chemicals, mains electricity. Checked on generated experiments on top of the prompt's
 * own safety rules; a match sends the content back to the model for one repair.
 *
 * English terms match whole words (with a plural ending), so "firefly" or "hobby" don't count. Bulgarian
 * changes word endings a lot, so it uses stems chosen not to catch harmless words (no bare "нож", which
 * would also catch "ножица", scissors).
 */
const ENGLISH = [
  "candle", "matches", "matchstick", "lighter", "flame", "fire", "stove", "hob", "boiling", "oven", "blowtorch",
  "knife", "knives", "blade", "razor", "scalpel",
  "bleach", "ammonia", "hydrochloric", "sulphuric", "sulfuric", "caustic", "lye", "drain cleaner", "dry ice",
  "mains", "plug socket", "power socket", "wall socket",
];
const BULGARIAN_STEMS = [
  "свещ", "кибрит", "запалк", "пламъ", "огън", "огъня", "огньо", "котлон", "печк", "врящ", "вряла", "фурн",
  "ножа", "ножът", "ножове", "острие", "острието", "бръснач", "скалпел",
  "белин", "амоняк", "солна киселина", "сярна киселина", "сода каустик", "сух лед",
  "електрически контакт", "щепсел",
];

const NOT_LETTER = "[^\\p{L}]";
const english = `(?:^|${NOT_LETTER})(${ENGLISH.join("|")})(?:e?s)?(?=$|${NOT_LETTER})`;
const bulgarian = `(?:^|${NOT_LETTER})(${BULGARIAN_STEMS.join("|")})`;

/** The unsafe terms an experiment mentions in its materials or steps, without duplicates. */
export function unsafeExperimentTerms(
  experiment: Pick<SectionOfType<"experiment">, "materials" | "steps">,
): string[] {
  const found = new Set<string>();
  for (const line of [...experiment.materials, ...experiment.steps]) {
    for (const source of [english, bulgarian]) {
      for (const match of line.matchAll(new RegExp(source, "giu"))) found.add(match[1].toLowerCase());
    }
  }
  return [...found];
}
