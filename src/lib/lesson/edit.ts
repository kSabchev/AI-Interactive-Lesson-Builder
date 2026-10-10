/** Small immutable helpers for editing lesson drafts. */

export function replaceAt<T>(items: readonly T[], index: number, value: T): T[] {
  return items.map((item, i) => (i === index ? value : item));
}

export function removeAt<T>(items: readonly T[], index: number): T[] {
  return items.filter((_, i) => i !== index);
}

/** Optional text fields store `undefined` rather than an empty string. */
export function optionalText(value: string): string | undefined {
  return value === "" ? undefined : value;
}

export function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}
