// Dates on the listing pages: a short relative label ("3 hours ago") with the
// exact time kept for the hover tooltip. Pure (no DOM/chrome) — unit-testable.

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 86_400_000],
  ["month", 30 * 86_400_000],
  ["week", 7 * 86_400_000],
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
];

/** "5 minutes ago", "yesterday", "3 weeks ago" … in the UI language. Under a
 * minute reads "now". Truncates, so 90 minutes is "1 hour ago". */
export function relativeTime(at: number, now: number, lang: string): string {
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
  const diff = at - now;
  for (const [unit, ms] of UNITS) {
    if (Math.abs(diff) >= ms) return rtf.format(Math.trunc(diff / ms), unit);
  }
  return rtf.format(0, "second");
}

/** Full date and time for the tooltip, e.g. "Oct 23, 2026, 8:50 PM". */
export function exactTime(at: number, lang: string): string {
  return new Intl.DateTimeFormat(lang, { dateStyle: "medium", timeStyle: "short" }).format(at);
}
