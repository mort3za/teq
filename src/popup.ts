// Popup: edit the rules, collect matches from the active X tab, review the
// collected list, then block the selected accounts.

import {
  getConfig,
  setConfig,
  getLog,
  getLastError,
  getCollected,
  clearCollected,
  getBlockProgress,
  type CollectedUser,
  type BlockProgress,
} from "./storage.ts";
import { parseWords } from "./matcher.ts";
import { fmtDuration } from "./pacing.ts";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const words = $<HTMLTextAreaElement>("words");
const autoCollect = $<HTMLInputElement>("autoCollect");
const errorBox = $<HTMLDivElement>("error");
const count = $<HTMLElement>("count");
const runStatus = $<HTMLElement>("runStatus");
const collectedList = $<HTMLUListElement>("collectedList");
const collectedCount = $<HTMLElement>("collectedCount");
const collectedEmpty = $<HTMLParagraphElement>("collectedEmpty");
const clearCollectedBtn = $<HTMLButtonElement>("clearCollected");
const reviewBtn = $<HTMLButtonElement>("review");
const progress = $<HTMLDivElement>("progress");
const progressText = $<HTMLElement>("progressText");
const pauseToggle = $<HTMLButtonElement>("pauseToggle");

const X_URL = /^https?:\/\/(x|twitter)\.com\//;

async function load(): Promise<void> {
  const cfg = await getConfig();
  words.value = cfg.words.join("\n");
  autoCollect.checked = cfg.autoCollect;

  const err = await getLastError();
  errorBox.hidden = !err;
  errorBox.textContent = err ?? "";

  const log = await getLog();
  // One entry per handle (a handle can appear repeatedly in the raw log if it
  // resurfaced across sessions).
  const handles = new Set(log.map((e) => e.handle.toLowerCase()));
  count.textContent = String(handles.size);

  await renderCollected();
  await renderProgress();
}

/** Show the live "Blocking x of N" row (with the blinking dot) while a run is in
 * progress or paused; hidden otherwise. The button toggles pause/resume. */
async function renderProgress(): Promise<void> {
  applyProgress(await getBlockProgress());
}

// Last progress the row was painted from — lets the toggle flip the UI
// synchronously on click without first re-reading storage (which would delay
// the visual response, the bug being fixed here).
let shownProgress: BlockProgress | null = null;

/** " (resumes in 12m)" countdown for a waiting run, or "" if no resume time. */
function waitingSuffix(p: BlockProgress): string {
  return p.resumeAt ? ` (resumes in ${fmtDuration(p.resumeAt - Date.now())})` : "";
}

/** Paint the progress row from a progress snapshot — used both by the live
 * storage-driven render and by the optimistic flip on the toggle click. */
function applyProgress(p: BlockProgress | null): void {
  shownProgress = p;
  const active =
    p?.phase === "blocking" || p?.phase === "paused" || p?.phase === "waiting";
  progress.hidden = !active;
  if (!active) return;
  const isPaused = p!.phase === "paused";
  const isWaiting = p!.phase === "waiting";
  progressText.textContent = isPaused
    ? `Paused — ${p!.done} of ${p!.total}`
    : isWaiting
      ? `Waiting${waitingSuffix(p!)} — ${p!.done} of ${p!.total}`
      : `Blocking ${p!.done} of ${p!.total}…`;
  // Both non-blocking states get the muted/idle styling; only a manual pause
  // shows the ▶ resume affordance — a waiting run resumes itself.
  progress.classList.toggle("paused", isPaused || isWaiting);
  pauseToggle.textContent = isPaused ? "▶" : "⏸";
  pauseToggle.setAttribute("aria-label", isPaused ? "Resume" : "Pause");
}

/** Find an open x.com / twitter.com tab (host permissions grant the URL match). */
async function xTab(): Promise<chrome.tabs.Tab | null> {
  const tabs = await chrome.tabs.query({ url: ["*://x.com/*", "*://twitter.com/*"] });
  return tabs[0] ?? null;
}

pauseToggle.addEventListener("click", () => {
  const p = shownProgress;
  if (p?.phase !== "blocking" && p?.phase !== "paused" && p?.phase !== "waiting") return;
  // From blocking or a cap-cooldown wait → manual pause (stops auto-resume);
  // from paused → resume.
  const pausing = p.phase !== "paused";
  // Flip the row right now (synchronously, before any await) so the toggle
  // reacts to the click. The content script's next progress write reconciles
  // this via storage; we deliberately don't revert on a send error, because
  // sendMessage can reject even after the content script handled the message —
  // reverting then would wrongly snap the row back. A stale row self-corrects
  // on the next storage update.
  applyProgress({ ...p, phase: pausing ? "paused" : "blocking" });
  void sendToggle(pausing);
});

async function sendToggle(pausing: boolean): Promise<void> {
  const tab = await xTab();
  if (!tab?.id) {
    runStatus.textContent = "Open the X tab to control the run.";
    return;
  }
  try {
    await chrome.tabs.sendMessage(tab.id, { type: pausing ? "pauseBlocking" : "resumeBlocking" });
  } catch {
    runStatus.textContent = "Reload the X tab, then try again.";
  }
}

/** Build the `name @handle` block shared by the preview and modal rows. */
function who(u: CollectedUser): HTMLSpanElement {
  const span = document.createElement("span");
  span.className = "who";
  const name = document.createElement("strong");
  name.textContent = u.name || u.handle;
  const handle = document.createElement("span");
  handle.className = "handle";
  handle.textContent = `@${u.handle}`;
  span.append(name, handle);
  return span;
}

/** Read-only preview row in the popup body. */
function row(u: CollectedUser): HTMLLIElement {
  const li = document.createElement("li");
  li.append(who(u));
  return li;
}

async function renderCollected(): Promise<void> {
  const collected = [...(await getCollected())].reverse();
  collectedCount.textContent = `${collected.length} collected`;
  collectedEmpty.hidden = collected.length > 0;
  clearCollectedBtn.hidden = collected.length === 0;
  reviewBtn.disabled = collected.length === 0;
  collectedList.replaceChildren(...collected.map(row));
}

async function save(): Promise<void> {
  await setConfig({ words: parseWords(words.value), autoCollect: autoCollect.checked });
}

words.addEventListener("input", () => void save());
autoCollect.addEventListener("change", () => void save());

async function activeXTab(): Promise<chrome.tabs.Tab | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !X_URL.test(tab.url ?? "")) {
    runStatus.textContent = "Open an x.com tab first.";
    return null;
  }
  return tab;
}

/** Open the in-page review overlay on the active X tab, then close the popup. */
async function review(): Promise<void> {
  const tab = await activeXTab();
  if (!tab) return;
  try {
    await chrome.tabs.sendMessage(tab.id!, { type: "review" });
    window.close(); // hand off to the full-page overlay
  } catch {
    runStatus.textContent = "Reload the X tab, then try again.";
  }
}

reviewBtn.addEventListener("click", () => void review());
clearCollectedBtn.addEventListener("click", async () => {
  await clearCollected();
  await renderCollected();
});

// The content script mutates local storage as it blocks; reflect that live.
chrome.storage.onChanged.addListener((_changes, area) => {
  if (area === "local") void load();
});

void load();
