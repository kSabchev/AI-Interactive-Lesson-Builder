/** A chart's value axis: from `min` to `max` in steps of `step`, with `ticks` at each step. */
export type Scale = { min: number; max: number; step: number; ticks: number[] };

/**
 * A readable axis for these values: it always includes zero, so bars and lines aren't exaggerated, and its
 * steps are 1, 2 or 5 times a power of ten, with about five of them.
 */
export function niceScale(values: number[], target = 5): Scale {
  const low = Math.min(0, ...values);
  // All values equal to zero would give an axis with no height; give it one unit.
  const high = Math.max(0, ...values) === low ? low + 1 : Math.max(0, ...values);
  const span = high - low;
  const raw = span / target;
  const power = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * power).find((s) => s >= raw) ?? 10 * power;
  const min = Math.floor(low / step) * step;
  const max = Math.ceil(high / step) * step;
  const ticks: number[] = [];
  // Rounded so 0.1 + 0.2 shows as 0.3.
  for (let v = min; v <= max + step / 2; v += step) ticks.push(Number(v.toFixed(10)));
  return { min, max, step, ticks };
}
