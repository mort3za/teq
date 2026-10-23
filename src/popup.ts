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
  getTipDismissed,
  dismissTip,
  type CollectedUser,
  type BlockProgress,
} from "./storage.ts";
import { parseWords } from "./matcher.ts";
import { fmtDuration } from "./pacing.ts";
import { applyI18n, setLang, t } from "./i18n.ts";
import { CHEVRONS_DOWN_ICON, PAUSE_ICON, PLAY_ICON, STOP_ICON } from "./icons.ts";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const words = $<HTMLTextAreaElement>("words");
const tweetWords = $<HTMLTextAreaElement>("tweetWords");
const autoCollect = $<HTMLInputElement>("autoCollect");
const errorBox = $<HTMLDivElement>("error");
const count = $<HTMLElement>("count");
const inProgress = $<HTMLElement>("inProgress");
const runStatus = $<HTMLElement>("runStatus");
const collectedList = $<HTMLUListElement>("collectedList");
const collectedCount = $<HTMLElement>("collectedCount");
const collectedEmpty = $<HTMLParagraphElement>("collectedEmpty");
const clearCollectedBtn = $<HTMLButtonElement>("clearCollected");
const reviewBtn = $<HTMLButtonElement>("review");
const scrollBtn = $<HTMLButtonElement>("autoScroll");
const progress = $<HTMLDivElement>("progress");
const progressText = $<HTMLElement>("progressText");
const pauseToggle = $<HTMLButtonElement>("pauseToggle");
const tip = $<HTMLDivElement>("tip");
const dismissTipBtn = $<HTMLButtonElement>("dismissTip");

const X_URL = /^https?:\/\/(x|twitter)\.com\//;

async function load(): Promise<void> {
  const cfg = await getConfig();
  setLang(cfg.lang);
  applyI18n();
  words.value = cfg.words.join("\n");
  tweetWords.value = cfg.tweetWords.join("\n");
  autoCollect.checked = cfg.autoCollect;
  scrollBtn.hidden = !cfg.autoScroll;
  tip.hidden = await getTipDismissed();

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
  return p.resumeAt ? t("popup.resumesIn", { time: fmtDuration(p.resumeAt - Date.now()) }) : "";
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
    ? t("popup.progress.paused", { done: p!.done, total: p!.total })
    : isWaiting
      ? t("popup.progress.waiting", { suffix: waitingSuffix(p!), done: p!.done, total: p!.total })
      : t("popup.progress.blocking", { done: p!.done, total: p!.total });
  // Both non-blocking states get the muted/idle styling; only a manual pause
  // shows the ▶ resume affordance — a waiting run resumes itself.
  progress.classList.toggle("paused", isPaused || isWaiting);
  pauseToggle.innerHTML = isPaused ? PLAY_ICON : PAUSE_ICON;
  pauseToggle.setAttribute("aria-label", isPaused ? t("popup.aria.resume") : t("popup.aria.pause"));
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
    runStatus.textContent = t("popup.openXControl");
    return;
  }
  try {
    await chrome.tabs.sendMessage(tab.id, { type: pausing ? "pauseBlocking" : "resumeBlocking" });
  } catch {
    runStatus.textContent = t("popup.reloadX");
  }
}

/** Build the `name @handle` block shared by the preview and modal rows. */
function who(u: CollectedUser): HTMLSpanElement {
  const span = document.createElement("span");
  span.className = "who";
  const name = document.createElement("strong");
  name.textContent = u.name || u.handle;
  name.dir = "auto"; // a Latin name in the RTL popup truncates at its own end
  const handle = document.createElement("span");
  handle.className = "handle";
  // ⁦…⁩ isolates the handle so RTL layout can't move the "@" to its far side.
  handle.textContent = `\u2066@${u.handle}\u2069`;
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
  const all = [...(await getCollected())].reverse();
  // Already reviewed and queued for blocking → counted under "in progress", not
  // here. Same filter as the review overlay, so the count matches what it shows.
  const collected = all.filter((u) => !u.blocking);
  const queued = all.length - collected.length;
  collectedCount.textContent = String(collected.length);
  collectedEmpty.hidden = collected.length > 0;
  collectedEmpty.textContent = t(queued ? "popup.nothingToReview" : "popup.nothingCollected");
  // Clearing also cancels queued blocks, so keep it while anything is collected.
  clearCollectedBtn.hidden = all.length === 0;
  reviewBtn.disabled = collected.length === 0;
  collectedList.replaceChildren(...collected.map(row));
  inProgress.hidden = queued === 0;
  inProgress.textContent = t("popup.inProgress", { n: queued });
}

async function save(): Promise<void> {
  await setConfig({
    words: parseWords(words.value),
    tweetWords: parseWords(tweetWords.value),
    autoCollect: autoCollect.checked,
  });
}

words.addEventListener("input", () => void save());
tweetWords.addEventListener("input", () => void save());
autoCollect.addEventListener("change", () => void save());

async function activeXTab(): Promise<chrome.tabs.Tab | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !X_URL.test(tab.url ?? "")) {
    runStatus.textContent = t("popup.openXFirst");
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
    runStatus.textContent = t("popup.reloadX");
  }
}

// Whether the active X tab is auto-scrolling; asked from the tab when the popup
// opens (the tab is the source of truth — nothing to go stale in storage).
let scrolling = false;

/** Label the auto-scroll button for the current state. The label keeps its
 * data-i18n key, so a live language switch (applyI18n) relabels it too. */
function paintScrollBtn(): void {
  const key = scrolling ? "popup.stopScroll" : "popup.autoScroll";
  scrollBtn.innerHTML = scrolling ? STOP_ICON : CHEVRONS_DOWN_ICON;
  const label = document.createElement("span");
  label.dataset.i18n = key;
  label.textContent = t(key);
  scrollBtn.append(label);
}

async function loadScrollState(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id && X_URL.test(tab.url ?? "")) {
    try {
      const res = await chrome.tabs.sendMessage(tab.id, { type: "autoScrollState" });
      scrolling = res?.running === true;
    } catch {
      scrolling = false; // no content script yet (tab not reloaded since install)
    }
  }
  paintScrollBtn();
}

/** Start or stop auto-scroll on the active X tab. Starting closes the popup, so
 * the page (and its status pill) is in view. */
async function toggleScroll(): Promise<void> {
  const tab = await activeXTab();
  if (!tab) return;
  try {
    await chrome.tabs.sendMessage(tab.id!, { type: scrolling ? "stopAutoScroll" : "autoScroll" });
  } catch {
    runStatus.textContent = t("popup.reloadX");
    return;
  }
  if (!scrolling) {
    window.close();
    return;
  }
  scrolling = false;
  paintScrollBtn();
}

reviewBtn.addEventListener("click", () => void review());
scrollBtn.addEventListener("click", () => void toggleScroll());
dismissTipBtn.addEventListener("click", () => {
  tip.hidden = true;
  void dismissTip();
});
clearCollectedBtn.addEventListener("click", async () => {
  if (!confirm(t("collected.confirmClear"))) return;
  await clearCollected();
  await renderCollected();
});

// The content script mutates local storage as it blocks; reflect that live.
chrome.storage.onChanged.addListener((_changes, area) => {
  if (area === "local") void load();
});

void load().then(loadScrollState);
