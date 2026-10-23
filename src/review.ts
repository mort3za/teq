// Full-page "review & block" overlay injected into the X page. Lives here
// rather than in the popup so it has the whole viewport: a compact, responsive
// grid that fits many collected users at once. Style-isolated in a Shadow DOM
// so X's CSS can't reach in and ours can't leak out.

import { getCollected, getConfig, removeCollected, addIgnored, type CollectedUser, type BlockProgress } from "./storage.ts";
import { langName, langOptions } from "./lang.ts";
import { getLang, isRtl, setLang, t, type Lang } from "./i18n.ts";
import { BAN_ICON, INFO_ICON, SQUARE_CHECK_ICON, SQUARE_MINUS_ICON, X_ICON } from "./icons.ts";
import theme from "./theme.css" with { type: "text" };

export type { BlockProgress };

let host: HTMLDivElement | null = null;
let root: ShadowRoot | null = null;
let backdrop: HTMLDivElement | null = null;
// Language the static labels were built in, so we can remount on a live switch.
let mountedLang: Lang | null = null;
let grid: HTMLDivElement | null = null;
let blockBtn: HTMLButtonElement | null = null;
let countEl: HTMLElement | null = null;
let statusEl: HTMLElement | null = null;
let langSel: HTMLSelectElement | null = null;
let searchEl: HTMLInputElement | null = null;
let selAllBtn: HTMLButtonElement | null = null;

// Lowercased handles checked for blocking.
let selected = new Set<string>();
let collected: CollectedUser[] = [];
// Selected language code, or "" for all.
let langFilter = "";
// Lowercased search term matched against name/handle, or "" for all.
let searchTerm = "";
// True while a paced block run is in progress (modal stays open to show it).
let blocking = false;
let onBlock: (handles: string[], onProgress: (p: BlockProgress) => void) => void = () => {};

/** Collected users still waiting for a decision, newest first. Anyone already
 * queued for blocking is left out — they were confirmed in an earlier round and
 * showing them again (blocks are paced minutes apart) invites a double take. */
async function pending(): Promise<CollectedUser[]> {
  return [...(await getCollected())].reverse().filter((u) => !u.blocking);
}

/** Users matching the active language filter and search term. */
function visible(): CollectedUser[] {
  let rows = langFilter ? collected.filter((u) => u.lang === langFilter) : collected;
  if (searchTerm) {
    rows = rows.filter(
      (u) => u.handle.toLowerCase().includes(searchTerm) || u.name.toLowerCase().includes(searchTerm),
    );
  }
  return rows;
}

const STYLE = `
  :host { all: initial; }
  .backdrop {
    position: fixed; inset: 0; z-index: 2147483647;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0,0,0,.6);
    font: 14px/1.4 'Vazirmatn', -apple-system, system-ui, sans-serif;
    color: #0f1419;
    --muted: #536471; --line: #eff3f4; --control-border: #cfd9de; --surface: #f7f9f9;
  }
  .card {
    display: flex; flex-direction: column;
    width: 92vw; max-width: 1100px; max-height: 88vh;
    background: #fff; border-radius: 16px;
    box-shadow: 0 12px 40px rgba(0,0,0,.4); overflow: hidden;
  }
  /* One spacing scale (4/8/12/16) and one control height (36px) throughout. */
  .head, .foot {
    display: flex; align-items: center; gap: 8px;
    padding: 12px 16px; flex: none;
  }
  .head { flex-wrap: wrap; border-bottom: 1px solid var(--line); }
  .foot { border-top: 1px solid var(--line); }
  .title { display: flex; align-items: baseline; gap: 8px; margin-inline-end: auto; }
  .title h2 { margin: 0; font-size: 16px; font-weight: 700; }
  /* Same optical trim as the button labels in theme.css. */
  .title > * { text-box: trim-both cap alphabetic; }
  .backdrop:lang(fa) .title > * { text-box: trim-both ex alphabetic; }
  .count { color: var(--muted); font-size: 13px; }
  .spacer { flex: 1; }
  .grid {
    flex: 1; overflow-y: auto; padding: 16px;
    display: grid; gap: 8px;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    align-content: start;
    align-items: start; /* an opened tweet grows only its own cell */
  }
  .cell {
    display: flex; flex-direction: column; gap: 8px;
    padding: 8px; padding-inline-start: 12px; border-radius: 12px; background: var(--surface);
    border: 1px solid transparent;
    min-width: 0;
  }
  /* Selected = will be blocked: tint it in the Block button's red. */
  .cell:has(input:checked) {
    background: color-mix(in srgb, var(--persian-red) 6%, transparent);
    border-color: color-mix(in srgb, var(--persian-red) 35%, transparent);
  }
  .row { display: flex; align-items: center; gap: 4px; min-width: 0; }
  .tweet {
    margin: 0; font-size: 12px; line-height: 1.5; color: var(--muted);
    white-space: pre-wrap; overflow-wrap: anywhere;
    max-height: 9em; overflow-y: auto;
    border-top: 1px solid var(--line); padding-top: 8px;
  }
  .tweet[hidden] { display: none; }
  .cell label {
    display: flex; align-items: center; gap: 12px;
    flex: 1; min-width: 0; cursor: pointer;
  }
  .cell input {
    flex: none; width: 16px; height: 16px; margin: 0; cursor: pointer;
    accent-color: var(--persian-red);
  }
  .who { display: flex; flex-direction: column; min-width: 0; }
  .who .name {
    font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .who .handle { color: var(--muted); font-size: 12px; }
  .who .handle a { color: inherit; text-decoration: none; }
  .who .handle a:hover { text-decoration: underline; }
  /* Names set their own direction (dir=auto); keep them aligned with the overlay. */
  .backdrop[dir="ltr"] .who { text-align: left; }
  .backdrop[dir="rtl"] .who { text-align: right; }
  .icon-btn {
    flex: none; display: inline-flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; padding: 0;
    border: 0; background: transparent; cursor: pointer;
    color: var(--muted); border-radius: 8px;
  }
  .icon-btn:hover { background: var(--icon-btn-hover-bg); color: inherit; }
  .info-btn[aria-expanded="true"] { color: inherit; background: var(--icon-btn-hover-bg); }
  .empty { padding: 40px 16px; text-align: center; color: var(--muted); }
  .btn, .lang-sel, .search {
    box-sizing: border-box; height: 36px; margin: 0;
    font: inherit; border-radius: 9999px;
  }
  .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    border: 0; padding: 0 16px; font-weight: 700; cursor: pointer; white-space: nowrap;
  }
  .btn-primary { background: var(--persian-red); color: #fff; }
  .btn-primary:not(:disabled):hover { background: color-mix(in srgb, var(--persian-red) 88%, #000); }
  .btn:disabled { opacity: .5; cursor: default; }
  .btn-ghost { background: transparent; color: inherit; padding: 0 12px; }
  .btn-ghost:not(:disabled):hover { background: var(--icon-btn-hover-bg); }
  button:focus-visible, .lang-sel:focus-visible, .search:focus-visible, .cell input:focus-visible {
    outline: 2px solid #1d9bf0; outline-offset: 2px;
  }
  .status { color: var(--muted); font-size: 13px; }
  .lang-sel, .search {
    padding: 0 16px; border: 1px solid var(--control-border); background-color: transparent; color: inherit;
  }
  .lang-sel { cursor: pointer; padding-inline-end: 36px; } /* room for the chevron (theme.css) */
  .lang-sel option { background: #fff; color: #0f1419; }
  .search { width: 240px; max-width: 100%; }
  /* Inputs can't use text-box trimming; shift their text to the optical center. */
  .search { padding-top: 3px; }
  .backdrop:lang(fa) .search { padding-top: 1px; }
  /* A select moves its text by only half its top padding, so it needs about twice the shift. */
  .lang-sel { padding-top: 5px; }
  .backdrop:lang(fa) .lang-sel { padding-top: 6px; }
  .search::placeholder { color: var(--muted); }
  @media (max-width: 600px) {
    .title { flex: 1 1 100%; }
    .search { flex: 1 1 100%; width: auto; }
    .lang-sel { flex: 1; min-width: 0; }
  }
  @media (prefers-color-scheme: dark) {
    .backdrop { color: #e7e9ea; --muted: #8b98a5; --line: #2f3336; --control-border: #3e4144; --surface: #16181c; }
    .card { background: #000; box-shadow: 0 0 0 1px #2f3336, 0 12px 40px rgba(0,0,0,.6); }
    .cell:has(input:checked) { background: color-mix(in srgb, var(--persian-red) 12%, transparent); }
    .lang-sel option { background: #16181c; color: #e7e9ea; }
  }
`;

/** @font-face is ignored inside a shadow root, so the bundled Vazirmatn is
 * declared on the page itself (fonts.css is a web-accessible resource). Shared
 * by every in-page overlay; safe to call repeatedly. */
export function ensureFonts(): void {
  if (document.getElementById("teq-fonts")) return;
  const fonts = document.createElement("link");
  fonts.id = "teq-fonts";
  fonts.rel = "stylesheet";
  fonts.href = chrome.runtime.getURL("fonts.css");
  document.head.append(fonts);
}

function mount(): void {
  ensureFonts();

  host = document.createElement("div");
  root = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = theme + STYLE;

  backdrop = document.createElement("div");
  backdrop.className = "backdrop";
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) close();
  });

  const card = document.createElement("div");
  card.className = "card";

  const head = document.createElement("div");
  head.className = "head";
  const title = document.createElement("div");
  title.className = "title";
  const h2 = document.createElement("h2");
  h2.textContent = t("review.title");
  countEl = document.createElement("span");
  countEl.className = "count";
  title.append(h2, countEl);
  searchEl = document.createElement("input");
  searchEl.className = "search";
  searchEl.type = "search";
  searchEl.placeholder = t("review.searchPlaceholder");
  searchEl.addEventListener("input", () => {
    searchTerm = searchEl!.value.trim().toLowerCase();
    render();
  });
  langSel = document.createElement("select");
  langSel.className = "lang-sel";
  langSel.addEventListener("change", () => {
    langFilter = langSel!.value;
    render();
  });
  const selAll = (selAllBtn = document.createElement("button"));
  selAll.className = "btn btn-ghost";
  selAll.addEventListener("click", () => {
    const rows = visible();
    const keys = rows.map((u) => u.handle.toLowerCase());
    // Toggle only the currently-visible users, leaving selections in other
    // languages untouched.
    const allSelected = keys.every((k) => selected.has(k));
    if (allSelected) for (const k of keys) selected.delete(k);
    else for (const k of keys) selected.add(k);
    render();
  });
  const closeBtn = document.createElement("button");
  closeBtn.className = "btn btn-ghost";
  setLabel(closeBtn, X_ICON, t("review.close"));
  closeBtn.addEventListener("click", close);
  head.append(title, searchEl, langSel, selAll, closeBtn);

  grid = document.createElement("div");
  grid.className = "grid";

  const foot = document.createElement("div");
  foot.className = "foot";
  statusEl = document.createElement("span");
  statusEl.className = "status";
  const footSpacer = document.createElement("div");
  footSpacer.className = "spacer";
  blockBtn = document.createElement("button");
  blockBtn.className = "btn btn-primary";
  blockBtn.addEventListener("click", doBlock);
  foot.append(statusEl, footSpacer, blockBtn);

  card.append(head, grid, foot);
  backdrop.append(card);
  root.append(style, backdrop);
  document.body.append(host);
  mountedLang = getLang();

  // Keep the grid in sync as the paced drain removes blocked users.
  chrome.storage.onChanged.addListener((_c, area) => {
    if (area === "local" && host && host.style.display !== "none") void refresh();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && host && host.style.display !== "none") close();
  });
}

function cell(u: CollectedUser): HTMLDivElement {
  const key = u.handle.toLowerCase();
  const el = document.createElement("div");
  el.className = "cell";

  const label = document.createElement("label");
  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.checked = selected.has(key);
  cb.addEventListener("change", () => {
    if (cb.checked) selected.add(key);
    else selected.delete(key);
    updateBlockBtn();
  });

  const who = document.createElement("span");
  who.className = "who";
  const name = document.createElement("span");
  name.className = "name";
  name.textContent = u.name || u.handle;
  name.dir = "auto"; // a Latin name in the RTL overlay truncates at its own end
  const handle = document.createElement("span");
  handle.className = "handle";
  const link = document.createElement("a");
  link.href = `https://x.com/${u.handle}`;
  link.target = "_blank";
  link.rel = "noreferrer";
  // ⁦…⁩ isolates the handle so RTL layout can't move the "@" to its far side.
  link.textContent = `\u2066@${u.handle}\u2069`;
  handle.append(link);
  if (u.lang) handle.append(` · ${langName(u.lang)}`);
  who.append(name, handle);
  label.append(cb, who);

  // "✕" is a permanent dismissal: the user goes on the ignore list so a later
  // scan never collects them again.
  const rm = document.createElement("button");
  rm.className = "icon-btn";
  rm.title = t("review.ignore");
  rm.setAttribute("aria-label", t("review.ignore"));
  rm.innerHTML = X_ICON;
  rm.addEventListener("click", async () => {
    selected.delete(key);
    await addIgnored({ handle: u.handle, name: u.name, at: Date.now() });
    await removeCollected(u.handle);
    await refresh();
  });

  const row = document.createElement("div");
  row.className = "row";
  row.append(label);
  el.append(row);

  // The tweet this user was collected from, folded away behind an info button:
  // most decisions are made on the name alone, and open tweets would swamp the
  // grid.
  if (u.tweet) {
    const tweet = document.createElement("p");
    tweet.className = "tweet";
    tweet.dir = "auto"; // follow the tweet's own direction, not the overlay's
    tweet.textContent = u.tweet;
    tweet.hidden = true;

    const info = document.createElement("button");
    info.className = "icon-btn info-btn";
    info.title = t("review.showTweet");
    info.setAttribute("aria-label", t("review.showTweet"));
    info.setAttribute("aria-expanded", "false");
    info.innerHTML = INFO_ICON;
    info.addEventListener("click", () => {
      tweet.hidden = !tweet.hidden;
      info.setAttribute("aria-expanded", String(!tweet.hidden));
    });

    row.append(info);
    el.append(tweet);
  }

  row.append(rm);
  return el;
}

/** Set a button's text label, with its icon in front. */
function setLabel(btn: HTMLButtonElement, icon: string, text: string): void {
  btn.innerHTML = icon;
  const label = document.createElement("span"); // a span so theme.css can trim it
  label.textContent = text;
  btn.append(label);
}

function updateBlockBtn(): void {
  if (selAllBtn) {
    // The toggle acts on the visible users only, so its label does too.
    const keys = visible().map((u) => u.handle.toLowerCase());
    const allSelected = keys.length > 0 && keys.every((k) => selected.has(k));
    setLabel(
      selAllBtn,
      allSelected ? SQUARE_MINUS_ICON : SQUARE_CHECK_ICON,
      t(allSelected ? "review.deselectAll" : "review.selectAll"),
    );
    selAllBtn.disabled = keys.length === 0;
  }
  if (!blockBtn) return;
  if (blocking) {
    setLabel(blockBtn, BAN_ICON, t("review.blockingBtn"));
    blockBtn.disabled = true;
    return;
  }
  setLabel(blockBtn, BAN_ICON, t("review.blockN", { n: selected.size }));
  blockBtn.disabled = selected.size === 0;
}

function syncLangOptions(): void {
  if (!langSel) return;
  const opts = langOptions(collected);
  langSel.replaceChildren(new Option(t("common.allLanguages"), ""), ...opts.map((c) => new Option(langName(c), c)));
  if (!opts.includes(langFilter)) langFilter = "";
  langSel.value = langFilter;
}

function render(): void {
  if (!grid || !countEl) return;
  syncLangOptions();
  const rows = visible();
  countEl.textContent =
    rows.length !== collected.length
      ? t("review.countFiltered", { shown: rows.length, total: collected.length })
      : t("review.count", { n: collected.length });
  if (rows.length) {
    grid.replaceChildren(...rows.map(cell));
  } else {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = collected.length ? t("review.noMatches") : t("review.nothingCollected");
    grid.replaceChildren(empty);
  }
  updateBlockBtn();
}

/** Reload from storage (drops selections for users no longer present). */
async function refresh(): Promise<void> {
  collected = await pending();
  const present = new Set(collected.map((u) => u.handle.toLowerCase()));
  selected = new Set([...selected].filter((k) => present.has(k)));
  render();
}

function doBlock(): void {
  if (blocking) return;
  const handles = collected.map((u) => u.handle).filter((h) => selected.has(h.toLowerCase()));
  if (!handles.length) return;

  // Stay open and report progress: blocks are paced apart (and only run while
  // this X tab is open), so closing would make it look like nothing happened.
  blocking = true;
  updateBlockBtn();
  if (statusEl) statusEl.textContent = t("review.statusBlocking", { done: 0, total: handles.length });

  onBlock(handles, (p) => {
    if (!statusEl) return;
    if (p.phase === "blocking" || p.phase === "paused" || p.phase === "waiting") {
      statusEl.textContent =
        p.phase === "paused"
          ? t("review.statusPaused", {
              err: p.error ? t("review.errSuffix", { err: p.error }) : "",
              done: p.done,
              total: p.total,
            })
          : p.phase === "waiting"
            ? t("review.statusWaiting", { err: p.error ?? "", done: p.done, total: p.total })
            : t("review.statusBlocking", { done: p.done, total: p.total });
      return;
    }
    blocking = false;
    statusEl.textContent = t("review.statusDone", { done: p.done, total: p.total });
    updateBlockBtn();
  });
}

function close(): void {
  if (host) host.style.display = "none";
}

/** Open the overlay, defaulting to everything selected. */
export async function openReview(
  block: (handles: string[], onProgress: (p: BlockProgress) => void) => void,
): Promise<void> {
  onBlock = block;
  setLang((await getConfig()).lang);
  // Rebuild if the language changed since the overlay was last mounted — the
  // static head labels are only set at mount time.
  if (host && mountedLang !== getLang()) {
    host.remove();
    host = null;
  }
  if (!host) mount();
  if (backdrop) {
    backdrop.dir = isRtl() ? "rtl" : "ltr";
    backdrop.lang = getLang(); // for :lang(fa) in theme.css, not x.com's own lang
  }
  host!.style.display = "block";
  blocking = false;
  if (statusEl) statusEl.textContent = "";
  searchTerm = "";
  if (searchEl) searchEl.value = "";
  collected = await pending();
  selected = new Set(collected.map((u) => u.handle.toLowerCase()));
  render();
}
