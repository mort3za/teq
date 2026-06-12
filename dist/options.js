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

  // src/matcher.ts
  function matchReason(name, opts) {
    const haystack = name.toLowerCase();
    for (const word of opts.words) {
      const needle = word.trim().toLowerCase();
      if (needle && haystack.includes(needle))
        return word.trim();
    }
    return null;
  }
  function parseWords(text) {
    return text.split(`
`).map((line) => line.trim()).filter((line) => line.length > 0);
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

  // src/options.ts
  var $ = (id) => document.getElementById(id);
  var wordsEl = $("words");
  var autoCollect = $("autoCollect");
  var scan = $("scan");
  var pacing = $("pacing");
  var maxPerHour = $("maxPerHour");
  var maxPerDay = $("maxPerDay");
  var status = $("status");
  var exportBtn = $("export");
  var importBtn = $("import");
  var resetAdvancedBtn = $("resetAdvanced");
  function note(msg) {
    status.textContent = msg;
    setTimeout(() => status.textContent = "", 1500);
  }
  async function load() {
    const cfg = await getConfig();
    wordsEl.value = cfg.words.join(`
`);
    autoCollect.checked = cfg.autoCollect;
    scan.value = String(cfg.scanSeconds);
    pacing.value = String(cfg.pacingSeconds);
    maxPerHour.value = String(cfg.maxPerHour);
    maxPerDay.value = String(cfg.maxPerDay);
  }
  function normalizedSeconds(el, fallback) {
    let n = Math.round(Number(el.value));
    if (!Number.isFinite(n))
      n = fallback;
    if (n < 1)
      n = 1;
    return n;
  }
  function normalizedCap(el, fallback) {
    let n = Math.round(Number(el.value));
    if (!Number.isFinite(n))
      n = fallback;
    if (n < 0)
      n = 0;
    return n;
  }
  async function save() {
    const scanSeconds = normalizedSeconds(scan, DEFAULT_CONFIG.scanSeconds);
    const pacingSeconds = normalizedSeconds(pacing, DEFAULT_CONFIG.pacingSeconds);
    const perHour = normalizedCap(maxPerHour, DEFAULT_CONFIG.maxPerHour);
    const perDay = normalizedCap(maxPerDay, DEFAULT_CONFIG.maxPerDay);
    scan.value = String(scanSeconds);
    pacing.value = String(pacingSeconds);
    maxPerHour.value = String(perHour);
    maxPerDay.value = String(perDay);
    await setConfig({
      words: parseWords(wordsEl.value),
      autoCollect: autoCollect.checked,
      scanSeconds,
      pacingSeconds,
      maxPerHour: perHour,
      maxPerDay: perDay
    });
    note("Saved.");
  }
  wordsEl.addEventListener("input", () => void save());
  autoCollect.addEventListener("change", () => void save());
  scan.addEventListener("change", () => void save());
  pacing.addEventListener("change", () => void save());
  maxPerHour.addEventListener("change", () => void save());
  maxPerDay.addEventListener("change", () => void save());
  resetAdvancedBtn.addEventListener("click", async () => {
    scan.value = String(DEFAULT_CONFIG.scanSeconds);
    pacing.value = String(DEFAULT_CONFIG.pacingSeconds);
    maxPerHour.value = String(DEFAULT_CONFIG.maxPerHour);
    maxPerDay.value = String(DEFAULT_CONFIG.maxPerDay);
    await save();
  });
  exportBtn.addEventListener("click", async () => {
    const cfg = await getConfig();
    const blob = new Blob([JSON.stringify(cfg, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "teq-config.json";
    a.click();
    URL.revokeObjectURL(url);
  });
  importBtn.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      if (!file)
        return;
      let data;
      try {
        data = JSON.parse(await file.text());
      } catch {
        note("Import failed: invalid JSON.");
        return;
      }
      const patch = {};
      if (Array.isArray(data.words)) {
        patch.words = data.words.map(String);
      }
      if (typeof data.autoCollect === "boolean") {
        patch.autoCollect = data.autoCollect;
      }
      if (Number.isFinite(data.scanSeconds)) {
        patch.scanSeconds = Math.max(1, Math.round(data.scanSeconds));
      }
      if (Number.isFinite(data.pacingSeconds)) {
        patch.pacingSeconds = Math.max(1, Math.round(data.pacingSeconds));
      }
      if (Number.isFinite(data.maxPerHour)) {
        patch.maxPerHour = Math.max(0, Math.round(data.maxPerHour));
      }
      if (Number.isFinite(data.maxPerDay)) {
        patch.maxPerDay = Math.max(0, Math.round(data.maxPerDay));
      }
      if (!Object.keys(patch).length) {
        note("Import failed: no recognized settings.");
        return;
      }
      await setConfig(patch);
      await load();
      note("Imported.");
    });
    input.click();
  });
  load();
  watchNavCount();
})();
