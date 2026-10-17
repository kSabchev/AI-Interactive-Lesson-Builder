/**
 * The example topic after `current` in `topics`, wrapping round at the end. A topic that isn't in the list
 * (typed by hand, or from another age group or length) starts again from the first, so pressing the button
 * after changing the settings shows that group's first suggestion.
 */
export function nextExampleTopic(topics: readonly string[], current: string): string {
  const index = topics.indexOf(current.trim());
  return topics[(index + 1) % topics.length];
}
