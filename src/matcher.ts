// Pure matching logic — no DOM, no chrome APIs — so it can be unit tested.

export interface MatchOptions {
  words: string[];
  /** When true, fold Persian/Arabic letter and digit variants before matching
   * so e.g. a rule typed with Persian ک matches text containing Arabic ك. */
  normalize?: boolean;
}

// Arabic letters and Arabic-Indic / Persian digits that are visually identical
// (or near-identical) to their Persian / ASCII counterparts but use different
// code points — so a rule typed one way wouldn't otherwise match text typed the
// other. Also drops the zero-width non-joiner used inside Persian words.
const FOLD: Record<string, string> = {
  "ي": "ی", // Arabic yeh ي → Persian yeh ی
  "ى": "ی", // Arabic alef maqsura ى → Persian yeh ی
  "ك": "ک", // Arabic kaf ك → Persian keheh ک
  "‌": "", // zero-width non-joiner
};

/** Fold Persian/Arabic letter and digit variants to one canonical form. */
export function normalizePersian(text: string): string {
  let out = text.normalize("NFC").replace(/[يىك‌]/g, (c) => FOLD[c]!);
  // Arabic-Indic (U+0660–0669) and Persian (U+06F0–06F9) digits → ASCII 0–9.
  out = out.replace(/[٠-٩۰-۹]/g, (c) => {
    const code = c.codePointAt(0)!;
    const base = code >= 0x06f0 ? 0x06f0 : 0x0660;
    return String(code - base);
  });
  return out;
}

/**
 * Returns the reason a name matches (the offending word), or null if it
 * doesn't match. Word comparison is case-insensitive substring, so emoji
 * listed as words match too. With `normalize`, Persian/Arabic variants are
 * folded on both sides first.
 */
export function matchReason(name: string, opts: MatchOptions): string | null {
  const fold = (s: string) => (opts.normalize ? normalizePersian(s) : s).toLowerCase();
  const haystack = fold(name);
  for (const word of opts.words) {
    const trimmed = word.trim();
    const needle = fold(trimmed);
    if (needle && haystack.includes(needle)) return trimmed;
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
