// Full-page "review & block" overlay injected into the X page. Lives here
// rather than in the popup so it has the whole viewport: a compact, responsive
// grid that fits many collected users at once. Style-isolated in a Shadow DOM
// so X's CSS can't reach in and ours can't leak out.

import { getCollected, getConfig, removeCollected, type CollectedUser, type BlockProgress } from "./storage.ts";
import { langName, langOptions } from "./lang.ts";
import { getLang, isRtl, setLang, t, type Lang } from "./i18n.ts";

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
  }
  .card {
    display: flex; flex-direction: column;
    width: 92vw; max-width: 1100px; max-height: 88vh;
    background: #fff; border-radius: 14px;
    box-shadow: 0 12px 40px rgba(0,0,0,.4); overflow: hidden;
  }
  .head, .foot {
    display: flex; align-items: center; gap: 12px;
    padding: 14px 18px; flex: none;
  }
  .head { border-bottom: 1px solid #eee; }
  .foot { border-top: 1px solid #eee; }
  .head h2 { margin: 0; font-size: 16px; font-weight: 700; }
  .spacer { flex: 1; }
  .grid {
    flex: 1; overflow-y: auto; padding: 14px 18px;
    display: grid; gap: 8px;
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
    align-content: start;
  }
  .cell {
    display: flex; align-items: center; gap: 8px;
    padding: 6px 8px; border-radius: 8px; background: #f7f9f9;
    min-width: 0;
  }
  .cell label {
    display: flex; align-items: center; gap: 8px;
    flex: 1; min-width: 0; cursor: pointer;
  }
  .cell input { flex: none; width: 15px; height: 15px; cursor: pointer; }
  .who { display: flex; flex-direction: column; min-width: 0; }
  .who .name {
    font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .who .handle { color: #536471; font-size: 12px; }
  .icon-btn {
    flex: none; border: 0; background: transparent; cursor: pointer;
    color: #536471; font-size: 14px; padding: 2px 4px; border-radius: 4px;
  }
  .icon-btn:hover { background: rgba(244,33,46,.12); color: #f4212e; }
  .empty { padding: 40px; text-align: center; color: #536471; }
  .btn {
    border: 0; border-radius: 9999px; padding: 8px 18px;
    font-weight: 700; font-size: 14px; cursor: pointer;
  }
  .btn-primary { background: #f4212e; color: #fff; }
  .btn-primary:disabled { opacity: .5; cursor: default; }
  .btn-ghost { background: transparent; color: inherit; text-decoration: underline; }
  .status { color: #536471; font-size: 13px; }
  .lang-sel, .search {
    font: inherit; padding: 6px 10px; border-radius: 8px;
    border: 1px solid #ccd6dd; background: #fff; color: inherit;
  }
  .lang-sel { cursor: pointer; }
  .search { width: 180px; }
  @media (prefers-color-scheme: dark) {
    .card { background: #15202b; color: #e7e9ea; }
    .head, .foot { border-color: #38444d; }
    .cell { background: #1e2a36; }
    .cell:hover { background: #243340; }
    .icon-btn { color: #8b98a5; }
    .lang-sel, .search { background: #1e2a36; border-color: #38444d; }
    .status { color: #8b98a5; }
  }
`;

function mount(): void {
  host = document.createElement("div");
  root = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = STYLE;

  backdrop = document.createElement("div");
  backdrop.className = "backdrop";
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) close();
  });

  const card = document.createElement("div");
  card.className = "card";

  const head = document.createElement("div");
  head.className = "head";
  const title = document.createElement("h2");
  title.textContent = t("review.title");
  countEl = document.createElement("span");
  countEl.className = "handle";
  const spacer = document.createElement("div");
  spacer.className = "spacer";
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
  const selAll = document.createElement("button");
  selAll.className = "btn btn-ghost";
  selAll.textContent = t("review.selectAll");
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
  closeBtn.textContent = t("review.close");
  closeBtn.addEventListener("click", close);
  head.append(title, countEl, spacer, searchEl, langSel, selAll, closeBtn);

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
  const handle = document.createElement("span");
  handle.className = "handle";
  handle.textContent = u.lang ? `@${u.handle} · ${langName(u.lang)}` : `@${u.handle}`;
  who.append(name, handle);
  label.append(cb, who);

  const rm = document.createElement("button");
  rm.className = "icon-btn";
  rm.title = t("common.remove");
  rm.textContent = "✕";
  rm.addEventListener("click", async () => {
    selected.delete(key);
    await removeCollected(u.handle);
    await refresh();
  });

  el.append(label, rm);
  return el;
}

function updateBlockBtn(): void {
  if (!blockBtn) return;
  if (blocking) {
    blockBtn.textContent = t("review.blockingBtn");
    blockBtn.disabled = true;
    return;
  }
  blockBtn.textContent = t("review.blockN", { n: selected.size });
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
  collected = [...(await getCollected())].reverse();
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
  if (backdrop) backdrop.dir = isRtl() ? "rtl" : "ltr";
  host!.style.display = "block";
  blocking = false;
  if (statusEl) statusEl.textContent = "";
  searchTerm = "";
  if (searchEl) searchEl.value = "";
  collected = [...(await getCollected())].reverse();
  selected = new Set(collected.map((u) => u.handle.toLowerCase()));
  render();
}
