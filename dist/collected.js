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

  // src/lang.ts
  var names = typeof Intl !== "undefined" && "DisplayNames" in Intl ? new Intl.DisplayNames(undefined, { type: "language" }) : null;
  function langName(code) {
    try {
      return names?.of(code) ?? code;
    } catch {
      return code;
    }
  }
  function langOptions(users) {
    const set = new Set;
    for (const u of users)
      if (u.lang)
        set.add(u.lang);
    return [...set].sort((a, b) => langName(a).localeCompare(langName(b)));
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

  // src/collected.ts
  var $ = (id) => document.getElementById(id);
  var countEl = $("count");
  var searchEl = $("search");
  var langEl = $("lang");
  var listEl = $("list");
  var emptyEl = $("empty");
  var pagerEl = $("pager");
  var prevBtn = $("prev");
  var nextBtn = $("next");
  var pageInfo = $("pageInfo");
  var clearBtn = $("clear");
  var exportBtn = $("export");
  var importBtn = $("import");
  var PAGE_SIZE = 25;
  var users = [];
  var page = 0;
  function filtered() {
    const q = searchEl.value.trim().toLowerCase();
    const lang = langEl.value;
    return users.filter((u) => {
      if (lang && u.lang !== lang)
        return false;
      if (!q)
        return true;
      return u.handle.toLowerCase().includes(q) || u.name.toLowerCase().includes(q);
    });
  }
  function syncLangOptions() {
    const opts = langOptions(users);
    const current = langEl.value;
    langEl.replaceChildren(new Option("All languages", ""), ...opts.map((c) => new Option(langName(c), c)));
    langEl.value = opts.includes(current) ? current : "";
  }
  function render() {
    const rows = filtered();
    const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    page = Math.min(page, pages - 1);
    const slice = rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
    listEl.replaceChildren(...slice.map((u) => {
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
        badge.textContent = "In progress";
        meta.append(badge);
      }
      const rm = document.createElement("button");
      rm.type = "button";
      rm.className = "remove";
      rm.title = "Remove";
      rm.textContent = "✕";
      rm.addEventListener("click", async () => {
        await removeCollected(u.handle);
        await load();
      });
      li.append(link, name, meta, rm);
      return li;
    }));
    emptyEl.hidden = rows.length > 0;
    pagerEl.hidden = rows.length <= PAGE_SIZE;
    pageInfo.textContent = `Page ${page + 1} of ${pages}`;
    prevBtn.disabled = page === 0;
    nextBtn.disabled = page >= pages - 1;
  }
  async function load() {
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
    if (page > 0)
      page--;
    render();
  });
  nextBtn.addEventListener("click", () => {
    page++;
    render();
  });
  clearBtn.addEventListener("click", async () => {
    if (!users.length)
      return;
    if (!confirm("Clear the entire collected list? This can't be undone.")) {
      return;
    }
    await clearCollected();
    await load();
  });
  exportBtn.addEventListener("click", () => {
    if (!users.length)
      return;
    const csv = toCsv(["handle", "name", "reason", "lang"], users.map((u) => [u.handle, u.name, u.reason, u.lang ?? ""]));
    downloadCsv("collected.csv", csv);
  });
  importBtn.addEventListener("click", async () => {
    const text = await pickCsv();
    if (text == null)
      return;
    const rows = parseCsv(text);
    if (!rows.length)
      return;
    const header = rows[0].map((h) => h.trim().toLowerCase());
    const col = (name) => header.indexOf(name);
    const iHandle = col("handle");
    const iName = col("name");
    const iReason = col("reason");
    const iLang = col("lang");
    if (iHandle === -1) {
      alert('Import failed: CSV needs a "handle" column.');
      return;
    }
    const imported = [];
    for (const row of rows.slice(1)) {
      const handle = (row[iHandle] ?? "").trim().replace(/^@/, "");
      if (!handle)
        continue;
      const user = {
        handle,
        name: iName === -1 ? "" : (row[iName] ?? "").trim(),
        reason: iReason === -1 ? "" : (row[iReason] ?? "").trim()
      };
      const lang = iLang === -1 ? "" : (row[iLang] ?? "").trim();
      if (lang)
        user.lang = lang;
      imported.push(user);
    }
    if (!imported.length) {
      alert("Import failed: no rows with a handle found.");
      return;
    }
    await addCollected(imported);
    await load();
  });
  chrome.storage.onChanged.addListener((_changes, area) => {
    if (area === "local")
      load();
  });
  load();
  watchNavCount();
})();
