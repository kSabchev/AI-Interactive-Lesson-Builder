import { describe, expect, it } from "vitest";
import { AGE_GROUPS, DURATIONS } from "@/lib/lesson/schema";
import { bg } from "@/lib/i18n/dictionaries/bg";
import { en } from "@/lib/i18n/dictionaries/en";
import { generationInputSchema } from "./input";
import { detectLanguage } from "@/lib/i18n/detect";
import { nextExampleTopic } from "./examples";

const topics = ["A topic", "B topic", "C topic"];

describe("nextExampleTopic", () => {
  it("steps through the list and wraps round", () => {
    expect(nextExampleTopic(topics, "A topic")).toBe("B topic");
    expect(nextExampleTopic(topics, "C topic")).toBe("A topic");
  });

  it("starts from the first topic when the current one isn't in the list", () => {
    expect(nextExampleTopic(topics, "")).toBe("A topic");
    expect(nextExampleTopic(topics, "Something typed by hand")).toBe("A topic");
  });
});

describe("example topics", () => {
  for (const [name, t, language] of [
    ["English", en, "en"],
    ["Bulgarian", bg, "bg"],
  ] as const) {
    it(`${name}: every age and length has several distinct, valid topics in that language`, () => {
      for (const age of AGE_GROUPS) {
        for (const minutes of DURATIONS) {
          const list = t.create.exampleTopics[age][String(minutes) as "10" | "15" | "25"];
          expect(list.length).toBeGreaterThanOrEqual(5);
          expect(new Set(list).size).toBe(list.length);
          for (const topic of list) {
            expect(generationInputSchema.safeParse({ topic, ageGroup: age, durationMinutes: minutes }).success).toBe(
              true,
            );
            expect(detectLanguage(topic)).toBe(language);
          }
        }
      }
    });
  }
});
