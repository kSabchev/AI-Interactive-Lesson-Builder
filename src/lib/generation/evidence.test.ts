import { describe, expect, it } from "vitest";
import { excerptsFromCitations, formatExcerpts, splitReference } from "./evidence";

describe("splitReference", () => {
  it("merges short paragraphs and numbers the excerpts", () => {
    const excerpts = splitReference("Magnets attract iron.\n\nThey have two poles.\n\n\nLike poles repel.");
    expect(excerpts).toEqual([
      {
        id: "ref-1",
        title: "Your reference material, part 1",
        text: "Magnets attract iron. They have two poles. Like poles repel.",
      },
    ]);
  });

  it("keeps every excerpt within the source excerpt limit, breaking at sentences", () => {
    const sentence = "Volcanoes form where molten rock called magma reaches the surface of the Earth. ";
    const excerpts = splitReference(sentence.repeat(60));
    expect(excerpts.length).toBeGreaterThan(3);
    for (const e of excerpts) {
      expect(e.text.length).toBeLessThanOrEqual(1000);
      expect(e.text.endsWith(".")).toBe(true);
    }
    expect(excerpts.map((e) => e.id).slice(0, 2)).toEqual(["ref-1", "ref-2"]);
  });
});

describe("excerptsFromCitations", () => {
  it("dedupes quotes, keeps the page title and URL, and drops unusable links", () => {
    const excerpts = excerptsFromCitations([
      { url: "https://science.nasa.gov/sun/", title: "The Sun", citedText: "The Sun is a star." },
      { url: "https://science.nasa.gov/sun/", title: "The Sun", citedText: "The  Sun is a star. " },
      { url: "javascript:alert(1)", title: "Bad", citedText: "x" },
      { url: "not a url", title: null, citedText: "y" },
      { url: "https://example.org/planets", title: null, citedText: "Eight planets orbit the Sun." },
    ]);
    expect(excerpts).toEqual([
      { id: "web-1", title: "The Sun", text: "The Sun is a star.", url: "https://science.nasa.gov/sun/" },
      { id: "web-2", title: "example.org", text: "Eight planets orbit the Sun.", url: "https://example.org/planets" },
    ]);
  });
});

describe("formatExcerpts", () => {
  it("tags each excerpt with its id", () => {
    expect(formatExcerpts([{ id: "ref-1", title: 'A "quoted" title', text: "Text." }])).toBe(
      '<excerpt id="ref-1" source="A \'quoted\' title">\nText.\n</excerpt>',
    );
  });
});
