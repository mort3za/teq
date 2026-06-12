// Pure matching logic — no DOM, no chrome APIs — so it can be unit tested.

export interface MatchOptions {
  words: string[];
}

/**
 * Returns the reason a name matches (the offending word), or null if it
 * doesn't match. Word comparison is case-insensitive substring, so emoji
 * listed as words match too.
 */
export function matchReason(name: string, opts: MatchOptions): string | null {
  const haystack = name.toLowerCase();
  for (const word of opts.words) {
    const needle = word.trim().toLowerCase();
    if (needle && haystack.includes(needle)) return word.trim();
  }
  return null;
}

/** Parse a textarea (one word per line) into a clean word list. */
export function parseWords(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}
