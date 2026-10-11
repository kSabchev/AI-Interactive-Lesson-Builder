/**
 * Evidence a lesson is built from: numbered excerpts the model must cite by id. Reference text and web
 * research both become excerpts, so the rest of the pipeline treats them the same way. Excerpt text and
 * URLs always come from the user's material or from the search tool's citations, never from the model.
 */

export type Excerpt = { id: string; title: string; text: string; url?: string };

/** Short enough to quote in a source card, long enough to carry a few facts. */
const EXCERPT_TARGET = 700;
const EXCERPT_MAX = 1000;
const MAX_EXCERPTS = 40;
const MAX_WEB_EXCERPTS = 12;

function hardWrap(text: string, max: number): string[] {
  const pieces: string[] = [];
  let rest = text;
  while (rest.length > max) {
    // Break at the last sentence end (or space) before the limit.
    const window = rest.slice(0, max);
    const cut = Math.max(window.lastIndexOf(". "), window.lastIndexOf("? "), window.lastIndexOf("! "));
    const at = cut > max * 0.5 ? cut + 1 : window.lastIndexOf(" ") > 0 ? window.lastIndexOf(" ") : max;
    pieces.push(rest.slice(0, at).trim());
    rest = rest.slice(at).trim();
  }
  if (rest) pieces.push(rest);
  return pieces;
}

/** Splits pasted material into paragraph-based excerpts `ref-1`, `ref-2`, … */
export function splitReference(text: string): Excerpt[] {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .flatMap((p) => hardWrap(p, EXCERPT_MAX));

  const chunks: string[] = [];
  for (const paragraph of paragraphs) {
    const last = chunks.at(-1);
    if (last !== undefined && last.length + paragraph.length + 1 <= EXCERPT_TARGET) {
      chunks[chunks.length - 1] = `${last} ${paragraph}`;
    } else {
      chunks.push(paragraph);
    }
  }

  return chunks.slice(0, MAX_EXCERPTS).map((chunk, i) => ({
    id: `ref-${i + 1}`,
    title: `Your reference material, part ${i + 1}`,
    text: chunk,
  }));
}

export type WebCitation = { url: string; title: string | null; citedText: string };

/** Turns web search citations into excerpts `web-1`, `web-2`, … keeping only http(s) URLs and unique quotes. */
export function excerptsFromCitations(citations: WebCitation[]): Excerpt[] {
  const seen = new Set<string>();
  const excerpts: Excerpt[] = [];
  for (const citation of citations) {
    let url: URL;
    try {
      url = new URL(citation.url);
    } catch {
      continue;
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") continue;
    const text = citation.citedText.replace(/\s+/g, " ").trim();
    const key = `${url.href}\n${text}`;
    if (!text || seen.has(key)) continue;
    seen.add(key);
    excerpts.push({
      id: `web-${excerpts.length + 1}`,
      title: (citation.title?.trim() || url.hostname).slice(0, 150),
      text: text.length > EXCERPT_MAX ? `${text.slice(0, EXCERPT_MAX - 1).trimEnd()}…` : text,
      url: url.href,
    });
    if (excerpts.length >= MAX_WEB_EXCERPTS) break;
  }
  return excerpts;
}

/** How excerpts are shown to the model: tagged and clearly marked as data, not instructions. */
export function formatExcerpts(excerpts: Excerpt[]): string {
  return excerpts
    .map((e) => `<excerpt id="${e.id}" source="${e.title.replace(/"/g, "'")}">\n${e.text}\n</excerpt>`)
    .join("\n");
}
