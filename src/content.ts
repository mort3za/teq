// Content script: on demand, scan the x.com DOM for user cells whose display
// name matches the configured rules and collect them for review. Blocking is a
// separate, explicit step driven from the popup.

import { matchReason } from "./matcher.ts";
import { blockUser, BlockError } from "./blocker.ts";
import { openReview, type BlockProgress } from "./review.ts";
import { blockDelayMs, capReached, capRetryMs, fmtDuration } from "./pacing.ts";
import { setLang, t } from "./i18n.ts";
import {
  getConfig,
  DEFAULT_CONFIG,
  getCollected,
  addCollected,
  removeCollected,
  setBlocking,
  clearBlocking,
  addLog,
  getLog,
  setLastError,
  getBlockProgress,
  setBlockProgress,
  getBlockQueue,
  setBlockQueue,
  type CollectedUser,
} from "./storage.ts";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let ownHandle: string | null = null;

// Handles queued for blocking; drained one at a time, paced apart. The delay
// between blocks is configurable (Options page) — X flags rapid-fire blocking
// as automation — and up to 30% positive random jitter is added on top.
const blockQueue: string[] = [];
let draining = false;
// Pause flag for the active run — the drain loop stops processing while set, but
// keeps the queue intact so the run can be resumed from the popup.
let paused = false;

// Progress for the current block run, surfaced live to the review modal.
let blockTotal = 0;
let blockDone = 0;
let onBlockProgress: ((p: BlockProgress) => void) | null = null;

// While a run is active we hold a port open to the service worker; an open port
// keeps the worker alive so it can blink the toolbar-icon badge for the whole
// (paced, minutes-long) run instead of being killed between blocks.
let runPort: chrome.runtime.Port | null = null;

/** Report progress to the modal, the persisted store, and the badge worker. */
async function reportProgress(p: BlockProgress): Promise<void> {
  onBlockProgress?.(p);
  await setBlockProgress(p);
}

/** Best-effort: read the logged-in user's @handle so we never block ourselves. */
function detectOwnHandle(): void {
  const btn = document.querySelector('[data-testid="SideNav_AccountSwitcher_Button"]');
  const m = btn?.textContent?.match(/@([A-Za-z0-9_]+)/);
  if (m) ownHandle = m[1]!.toLowerCase();
}

// Like textContent, but emoji that X renders as Twemoji <img> elements (the
// actual character lives in the alt attribute) are restored — textContent alone
// would drop them, so emoji in display names would never match.
function richText(el: Element): string {
  let out = "";
  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      out += node.textContent ?? "";
    } else if (node instanceof HTMLImageElement) {
      out += node.alt;
    } else if (node instanceof Element) {
      out += richText(node);
    }
  }
  return out;
}

/** Extract { handle, name } from a [data-testid="User-Name"] container. */
function extractUser(el: Element): { handle: string; name: string } | null {
  let handle = "";
  for (const a of el.querySelectorAll('a[href^="/"]')) {
    const href = a.getAttribute("href") ?? "";
    const m = href.match(/^\/([A-Za-z0-9_]+)$/);
    if (m) {
      handle = m[1]!;
      break;
    }
  }
  if (!handle) return null;

  // The container text is roughly "Display Name@handle·time"; the display name
  // is everything before the "@handle" token.
  const full = richText(el).trim();
  const at = full.indexOf("@" + handle);
  const name = (at >= 0 ? full.slice(0, at) : full).trim();
  return { handle, name };
}

/**
 * The language of the tweet this user cell belongs to, read straight from the
 * `lang` attribute X puts on its tweet-text node. Returns undefined when there
 * is no tweet body (e.g. a "Who to follow" cell) or X couldn't determine one.
 */
function tweetLang(userNameEl: Element): string | undefined {
  const scope = userNameEl.closest("article") ?? userNameEl.closest('[data-testid="cellInnerDiv"]');
  const text = scope?.querySelector('[data-testid="tweetText"]');
  const lang = text?.getAttribute("lang")?.trim();
  return lang && lang !== "und" ? lang : undefined;
}

/**
 * Scan the currently-rendered page for matches and add new ones to the
 * collected list. Returns how many fresh matches were added.
 */
async function collect(): Promise<number> {
  const cfg = await getConfig();
  // Skip anyone already collected or already blocked (logged) — re-collecting a
  // blocked user would put them back in the review queue.
  const existing = new Set(
    (await getCollected()).map((u) => u.handle.toLowerCase()),
  );
  for (const e of await getLog()) existing.add(e.handle.toLowerCase());
  const found: CollectedUser[] = [];

  for (const el of document.querySelectorAll('[data-testid="User-Name"]')) {
    const user = extractUser(el);
    if (!user) continue;

    const key = user.handle.toLowerCase();
    if (key === ownHandle || existing.has(key)) continue;
    existing.add(key);

    // Match the display name first; if it doesn't match, also check the
    // @username. Username matching is always on — there's no config for it.
    const opts = { words: cfg.words, normalize: cfg.persianNormalize };
    const reason = matchReason(user.name, opts) ?? matchReason(user.handle, opts);
    if (!reason) continue;

    found.push({ handle: user.handle, name: user.name, reason, lang: tweetLang(el) });
  }

  if (found.length) await addCollected(found);
  return found.length;
}

/**
 * Queue handles for blocking and start the paced drain if it isn't running.
 * `onProgress` is invoked as the run advances so the review modal can show it.
 */
function enqueueBlocks(handles: string[], onProgress?: (p: BlockProgress) => void): void {
  for (const h of handles) {
    if (!blockQueue.some((q) => q.toLowerCase() === h.toLowerCase())) {
      blockQueue.push(h);
    }
  }
  onBlockProgress = onProgress ?? null;
  blockTotal = blockQueue.length;
  blockDone = 0;
  paused = false;
  // Mark them "in progress" in the collected list until they're blocked.
  void setBlocking(handles);
  void setBlockQueue(blockQueue);
  void setBlockProgress({ done: 0, total: blockTotal, phase: "blocking" });
  if (!draining) void drain();
}

/** Pause the active run: stop blocking but keep the queue for a later resume.
 * `error` is set when X paused us (rate-limited / auth-rejected) rather than the
 * user — surfaced so they know why it stopped advancing. */
function pauseRun(error?: string): void {
  if (!draining || paused) return;
  paused = true;
  void reportProgress({ done: blockDone, total: blockTotal, phase: "paused", error });
}

/** Resume a paused run; the drain loop's wait-while-paused gate lets it proceed.
 * Clears any pause reason so a fresh attempt starts clean. */
function resumeRun(): void {
  if (!paused) return;
  paused = false;
  void setLastError(null);
  void reportProgress({ done: blockDone, total: blockTotal, phase: "blocking" });
}

// How often the cap cooldown re-checks the rolling window. We compute the exact
// clear time and sleep until then, but never longer than this in one go, so a
// user pause (or a config change) is honored without a tight poll. Coarse on
// purpose: the window clears on the scale of minutes/hours, not milliseconds.
const CAP_RECHECK_MS = 30_000;

/**
 * Block while a maxed-out rolling cap cools down, then return so the drain loop
 * takes the next target. The wait is recomputed from the live block log each
 * pass, so it adapts to new blocks / config changes and survives a tab reload or
 * browser restart — resumeInterruptedRun re-enters the drain loop, which calls
 * back here and recomputes from the persisted log. Returns early if the user
 * pauses; the drain loop's wait-while-paused gate then takes over.
 */
async function waitOutCap(): Promise<void> {
  while (!paused) {
    const cfg = await getConfig();
    setLang(cfg.lang);
    const ts = (await getLog()).map((e) => e.at);
    const active = capReached(ts, cfg.maxPerHour, cfg.maxPerDay);
    if (!active) break; // the window freed a slot → resume blocking
    const waitMs = capRetryMs(ts, cfg.maxPerHour, cfg.maxPerDay);
    const limit =
      active === "day"
        ? t("run.dailyLimit", { n: cfg.maxPerDay })
        : t("run.hourlyLimit", { n: cfg.maxPerHour });
    await reportProgress({
      done: blockDone,
      total: blockTotal,
      phase: "waiting",
      error: t("run.capReached", { limit, time: fmtDuration(waitMs) }),
      resumeAt: Date.now() + waitMs,
    });
    // +1s settle so we don't wake a hair before the boundary and loop once more.
    await sleep(Math.min(waitMs + 1000, CAP_RECHECK_MS));
  }
  // Cleared (not paused): drop any stale reason and show blocking again before
  // the drain loop takes the next target.
  if (!paused) {
    await setLastError(null);
    await reportProgress({ done: blockDone, total: blockTotal, phase: "blocking" });
  }
}

async function drain(): Promise<void> {
  draining = true;
  // Keep the service worker alive (and the icon badge blinking) for the run.
  runPort = chrome.runtime.connect({ name: "block-run" });
  while (blockQueue.length) {
    while (paused) await sleep(400);

    // Enforce the rolling hourly/daily block caps before taking the next
    // target. The counts come from the persisted block log, so the limit holds
    // across tab reloads and separate runs — it tracks the account, not this
    // one drain. When a cap is hit we don't stop: we wait out the rolling window
    // (the oldest blocks age past the trailing hour/day boundary and free a
    // slot) and auto-resume, rather than blocking through X's thresholds.
    const cfg = await getConfig();
    const cap = capReached((await getLog()).map((e) => e.at), cfg.maxPerHour, cfg.maxPerDay);
    if (cap) {
      await waitOutCap();
      // Re-evaluate from the top: a cleared cap falls through to blocking; a
      // user pause taken during the wait is caught by the wait-while-paused gate.
      continue;
    }

    // Peek, don't shift: the handle stays in the (persisted) queue until the
    // block is confirmed, so a reload mid-block — or a rate-limit pause — leaves
    // it queued to retry rather than dropping it.
    const handle = blockQueue[0]!;
    const entry = (await getCollected()).find(
      (u) => u.handle.toLowerCase() === handle.toLowerCase(),
    );
    // Removed from the collected list while queued → cancel this block.
    if (!entry) {
      blockQueue.shift();
      await setBlockQueue(blockQueue);
      continue;
    }

    try {
      await blockUser(handle);
      await addLog({
        handle,
        name: entry.name,
        reason: entry.reason,
        at: Date.now(),
      });
      await removeCollected(handle);
      await setLastError(null);
      blockDone++;
      blockQueue.shift();
      await setBlockQueue(blockQueue);
    } catch (err) {
      const status = err instanceof BlockError ? err.status : -1;
      const message = String(err instanceof Error ? err.message : err);
      await setLastError(message);
      // Rate-limited or auth-rejected: pause the run (resumable) rather than
      // killing it. The target stays at the front of the queue so resuming
      // retries it, and we skip the pacing delay below — the wait-while-paused
      // gate at the loop top holds.
      if (status === 429 || status === 403 || status === 401) {
        pauseRun(message);
        continue;
      }
      // Other errors: drop this target and move on after the normal delay.
      blockQueue.shift();
      await setBlockQueue(blockQueue);
    }

    await reportProgress({ done: blockDone, total: blockTotal, phase: "blocking" });

    if (blockQueue.length) {
      await sleep(blockDelayMs(cfg.pacingSeconds));
    }
  }
  draining = false;
  // The queue is empty: everything queued was blocked or dropped on a
  // non-fatal error. Clear any leftover "in progress" flags and report done.
  await clearBlocking();
  await setBlockQueue([]);
  await reportProgress({ done: blockDone, total: blockTotal, phase: "done" });
  // Disconnect → service worker stops blinking and clears the badge.
  runPort?.disconnect();
  runPort = null;
}

/**
 * A tab reload or extension update tears down the content script mid-run: the
 * in-memory queue and drain loop are lost, but the persisted progress is left
 * frozen at "blocking"/"paused"/"waiting". Rehydrate the queue from storage and
 * resume draining so the run actually continues (and the toolbar dot reappears).
 * A paused run resumes paused — the user un-pauses it from the popup. A waiting
 * run resumes active and the drain loop recomputes the cap cooldown from the
 * persisted log (so it picks up mid-cooldown after a restart, or just carries on
 * if the window has since cleared). A run whose queue is gone is finalized so
 * stale "in progress" state doesn't linger.
 */
async function resumeInterruptedRun(): Promise<void> {
  if (draining) return;
  const p = await getBlockProgress();
  if (p?.phase !== "blocking" && p?.phase !== "paused" && p?.phase !== "waiting") return;

  const queue = await getBlockQueue();
  if (!queue.length) {
    await clearBlocking();
    await setBlockProgress({ ...p, phase: "done" });
    return;
  }

  blockQueue.push(...queue);
  blockTotal = p.total;
  blockDone = p.done;
  paused = p.phase === "paused";
  void drain();
}

function start(): void {
  detectOwnHandle();
  void resumeInterruptedRun();

  // Auto-scan the page so matches are collected without the popup having to
  // ask. The next scan is scheduled only after the previous one finishes (no
  // pile-up), and the interval is re-read each cycle so changing it on the
  // Options page takes effect without reloading the tab.
  const tick = async () => {
    let seconds = DEFAULT_CONFIG.scanSeconds;
    try {
      const cfg = await getConfig();
      seconds = cfg.scanSeconds;
      if (cfg.autoCollect) await collect();
    } finally {
      setTimeout(() => void tick(), Math.max(1, seconds) * 1000);
    }
  };
  void tick();

  // Messages from the popup: "collect" scans the page, "review" opens the
  // in-page review overlay (which queues blocks itself).
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === "collect") {
      void collect().then((collected) => sendResponse({ collected }));
      return true; // keep the channel open for the async response
    }
    if (msg?.type === "review") {
      void openReview(enqueueBlocks);
      sendResponse({ ok: true });
      return undefined;
    }
    if (msg?.type === "pauseBlocking") {
      pauseRun();
      sendResponse({ ok: true });
      return undefined;
    }
    if (msg?.type === "resumeBlocking") {
      resumeRun();
      sendResponse({ ok: true });
      return undefined;
    }
    return undefined;
  });
}

start();
