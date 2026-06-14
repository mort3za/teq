// Config + block log persistence on top of chrome.storage.
// Config lives in `sync` (small, roams with the account); the block log and
// last error live in `local` (can grow, no sync quota pressure).

import { type Lang, detectLang } from "./i18n.ts";

export interface Config {
  /** Case-insensitive substrings; a display name containing any of these matches. */
  words: string[];
  /** When true, the content script auto-scans the page for matches on an interval. */
  autoCollect: boolean;
  /** Seconds between automatic page scans for new matches. */
  scanSeconds: number;
  /** Seconds to wait between blocks; positive random jitter is added on top.
   * Kept slow on purpose — X flags rapid-fire blocking as automation. */
  pacingSeconds: number;
  /** Max blocks allowed within any rolling 60-minute window (0 = no limit).
   * The run pauses when this is reached. X flags high block velocity. */
  maxPerHour: number;
  /** Max blocks allowed within any rolling 24-hour window (0 = no limit).
   * The run pauses when this is reached. */
  maxPerDay: number;
  /** UI language for the extension's own pages and overlay. */
  lang: Lang;
  /** Fold Persian/Arabic letter and digit variants when matching (off by
   * default; useful for Persian/Arabic rules). */
  persianNormalize: boolean;
}

export const DEFAULT_CONFIG: Config = {
  words: [],
  autoCollect: true,
  scanSeconds: 3,
  pacingSeconds: 30,
  maxPerHour: 40,
  maxPerDay: 250,
  lang: detectLang(),
  persianNormalize: false,
};

/** A matched user waiting to be reviewed and blocked. */
export interface CollectedUser {
  handle: string;
  name: string;
  /** matched word/emoji */
  reason: string;
  /** BCP-47 language of the tweet we matched them from, per X's own `lang`
   * attribute (e.g. "en", "fa", "ja"). Absent when there was no tweet text or
   * X reported "und" (undetermined). */
  lang?: string;
  /** True while this user is queued for / being blocked — shown as "in progress"
   * in the collected list. Cleared when a block run ends; the user is dropped
   * from the list entirely once the block is confirmed. */
  blocking?: boolean;
}

/** Live status of a block run, persisted so any view (popup, modal) can show it. */
export interface BlockProgress {
  /** Users successfully blocked so far. */
  done: number;
  /** Users queued when the run started. */
  total: number;
  phase: "blocking" | "paused" | "waiting" | "done";
  /** Why the run is paused, when X paused it (rate-limited / auth-rejected)
   * rather than the user. */
  error?: string;
  /** Epoch-ms the run will auto-resume at, while `phase` is "waiting" (a rolling
   * hourly/daily cap is cooling down). */
  resumeAt?: number;
}

export interface LogEntry {
  handle: string;
  name: string;
  /** epoch ms */
  at: number;
  /** matched word, or "emoji" */
  reason: string;
}

const LOG_KEY = "blockLog";
const ERROR_KEY = "lastError";
const COLLECTED_KEY = "collected";
const PROGRESS_KEY = "blockProgress";
const QUEUE_KEY = "blockQueue";
const LOG_LIMIT = 500;

export async function getConfig(): Promise<Config> {
  const stored = await chrome.storage.sync.get(DEFAULT_CONFIG as unknown as Record<string, unknown>);
  return { ...DEFAULT_CONFIG, ...stored } as Config;
}

export async function setConfig(patch: Partial<Config>): Promise<void> {
  await chrome.storage.sync.set(patch);
}

export async function getLog(): Promise<LogEntry[]> {
  const { [LOG_KEY]: log } = await chrome.storage.local.get(LOG_KEY);
  return (log as LogEntry[] | undefined) ?? [];
}

export async function addLog(entry: LogEntry): Promise<void> {
  const log = await getLog();
  log.unshift(entry);
  if (log.length > LOG_LIMIT) log.length = LOG_LIMIT;
  await chrome.storage.local.set({ [LOG_KEY]: log });
}

export async function clearLog(): Promise<void> {
  await chrome.storage.local.set({ [LOG_KEY]: [] });
}

export async function getCollected(): Promise<CollectedUser[]> {
  const { [COLLECTED_KEY]: c } = await chrome.storage.local.get(COLLECTED_KEY);
  return (c as CollectedUser[] | undefined) ?? [];
}

/** Append users, skipping any handle already collected. */
export async function addCollected(users: CollectedUser[]): Promise<void> {
  const merged = await getCollected();
  const seen = new Set(merged.map((u) => u.handle.toLowerCase()));
  for (const u of users) {
    const key = u.handle.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(u);
  }
  await chrome.storage.local.set({ [COLLECTED_KEY]: merged });
}

export async function removeCollected(handle: string): Promise<void> {
  const key = handle.toLowerCase();
  const next = (await getCollected()).filter(
    (u) => u.handle.toLowerCase() !== key,
  );
  await chrome.storage.local.set({ [COLLECTED_KEY]: next });
}

/** Flag the given handles as queued for blocking (shown as "in progress"). */
export async function setBlocking(handles: string[]): Promise<void> {
  const keys = new Set(handles.map((h) => h.toLowerCase()));
  const list = await getCollected();
  let changed = false;
  for (const u of list) {
    if (keys.has(u.handle.toLowerCase()) && !u.blocking) {
      u.blocking = true;
      changed = true;
    }
  }
  if (changed) await chrome.storage.local.set({ [COLLECTED_KEY]: list });
}

/** Clear the in-progress flag on every collected user (after a block run ends). */
export async function clearBlocking(): Promise<void> {
  const list = await getCollected();
  let changed = false;
  for (const u of list) {
    if (u.blocking) {
      delete u.blocking;
      changed = true;
    }
  }
  if (changed) await chrome.storage.local.set({ [COLLECTED_KEY]: list });
}

export async function clearCollected(): Promise<void> {
  await chrome.storage.local.set({ [COLLECTED_KEY]: [] });
}

/** Last block run's progress, or null when no run has happened yet. */
export async function getBlockProgress(): Promise<BlockProgress | null> {
  const { [PROGRESS_KEY]: p } = await chrome.storage.local.get(PROGRESS_KEY);
  return (p as BlockProgress | undefined) ?? null;
}

export async function setBlockProgress(p: BlockProgress | null): Promise<void> {
  await chrome.storage.local.set({ [PROGRESS_KEY]: p });
}

/** Handles still queued for the active block run, persisted so the run can
 * resume after a tab reload or extension update — the content script's
 * in-memory queue is lost on either. Empty when no run is in flight. */
export async function getBlockQueue(): Promise<string[]> {
  const { [QUEUE_KEY]: q } = await chrome.storage.local.get(QUEUE_KEY);
  return (q as string[] | undefined) ?? [];
}

export async function setBlockQueue(handles: string[]): Promise<void> {
  await chrome.storage.local.set({ [QUEUE_KEY]: handles });
}

export async function getLastError(): Promise<string | null> {
  const { [ERROR_KEY]: err } = await chrome.storage.local.get(ERROR_KEY);
  return (err as string | undefined) ?? null;
}

export async function setLastError(message: string | null): Promise<void> {
  await chrome.storage.local.set({ [ERROR_KEY]: message });
}
