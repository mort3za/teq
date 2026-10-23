// Auto-scroll: scrolls the X page one step at a time so X loads more cells, and
// scans for matches after each step. Started from the popup; a floating pill on
// the page shows the live count and can stop it. Any wheel, key, touch or click
// from the user stops it at once — they took over. The pill is style-isolated in
// a Shadow DOM, like the review overlay.

import { getConfig, getRateLimitedUntil } from "./storage.ts";
import { ensureFonts } from "./review.ts";
import { fmtDuration, scrollDelayMs } from "./pacing.ts";
import { getLang, isRtl, setLang, t, type Lang } from "./i18n.ts";
import { STOP_ICON, X_ICON } from "./icons.ts";
import theme from "./theme.css" with { type: "text" };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Steps in a row where the page neither moved nor grew before we call it the end
// of the list. More than one: X shows a spinner for a moment before it appends.
const END_STALLS = 3;

// User input that means "I took over". Our own scrollBy fires none of these.
const STOP_EVENTS = ["wheel", "touchstart", "keydown", "mousedown"] as const;

let running = false;
// Fresh matches added since this run started (any scan counts, see noteFound).
let found = 0;
// Stop once `found` reaches this (Config.scrollMaxFound; 0 = no limit).
let maxFound = 0;
// Epoch-ms the 429 hold ends while the run waits it out, else 0.
let limitedUntil = 0;
let onReview: () => void = () => {};

let host: HTMLDivElement | null = null;
let pill: HTMLDivElement | null = null;
let textEl: HTMLSpanElement | null = null;
let stopBtn: HTMLButtonElement | null = null;
let closeBtn: HTMLButtonElement | null = null;
// Language the labels were built in, so we can remount on a live switch.
let mountedLang: Lang | null = null;

const STYLE = `
  :host { all: initial; }
  .pill {
    position: fixed; z-index: 2147483646; bottom: 24px; left: 50%;
    transform: translateX(-50%);
    display: flex; align-items: center; gap: 8px;
    padding: 6px; padding-inline-start: 16px;
    border-radius: 9999px; background: #fff; color: #0f1419;
    box-shadow: 0 0 0 1px rgba(0,0,0,.08), 0 8px 28px rgba(0,0,0,.25);
    font: 14px/1.4 'Vazirmatn', -apple-system, system-ui, sans-serif;
    white-space: nowrap;
    --muted: #536471; --stop-bg: #0f1419; --stop-fg: #fff;
  }
  .dot { flex: none; width: 8px; height: 8px; border-radius: 50%; background: var(--accent); }
  .pill.running .dot { animation: pulse 1.2s ease-in-out infinite; }
  .pill.done .dot { background: var(--muted); }
  .pill.limited .dot { background: #f5b800; }
  @keyframes pulse { 50% { opacity: .3; } }
  .text { margin-inline-end: 8px; font-variant-numeric: tabular-nums; }
  /* Same optical trim as the button labels in theme.css, so they line up. */
  .text { text-box: trim-both cap alphabetic; }
  .pill:lang(fa) .text { text-box: trim-both ex alphabetic; }
  .btn {
    box-sizing: border-box; height: 36px; margin: 0;
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    border: 0; padding: 0 16px; border-radius: 9999px;
    font: inherit; font-weight: 700; cursor: pointer; white-space: nowrap;
  }
  .btn-ghost { background: transparent; color: inherit; padding: 0 12px; }
  .btn-ghost:hover { background: var(--icon-btn-hover-bg); }
  .btn-stop { background: var(--stop-bg); color: var(--stop-fg); }
  .btn-stop:hover { background: color-mix(in srgb, var(--stop-bg) 85%, var(--stop-fg)); }
  .icon-btn {
    flex: none; display: inline-flex; align-items: center; justify-content: center;
    width: 36px; height: 36px; padding: 0; border: 0; border-radius: 50%;
    background: transparent; color: var(--muted); cursor: pointer;
  }
  .icon-btn:hover { background: var(--icon-btn-hover-bg); color: inherit; }
  button:focus-visible { outline: 2px solid #1d9bf0; outline-offset: 2px; }
  [hidden] { display: none !important; }
  @media (prefers-reduced-motion: reduce) {
    .pill.running .dot { animation: none; }
  }
  @media (prefers-color-scheme: dark) {
    .pill {
      background: #000; color: #e7e9ea;
      box-shadow: 0 0 0 1px #2f3336, 0 8px 28px rgba(0,0,0,.6);
      --muted: #8b98a5; --stop-bg: #eff3f4; --stop-fg: #0f1419;
    }
  }
`;

/** A button with a text label (a span, so theme.css can trim it) and an optional icon. */
function button(cls: string, text: string, icon = ""): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = cls;
  btn.innerHTML = icon;
  const label = document.createElement("span");
  label.textContent = text;
  btn.append(label);
  return btn;
}

function mount(): void {
  ensureFonts();

  host = document.createElement("div");
  const root = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = theme + STYLE;

  pill = document.createElement("div");
  pill.className = "pill";
  pill.setAttribute("role", "status");
  const dot = document.createElement("span");
  dot.className = "dot";
  textEl = document.createElement("span");
  textEl.className = "text";

  const reviewBtn = button("btn btn-ghost", t("scroll.review"));
  reviewBtn.addEventListener("click", () => {
    stopAutoScroll();
    hide();
    onReview();
  });
  stopBtn = button("btn btn-stop", t("scroll.stop"), STOP_ICON);
  stopBtn.title = t("scroll.stopHint");
  stopBtn.addEventListener("click", () => stopAutoScroll());
  closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "icon-btn";
  closeBtn.innerHTML = X_ICON;
  closeBtn.title = t("review.close");
  closeBtn.setAttribute("aria-label", t("review.close"));
  closeBtn.addEventListener("click", hide);

  pill.append(dot, textEl, reviewBtn, stopBtn, closeBtn);
  root.append(style, pill);
  document.body.append(host);
  mountedLang = getLang();
}

function hide(): void {
  if (host) host.style.display = "none";
}

/** Why a run stopped: the user, the end of the list, or the found limit. */
type ScrollStop = "stopped" | "end" | "max";

/** Paint the pill for the current state: live while running, a countdown while
 * X's 429 hold runs out, a summary once stopped. */
function paint(state: "running" | "limited" | ScrollStop): void {
  if (!pill || !textEl || !stopBtn || !closeBtn) return;
  const done = state !== "running" && state !== "limited";
  pill.classList.toggle("running", state === "running");
  pill.classList.toggle("limited", state === "limited");
  pill.classList.toggle("done", done);
  textEl.textContent = t(`scroll.${state}`, { n: found, time: fmtDuration(limitedUntil - Date.now()) });
  stopBtn.hidden = done;
  closeBtn.hidden = !done;
}

function onUserInput(e: Event): void {
  if (!e.isTrusted) return;
  // Clicks and keys on the pill itself are handled by its buttons.
  if (host && e.composedPath().includes(host)) return;
  stopAutoScroll();
}

export function isAutoScrolling(): boolean {
  return running;
}

/** Add fresh matches from any scan — the regular auto-collect tick included — to
 * the run's count. A no-op when no run is active. */
export function noteFound(n: number): void {
  if (!running || !n) return;
  found += n;
  if (maxFound && found >= maxFound) stopAutoScroll("max");
  else paint(limitedUntil ? "limited" : "running");
}

/**
 * Start scrolling the page. `collect` scans the page (and reports fresh matches
 * through noteFound); `review` opens the review overlay from the pill. Collects
 * even when auto-collect is off — the user asked for this run.
 */
export async function startAutoScroll(collect: () => Promise<number>, review: () => void): Promise<void> {
  if (running) return;
  onReview = review;
  const cfg = await getConfig();
  setLang(cfg.lang);
  maxFound = cfg.scrollMaxFound;
  // Rebuild if the language changed since the pill was last mounted.
  if (host && mountedLang !== getLang()) {
    host.remove();
    host = null;
  }
  if (!host) mount();
  pill!.dir = isRtl() ? "rtl" : "ltr";
  pill!.lang = getLang(); // for :lang(fa) in theme.css, not x.com's own lang
  host!.style.display = "block";

  running = true;
  found = 0;
  limitedUntil = 0;
  paint("running");
  for (const type of STOP_EVENTS) {
    window.addEventListener(type, onUserInput, { capture: true, passive: true });
  }
  void loop(collect);
}

/** Stop the run and leave the pill up with a summary. */
export function stopAutoScroll(state: ScrollStop = "stopped"): void {
  if (!running) return;
  running = false;
  for (const type of STOP_EVENTS) {
    window.removeEventListener(type, onUserInput, { capture: true });
  }
  paint(state);
}

async function loop(collect: () => Promise<number>): Promise<void> {
  const page = document.scrollingElement ?? document.documentElement;
  let stalls = 0;
  await collect(); // what is on screen right now
  while (running) {
    // X answered 429 (too many requests): scrolling makes X load more, so hold
    // still until the service worker's hold runs out, then carry on.
    const until = await getRateLimitedUntil();
    if (until > Date.now()) {
      limitedUntil = until;
      paint("limited");
      await sleep(1000);
      continue;
    }
    if (limitedUntil) {
      limitedUntil = 0;
      paint("running");
    }
    const y = page.scrollTop;
    const h = page.scrollHeight;
    // 60–90% of a screen: some overlap with what was already seen, and an
    // uneven step, like a person skimming.
    window.scrollBy({ top: window.innerHeight * (0.6 + Math.random() * 0.3), behavior: "smooth" });
    await sleep(scrollDelayMs());
    if (!running) return;
    await collect();
    // At the bottom and nothing new loaded → the list ended (or X stopped
    // loading). Wait a few steps first: loading more takes a moment.
    stalls = page.scrollTop === y && page.scrollHeight === h ? stalls + 1 : 0;
    if (stalls >= END_STALLS) stopAutoScroll("end");
  }
}
