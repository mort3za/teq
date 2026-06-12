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

  // src/popup.ts
  var $ = (id) => document.getElementById(id);
  var words = $("words");
  var autoCollect = $("autoCollect");
  var errorBox = $("error");
  var count = $("count");
  var runStatus = $("runStatus");
  var collectedList = $("collectedList");
  var collectedCount = $("collectedCount");
  var collectedEmpty = $("collectedEmpty");
  var clearCollectedBtn = $("clearCollected");
  var reviewBtn = $("review");
  var progress = $("progress");
  var progressText = $("progressText");
  var pauseToggle = $("pauseToggle");
  var X_URL = /^https?:\/\/(x|twitter)\.com\//;
  async function load() {
    const cfg = await getConfig();
    words.value = cfg.words.join(`
`);
    autoCollect.checked = cfg.autoCollect;
    const err = await getLastError();
    errorBox.hidden = !err;
    errorBox.textContent = err ?? "";
    const log = await getLog();
    const handles = new Set(log.map((e) => e.handle.toLowerCase()));
    count.textContent = String(handles.size);
    await renderCollected();
    await renderProgress();
  }
  async function renderProgress() {
    applyProgress(await getBlockProgress());
  }
  var shownProgress = null;
  function applyProgress(p) {
    shownProgress = p;
    const active = p?.phase === "blocking" || p?.phase === "paused";
    progress.hidden = !active;
    if (!active)
      return;
    const isPaused = p.phase === "paused";
    progressText.textContent = isPaused ? `Paused — ${p.done} of ${p.total}` : `Blocking ${p.done} of ${p.total}…`;
    progress.classList.toggle("paused", isPaused);
    pauseToggle.textContent = isPaused ? "▶" : "⏸";
    pauseToggle.setAttribute("aria-label", isPaused ? "Resume" : "Pause");
  }
  async function xTab() {
    const tabs = await chrome.tabs.query({ url: ["*://x.com/*", "*://twitter.com/*"] });
    return tabs[0] ?? null;
  }
  pauseToggle.addEventListener("click", () => {
    const p = shownProgress;
    if (p?.phase !== "blocking" && p?.phase !== "paused")
      return;
    const pausing = p.phase !== "paused";
    applyProgress({ ...p, phase: pausing ? "paused" : "blocking" });
    sendToggle(pausing);
  });
  async function sendToggle(pausing) {
    const tab = await xTab();
    if (!tab?.id) {
      runStatus.textContent = "Open the X tab to control the run.";
      return;
    }
    try {
      await chrome.tabs.sendMessage(tab.id, { type: pausing ? "pauseBlocking" : "resumeBlocking" });
    } catch {
      runStatus.textContent = "Reload the X tab, then try again.";
    }
  }
  function who(u) {
    const span = document.createElement("span");
    span.className = "who";
    const name = document.createElement("strong");
    name.textContent = u.name || u.handle;
    const handle = document.createElement("span");
    handle.className = "handle";
    handle.textContent = `@${u.handle}`;
    span.append(name, handle);
    return span;
  }
  function row(u) {
    const li = document.createElement("li");
    li.append(who(u));
    return li;
  }
  async function renderCollected() {
    const collected = [...await getCollected()].reverse();
    collectedCount.textContent = `${collected.length} collected`;
    collectedEmpty.hidden = collected.length > 0;
    clearCollectedBtn.hidden = collected.length === 0;
    reviewBtn.disabled = collected.length === 0;
    collectedList.replaceChildren(...collected.map(row));
  }
  async function save() {
    await setConfig({ words: parseWords(words.value), autoCollect: autoCollect.checked });
  }
  words.addEventListener("input", () => void save());
  autoCollect.addEventListener("change", () => void save());
  async function activeXTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !X_URL.test(tab.url ?? "")) {
      runStatus.textContent = "Open an x.com tab first.";
      return null;
    }
    return tab;
  }
  async function review() {
    const tab = await activeXTab();
    if (!tab)
      return;
    try {
      await chrome.tabs.sendMessage(tab.id, { type: "review" });
      window.close();
    } catch {
      runStatus.textContent = "Reload the X tab, then try again.";
    }
  }
  reviewBtn.addEventListener("click", () => void review());
  clearCollectedBtn.addEventListener("click", async () => {
    await clearCollected();
    await renderCollected();
  });
  chrome.storage.onChanged.addListener((_changes, area) => {
    if (area === "local")
      load();
  });
  load();
})();
