// Full-page list of every ignored account: search, paginate, clear.
// Users land here from the "✕" in the review overlay; while a handle is on this
// list the content script never collects it again.

import {
  getIgnored,
  getConfig,
  removeIgnored,
  clearIgnored,
  type IgnoredUser,
} from "./storage.ts";
import { watchNavCount } from "./nav.ts";
import { applyI18n, getLang, setLang, t } from "./i18n.ts";
import { exactTime, relativeTime } from "./time.ts";
import { X_ICON } from "./icons.ts";

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

const PAGE_SIZE = 25;

let users: IgnoredUser[] = []; // most-recently ignored first
let page = 0;

function filtered(): IgnoredUser[] {
  const q = searchEl.value.trim().toLowerCase();
  if (!q) return users;
  return users.filter(
    (u) => u.handle.toLowerCase().includes(q) || u.name.toLowerCase().includes(q),
  );
}

function render(): void {
  const rows = filtered();
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  page = Math.min(page, pages - 1);

  const slice = rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  listEl.replaceChildren(
    ...slice.map((u) => {
      const li = document.createElement("li");
      li.className = "has-remove";

      const link = document.createElement("a");
      link.className = "handle";
      link.href = `https://x.com/${u.handle}`;
      link.target = "_blank";
      link.rel = "noreferrer";
      // ⁦…⁩ isolates the handle so RTL layout can't move the "@" to its far side.
      link.textContent = `\u2066@${u.handle}\u2069`;

      const name = document.createElement("span");
      name.className = "name";
      name.textContent = u.name;
      name.dir = "auto"; // a Latin name on an RTL page keeps its own punctuation order

      const date = document.createElement("time");
      date.className = "date";
      date.dateTime = new Date(u.at).toISOString();
      date.textContent = relativeTime(u.at, Date.now(), getLang());
      date.title = exactTime(u.at, getLang());

      const rm = document.createElement("button");
      rm.type = "button";
      rm.className = "icon-btn remove";
      rm.title = t("common.remove");
      rm.setAttribute("aria-label", t("common.remove"));
      rm.innerHTML = X_ICON;
      rm.addEventListener("click", async () => {
        await removeIgnored(u.handle);
        await load();
      });

      li.append(link, name, date, rm);
      return li;
    }),
  );

  emptyEl.hidden = rows.length > 0;
  pagerEl.hidden = rows.length <= PAGE_SIZE;
  pageInfo.textContent = t("common.pageInfo", { page: page + 1, pages });
  prevBtn.disabled = page === 0;
  nextBtn.disabled = page >= pages - 1;
}

async function load(): Promise<void> {
  setLang((await getConfig()).lang);
  applyI18n();
  users = [...(await getIgnored())].reverse();
  countEl.textContent = String(users.length);
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
  if (!users.length) return;
  if (!confirm(t("ignored.confirmClear"))) return;
  await clearIgnored();
  await load();
});

// The review overlay adds to this list while the page is open; reflect it live.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.ignored) void load();
});

void load();
watchNavCount();
