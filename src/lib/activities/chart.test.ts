import { describe, expect, it } from "vitest";
import { niceScale } from "./chart";

describe("niceScale", () => {
  it("starts at zero and uses round steps", () => {
    expect(niceScale([3, 7, 12, 18])).toEqual({ min: 0, max: 20, step: 5, ticks: [0, 5, 10, 15, 20] });
    expect(niceScale([120, 340, 90])).toMatchObject({ min: 0, max: 400, step: 100 });
  });

  it("includes negative values, such as temperatures below zero", () => {
    const scale = niceScale([-6, 2, 11]);
    expect(scale.min).toBeLessThanOrEqual(-6);
    expect(scale.max).toBeGreaterThanOrEqual(11);
    expect(scale.ticks).toContain(0);
  });

  it("handles small decimals and all-zero data without odd ticks", () => {
    expect(niceScale([0.1, 0.2, 0.3]).ticks).toEqual([0, 0.1, 0.2, 0.3]);
    expect(niceScale([0, 0]).max).toBeGreaterThan(0);
  });
});
