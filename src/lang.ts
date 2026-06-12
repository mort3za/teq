// Turn the BCP-47 codes stored on collected users (from X's `lang` attribute)
// into human-readable names for the language filters.

import type { CollectedUser } from "./storage.ts";

const names =
  typeof Intl !== "undefined" && "DisplayNames" in Intl
    ? new Intl.DisplayNames(undefined, { type: "language" })
    : null;

/** "en" → "English"; falls back to the raw code if it can't be resolved. */
export function langName(code: string): string {
  try {
    return names?.of(code) ?? code;
  } catch {
    return code;
  }
}

/** Sorted, de-duplicated list of languages present in the collected users. */
export function langOptions(users: CollectedUser[]): string[] {
  const set = new Set<string>();
  for (const u of users) if (u.lang) set.add(u.lang);
  return [...set].sort((a, b) => langName(a).localeCompare(langName(b)));
}
