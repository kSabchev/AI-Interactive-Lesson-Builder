import { SAMPLE_LESSONS } from "@/content/samples";
import type { Dictionary } from "@/lib/i18n";
import type { Lesson } from "@/lib/lesson/schema";
import type { GenerationInput } from "./input";

/** Words that point a topic at one of the curated lessons. */
const KEYWORDS: Record<string, string[]> = {
  "sample-water-cycle": [
    "water",
    "rain",
    "cloud",
    "evaporat",
    "condens",
    "precipit",
    "weather",
    "puddle",
    "river",
    "ocean",
    "вод",
    "дъжд",
    "облак",
    "изпар",
    "кондензац",
    "валеж",
    "времет",
    "локв",
    "рек",
    "океан",
    "кръговрат",
  ],
  "sample-solar-system": [
    "sun",
    "planet",
    "solar",
    "space",
    "orbit",
    "moon",
    "star",
    "earth",
    "day",
    "night",
    "year",
    "слънц",
    "слънч",
    "планет",
    "космос",
    "орбит",
    "луна",
    "звезд",
    "земя",
    "ден",
    "нощ",
    "годин",
  ],
  "sample-photosynthesis": [
    "plant",
    "photosynth",
    "leaf",
    "leaves",
    "tree",
    "oxygen",
    "carbon",
    "chlorophyll",
    "seed",
    "flower",
    "light",
    "grow",
    "растени",
    "фотосинтез",
    "лист",
    "дърв",
    "кислород",
    "въглерод",
    "хлорофил",
    "семе",
    "цвет",
    "светлин",
  ],
};

function bestMatch(topic: string): { lesson: Lesson; matched: boolean } {
  const words = topic
    .toLowerCase()
    .split(/[^\p{L}]+/u)
    .filter(Boolean);
  // Short keywords must start a word ("day" shouldn't match "today"); longer ones may sit inside one ("sunlight").
  const matches = (word: string, keyword: string) =>
    keyword.length < 4 ? word.startsWith(keyword) : word.includes(keyword);

  let best = { lesson: SAMPLE_LESSONS[0], score: 0 };
  for (const lesson of SAMPLE_LESSONS) {
    const keywords = KEYWORDS[lesson.id] ?? [];
    const score = words.filter((word) => keywords.some((k) => matches(word, k))).length;
    if (score > best.score) best = { lesson, score };
  }
  return { lesson: best.lesson, matched: best.score > 0 };
}

/**
 * Sample mode: no AI call. Returns a copy of the closest curated lesson and says so plainly,
 * so a demo never passes off a canned lesson as one generated for the requested topic.
 */
export function sampleLesson(
  input: GenerationInput,
  id: string,
  now: string,
  t: Dictionary,
): { lesson: Lesson; notice: string } {
  const { lesson, matched } = bestMatch(input.topic);
  const notice = matched
    ? t.generation.sampleMatched(lesson.title, input.topic)
    : t.generation.sampleUnmatched(lesson.title, input.topic);
  return { lesson: { ...structuredClone(lesson), id, createdAt: now, updatedAt: now }, notice };
}
