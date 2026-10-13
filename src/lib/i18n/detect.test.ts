import { describe, expect, it } from "vitest";
import { cookieLocale, localeFromAcceptLanguage, resolveLocale } from "./config";
import { detectLanguage } from "./detect";

describe("detectLanguage", () => {
  it.each([
    ["Как работи кръговратът на водата", "bg"],
    ["How the water cycle works", "en"],
    ["Фотосинтеза", "bg"],
    ["DNA и гени", "bg"],
    ["Слънчевата система (solar system)", "bg"],
    ["Volcanoes", "en"],
    ["123", "en"],
  ])("%s → %s", (topic, expected) => {
    expect(detectLanguage(topic)).toBe(expected);
  });
});

describe("locale resolution", () => {
  it("prefers the cookie, then the browser's languages", () => {
    expect(resolveLocale("bg", "en-US,en;q=0.9")).toBe("bg");
    expect(resolveLocale(undefined, "bg-BG,bg;q=0.9,en;q=0.8")).toBe("bg");
    expect(resolveLocale(undefined, "de-DE,de;q=0.9")).toBe("en");
    expect(resolveLocale("fr", "en-GB")).toBe("en");
    expect(localeFromAcceptLanguage("en;q=0.5, bg;q=0.8")).toBe("bg");
  });

  it("reads the cookie from a raw header", () => {
    expect(cookieLocale("theme=dark; locale=bg; other=1")).toBe("bg");
    expect(cookieLocale("xlocale=bg")).toBeUndefined();
    expect(cookieLocale(null)).toBeUndefined();
  });
});
