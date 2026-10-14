import { describe, expect, it } from "vitest";
import { estimateUsd } from "./cost";

const none = { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, webSearches: 0 };

describe("estimateUsd", () => {
  it("prices input and output per million tokens", () => {
    expect(estimateUsd("claude-sonnet-5-5", { ...none, inputTokens: 1_000_000, outputTokens: 100_000 })).toBeCloseTo(3);
  });

  it("charges cache writes at 1.25x and cache reads at 0.1x the input price", () => {
    expect(estimateUsd("claude-sonnet-5-5", { ...none, cacheWriteTokens: 1_000_000 })).toBeCloseTo(2.5);
    expect(estimateUsd("claude-sonnet-5-5", { ...none, cacheReadTokens: 1_000_000 })).toBeCloseTo(0.2);
  });

  it("adds a cent per web search, and counts unknown models as free rather than guessing", () => {
    expect(estimateUsd("claude-opus-5-5", { ...none, webSearches: 3 })).toBeCloseTo(0.03);
    expect(estimateUsd("some-new-model", { ...none, inputTokens: 1_000_000, webSearches: 1 })).toBeCloseTo(0.01);
  });
});
