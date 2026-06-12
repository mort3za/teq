(() => {
  // src/storage.ts
  var DEFAULT_CONFIG = {
    words: [],
    autoCollect: true,
    scanSeconds: 3,
    pacingSeconds: 30,
    maxPerHour: 40,
    maxPerDay: 250
  };
  var LOG_KEY = "blockLog";
  var ERROR_KEY = "lastError";
  var COLLECTED_KEY = "collected";
  var PROGRESS_KEY = "blockProgress";
  var QUEUE_KEY = "blockQueue";
  var LOG_LIMIT = 500;
  async function getConfig() {
    const stored = await chrome.storage.sync.get(DEFAULT_CONFIG);
    return { ...DEFAULT_CONFIG, ...stored };
  }
  async function setConfig(patch) {
    await chrome.storage.sync.set(patch);
  }
  async function getLog() {
    const { [LOG_KEY]: log } = await chrome.storage.local.get(LOG_KEY);
    return log ?? [];
  }
  async function addLog(entry) {
    const log = await getLog();
    log.unshift(entry);
    if (log.length > LOG_LIMIT)
      log.length = LOG_LIMIT;
    await chrome.storage.local.set({ [LOG_KEY]: log });
  }
  async function clearLog() {
    await chrome.storage.local.set({ [LOG_KEY]: [] });
  }
  async function getCollected() {
    const { [COLLECTED_KEY]: c } = await chrome.storage.local.get(COLLECTED_KEY);
    return c ?? [];
  }
  async function addCollected(users) {
    const merged = await getCollected();
    const seen = new Set(merged.map((u) => u.handle.toLowerCase()));
    for (const u of users) {
      const key = u.handle.toLowerCase();
      if (seen.has(key))
        continue;
      seen.add(key);
      merged.push(u);
    }
    await chrome.storage.local.set({ [COLLECTED_KEY]: merged });
  }
  async function removeCollected(handle) {
    const key = handle.toLowerCase();
    const next = (await getCollected()).filter((u) => u.handle.toLowerCase() !== key);
    await chrome.storage.local.set({ [COLLECTED_KEY]: next });
  }
  async function setBlocking(handles) {
    const keys = new Set(handles.map((h) => h.toLowerCase()));
    const list = await getCollected();
    let changed = false;
    for (const u of list) {
      if (keys.has(u.handle.toLowerCase()) && !u.blocking) {
        u.blocking = true;
        changed = true;
      }
    }
    if (changed)
      await chrome.storage.local.set({ [COLLECTED_KEY]: list });
  }
  async function clearBlocking() {
    const list = await getCollected();
    let changed = false;
    for (const u of list) {
      if (u.blocking) {
        delete u.blocking;
        changed = true;
      }
    }
    if (changed)
      await chrome.storage.local.set({ [COLLECTED_KEY]: list });
  }
  async function clearCollected() {
    await chrome.storage.local.set({ [COLLECTED_KEY]: [] });
  }
  async function getBlockProgress() {
    const { [PROGRESS_KEY]: p } = await chrome.storage.local.get(PROGRESS_KEY);
    return p ?? null;
  }
  async function setBlockProgress(p) {
    await chrome.storage.local.set({ [PROGRESS_KEY]: p });
  }
  async function getBlockQueue() {
    const { [QUEUE_KEY]: q } = await chrome.storage.local.get(QUEUE_KEY);
    return q ?? [];
  }
  async function setBlockQueue(handles) {
    await chrome.storage.local.set({ [QUEUE_KEY]: handles });
  }
  async function getLastError() {
    const { [ERROR_KEY]: err } = await chrome.storage.local.get(ERROR_KEY);
    return err ?? null;
  }
  async function setLastError(message) {
    await chrome.storage.local.set({ [ERROR_KEY]: message });
  }

  // src/csv.ts
  function escapeField(value) {
    if (/[",\n\r]/.test(value))
      return `"${value.replace(/"/g, '""')}"`;
    return value;
  }
  function toCsv(headers, rows) {
    return [headers, ...rows].map((r) => r.map(escapeField).join(",")).join(`\r
`);
  }
  function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;
    for (let i = 0;i < text.length; i++) {
      const ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') {
            field += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          field += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(field);
        field = "";
      } else if (ch === `
` || ch === "\r") {
        if (ch === "\r" && text[i + 1] === `
`)
          i++;
        row.push(field);
        field = "";
        rows.push(row);
        row = [];
      } else {
        field += ch;
      }
    }
    if (field !== "" || row.length) {
      row.push(field);
      rows.push(row);
    }
    return rows.filter((r) => r.length > 1 || r[0] !== "");
  }
  function downloadCsv(filename, text) {
    const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
  function pickCsv() {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".csv,text/csv";
      input.addEventListener("change", async () => {
        const file = input.files?.[0];
        resolve(file ? await file.text() : null);
      });
      input.click();
    });
  }

  // src/nav.ts
  function setBadge(id, n) {
    const el = document.getElementById(id);
    if (el)
      el.textContent = n ? `(${n}) ` : "";
  }
  async function syncCollected() {
    setBadge("navCount", (await getCollected()).length);
  }
  async function syncBlocked() {
    const handles = new Set((await getLog()).map((e) => e.handle.toLowerCase()));
    setBadge("navCountBlocked", handles.size);
  }
  function watchNavCount() {
    syncCollected();
    syncBlocked();
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local")
        return;
      if (changes.collected)
        syncCollected();
      if (changes.blockLog)
        syncBlocked();
    });
  }

  // src/blocks.ts
  var $ = (id) => document.getElementById(id);
  var countEl = $("count");
  var searchEl = $("search");
  var listEl = $("list");
  var emptyEl = $("empty");
  var pagerEl = $("pager");
  var prevBtn = $("prev");
  var nextBtn = $("next");
  var pageInfo = $("pageInfo");
  var clearBtn = $("clear");
  var exportBtn = $("export");
  var PAGE_SIZE = 25;
  var entries = [];
  var page = 0;
  var dateFmt = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  });
  function dedupe(log) {
    const seen = new Set;
    return log.filter((e) => {
      const key = e.handle.toLowerCase();
      if (seen.has(key))
        return false;
      seen.add(key);
      return true;
    });
  }
  function filtered() {
    const q = searchEl.value.trim().toLowerCase();
    if (!q)
      return entries;
    return entries.filter((e) => e.handle.toLowerCase().includes(q) || e.name.toLowerCase().includes(q));
  }
  function render() {
    const rows = filtered();
    const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    page = Math.min(page, pages - 1);
    const slice = rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
    listEl.replaceChildren(...slice.map((e) => {
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
    }));
    emptyEl.hidden = rows.length > 0;
    pagerEl.hidden = rows.length <= PAGE_SIZE;
    pageInfo.textContent = `Page ${page + 1} of ${pages}`;
    prevBtn.disabled = page === 0;
    nextBtn.disabled = page >= pages - 1;
  }
  async function load() {
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
    if (page > 0)
      page--;
    render();
  });
  nextBtn.addEventListener("click", () => {
    page++;
    render();
  });
  clearBtn.addEventListener("click", async () => {
    if (!entries.length)
      return;
    if (!confirm("Clear the entire blocked-accounts list? This can't be undone.")) {
      return;
    }
    await clearLog();
    await load();
  });
  exportBtn.addEventListener("click", () => {
    if (!entries.length)
      return;
    const csv = toCsv(["handle", "name", "reason", "blockedAt"], entries.map((e) => [e.handle, e.name, e.reason, new Date(e.at).toISOString()]));
    downloadCsv("blocked.csv", csv);
  });
  chrome.storage.onChanged.addListener((_changes, area) => {
    if (area === "local")
      load();
  });
  load();
  watchNavCount();
})();
