/** USD per million tokens (input, output), used only to estimate the cost of each call. */
const PRICES: Record<string, [number, number]> = {
  "claude-fable-5-1": [10, 50],
  "claude-opus-5-5": [4, 20],
  "claude-opus-5": [5, 25],
  "claude-sonnet-5-5": [2, 10],
  "claude-sonnet-5": [2, 10],
  "claude-haiku-5-5": [0.1, 0.5],
  "claude-haiku-4-5": [1, 5],
};

/** Prompt cache pricing relative to the input price: writes (5-minute cache) cost more, reads much less. */
const CACHE_WRITE_MULTIPLIER = 1.25;
const CACHE_READ_MULTIPLIER = 0.1;

/** Web search is billed per search on top of tokens: $10 per 1,000 searches. */
const USD_PER_WEB_SEARCH = 0.01;

/** The token counts of one model call. `inputTokens` excludes cached input, as in the API's usage. */
export type CallTokens = {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  webSearches: number;
};

/** Estimated USD for one call. Unknown models count as free, so a missing price shows up as $0, not a guess. */
export function estimateUsd(model: string, tokens: CallTokens): number {
  const [inPrice, outPrice] = PRICES[model] ?? [0, 0];
  const input =
    tokens.inputTokens +
    tokens.cacheWriteTokens * CACHE_WRITE_MULTIPLIER +
    tokens.cacheReadTokens * CACHE_READ_MULTIPLIER;
  return (input * inPrice + tokens.outputTokens * outPrice) / 1_000_000 + tokens.webSearches * USD_PER_WEB_SEARCH;
}
