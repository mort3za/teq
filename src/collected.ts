// Full-page list of every collected account: search, paginate, clear.

import {
  getCollected,
  getConfig,
  addCollected,
  removeCollected,
  clearCollected,
  type CollectedUser,
} from "./storage.ts";
import { langName, langOptions } from "./lang.ts";
import { toCsv, parseCsv, downloadCsv, pickCsv } from "./csv.ts";
import { watchNavCount } from "./nav.ts";
import { applyI18n, setLang, t } from "./i18n.ts";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const countEl = $<HTMLElement>("count");
const searchEl = $<HTMLInputElement>("search");
const langEl = $<HTMLSelectElement>("lang");
const listEl = $<HTMLUListElement>("list");
const emptyEl = $<HTMLParagraphElement>("empty");
const pagerEl = $<HTMLElement>("pager");
const prevBtn = $<HTMLButtonElement>("prev");
const nextBtn = $<HTMLButtonElement>("next");
const pageInfo = $<HTMLElement>("pageInfo");
const clearBtn = $<HTMLButtonElement>("clear");
const exportBtn = $<HTMLButtonElement>("export");
const importBtn = $<HTMLButtonElement>("import");

const PAGE_SIZE = 25;

let users: CollectedUser[] = [];
let page = 0;

function filtered(): CollectedUser[] {
  const q = searchEl.value.trim().toLowerCase();
  const lang = langEl.value;
  return users.filter((u) => {
    if (lang && u.lang !== lang) return false;
    if (!q) return true;
    return (
      u.handle.toLowerCase().includes(q) || u.name.toLowerCase().includes(q)
    );
  });
}

/** Refill the language dropdown from the current users, keeping the selection. */
function syncLangOptions(): void {
  const opts = langOptions(users);
  const current = langEl.value;
  langEl.replaceChildren(
    new Option(t("common.allLanguages"), ""),
    ...opts.map((c) => new Option(langName(c), c)),
  );
  langEl.value = opts.includes(current) ? current : "";
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
      link.textContent = `@${u.handle}`;

      const name = document.createElement("span");
      name.className = "name";
      name.textContent = u.name;

      const meta = document.createElement("span");
      meta.className = "date";
      const reason = document.createElement("span");
      reason.textContent = u.lang ? `${u.reason} · ${langName(u.lang)}` : u.reason;
      meta.append(reason);
      if (u.blocking) {
        const badge = document.createElement("span");
        badge.className = "badge";
        badge.textContent = t("collected.inProgress");
        meta.append(badge);
      }

      const rm = document.createElement("button");
      rm.type = "button";
      rm.className = "remove";
      rm.title = t("common.remove");
      rm.textContent = "✕";
      rm.addEventListener("click", async () => {
        await removeCollected(u.handle);
        await load();
      });

      li.append(link, name, meta, rm);
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
  users = await getCollected();
  countEl.textContent = String(users.length);
  syncLangOptions();
  page = 0;
  render();
}

searchEl.addEventListener("input", () => {
  page = 0;
  render();
});

langEl.addEventListener("change", () => {
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
  if (!confirm(t("collected.confirmClear"))) {
    return;
  }
  await clearCollected();
  await load();
});

exportBtn.addEventListener("click", () => {
  if (!users.length) return;
  const csv = toCsv(
    ["handle", "name", "reason", "lang"],
    users.map((u) => [u.handle, u.name, u.reason, u.lang ?? ""]),
  );
  downloadCsv("collected.csv", csv);
});

importBtn.addEventListener("click", async () => {
  const text = await pickCsv();
  if (text == null) return;

  const rows = parseCsv(text);
  if (!rows.length) return;

  // Map columns by header name; only `handle` is required.
  const header = rows[0]!.map((h) => h.trim().toLowerCase());
  const col = (name: string) => header.indexOf(name);
  const iHandle = col("handle");
  const iName = col("name");
  const iReason = col("reason");
  const iLang = col("lang");

  if (iHandle === -1) {
    alert(t("collected.importNoHandle"));
    return;
  }

  const imported: CollectedUser[] = [];
  for (const row of rows.slice(1)) {
    const handle = (row[iHandle] ?? "").trim().replace(/^@/, "");
    if (!handle) continue;
    const user: CollectedUser = {
      handle,
      name: iName === -1 ? "" : (row[iName] ?? "").trim(),
      reason: iReason === -1 ? "" : (row[iReason] ?? "").trim(),
    };
    const lang = iLang === -1 ? "" : (row[iLang] ?? "").trim();
    if (lang) user.lang = lang;
    imported.push(user);
  }

  if (!imported.length) {
    alert(t("collected.importNoRows"));
    return;
  }

  await addCollected(imported);
  await load();
});

// Popup/content mutate the collected list; reflect changes live.
chrome.storage.onChanged.addListener((_changes, area) => {
  if (area === "local") void load();
});

void load();
watchNavCount();
