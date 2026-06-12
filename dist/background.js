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

  // src/background.ts
  var GREEN = "#00ba7c";
  var YELLOW = "#f5b800";
  var SIZES = [16, 32, 48];
  var runners = 0;
  var dotColor = null;
  async function dottedIcon(color) {
    const out = {};
    for (const size of SIZES) {
      const res = await fetch(chrome.runtime.getURL(`icons/icon${size}.png`));
      const bitmap = await createImageBitmap(await res.blob());
      const canvas = new OffscreenCanvas(size, size);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(bitmap, 0, 0, size, size);
      const r = size * 0.26;
      const cx = size - r;
      const cy = r;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.74, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      out[size] = ctx.getImageData(0, 0, size, size);
    }
    return out;
  }
  function hideDot() {
    chrome.action.setIcon({
      path: Object.fromEntries(SIZES.map((s) => [s, `icons/icon${s}.png`]))
    });
  }
  async function syncDot() {
    if (runners === 0) {
      if (dotColor !== null) {
        dotColor = null;
        hideDot();
      }
      return;
    }
    const p = await getBlockProgress();
    const color = p?.phase === "paused" ? YELLOW : GREEN;
    if (color === dotColor)
      return;
    dotColor = color;
    chrome.action.setIcon({ imageData: await dottedIcon(color) });
  }
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== "block-run")
      return;
    runners++;
    syncDot();
    port.onDisconnect.addListener(() => {
      runners = Math.max(0, runners - 1);
      syncDot();
    });
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.blockProgress)
      syncDot();
  });
})();
