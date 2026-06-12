// Full-page list of every blocked account: search, paginate, clear.

import { getLog, clearLog, type LogEntry } from "./storage.ts";
import { toCsv, downloadCsv } from "./csv.ts";
import { watchNavCount } from "./nav.ts";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const countEl = $<HTMLElement>("count");
const searchEl = $<HTMLInputElement>("search");
const listEl = $<HTMLUListElement>("list");
const emptyEl = $<HTMLParagraphElement>("empty");
const pagerEl = $<HTMLElement>("pager");
const prevBtn = $<HTMLButtonElement>("prev");
const nextBtn = $<HTMLButtonElement>("next");
const pageInfo = $<HTMLElement>("pageInfo");
const clearBtn = $<HTMLButtonElement>("clear");
const exportBtn = $<HTMLButtonElement>("export");

const PAGE_SIZE = 25;

let entries: LogEntry[] = []; // deduped, most-recent-first
let page = 0;

const dateFmt = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

/** Collapse the raw log to one row per handle, keeping the most recent block. */
function dedupe(log: LogEntry[]): LogEntry[] {
  const seen = new Set<string>();
  return log.filter((e) => {
    const key = e.handle.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function filtered(): LogEntry[] {
  const q = searchEl.value.trim().toLowerCase();
  if (!q) return entries;
  return entries.filter(
    (e) =>
      e.handle.toLowerCase().includes(q) || e.name.toLowerCase().includes(q),
  );
}

function render(): void {
  const rows = filtered();
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  page = Math.min(page, pages - 1);

  const slice = rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  listEl.replaceChildren(
    ...slice.map((e) => {
      const li = document.createElement("li");

      const link = document.createElement("a");
      link.className = "handle";
      link.href = `https://x.com/${e.handle}`;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.textContent = `@${e.handle}`;

      const name = document.createElement("span");
      name.className = "name";
      name.textContent = e.name;

      const date = document.createElement("time");
      date.className = "date";
      date.dateTime = new Date(e.at).toISOString();
      date.textContent = dateFmt.format(e.at);

      li.append(link, name, date);
      return li;
    }),
  );

  emptyEl.hidden = rows.length > 0;
  pagerEl.hidden = rows.length <= PAGE_SIZE;
  pageInfo.textContent = `Page ${page + 1} of ${pages}`;
  prevBtn.disabled = page === 0;
  nextBtn.disabled = page >= pages - 1;
}

async function load(): Promise<void> {
  entries = dedupe(await getLog());
  countEl.textContent = String(entries.length);
  page = 0;
  render();
}

searchEl.addEventListener("input", () => {
  page = 0;
  render();
});

prevBtn.addEventListener("click", () => {
  if (page > 0) page--;
  render();
});

nextBtn.addEventListener("click", () => {
  page++;
  render();
});

clearBtn.addEventListener("click", async () => {
  if (!entries.length) return;
  if (!confirm("Clear the entire blocked-accounts list? This can't be undone.")) {
    return;
  }
  await clearLog();
  await load();
});

exportBtn.addEventListener("click", () => {
  if (!entries.length) return;
  const csv = toCsv(
    ["handle", "name", "reason", "blockedAt"],
    entries.map((e) => [e.handle, e.name, e.reason, new Date(e.at).toISOString()]),
  );
  downloadCsv("blocked.csv", csv);
});

// The content script appends to the log as it blocks; reflect that live.
chrome.storage.onChanged.addListener((_changes, area) => {
  if (area === "local") void load();
});

void load();
watchNavCount();
