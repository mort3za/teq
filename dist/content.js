(() => {
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

  // src/blocker.ts
  var BEARER = "AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";
  var BLOCK_URL = "https://x.com/i/api/1.1/blocks/create.json";

  class BlockError extends Error {
    status;
    constructor(message, status) {
      super(message);
      this.status = status;
      this.name = "BlockError";
    }
  }
  function getCookie(name) {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  }
  async function blockUser(handle) {
    const csrf = getCookie("ct0");
    if (!csrf)
      throw new BlockError("No ct0 cookie — are you logged in?", 0);
    const res = await fetch(BLOCK_URL, {
      method: "POST",
      credentials: "include",
      headers: {
        authorization: `Bearer ${BEARER}`,
        "x-csrf-token": csrf,
        "x-twitter-auth-type": "OAuth2Session",
        "x-twitter-active-user": "yes",
        "content-type": "application/x-www-form-urlencoded"
      },
      body: `screen_name=${encodeURIComponent(handle)}`
    });
    if (!res.ok) {
      throw new BlockError(`Block ${handle} failed (HTTP ${res.status})`, res.status);
    }
  }

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

  // src/review.ts
  var host = null;
  var root = null;
  var grid = null;
  var blockBtn = null;
  var countEl = null;
  var statusEl = null;
  var langSel = null;
  var selected = new Set;
  var collected = [];
  var langFilter = "";
  var blocking = false;
  var onBlock = () => {};
  function visible() {
    return langFilter ? collected.filter((u) => u.lang === langFilter) : collected;
  }
  var STYLE = `
  :host { all: initial; }
  .backdrop {
    position: fixed; inset: 0; z-index: 2147483647;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0,0,0,.6);
    font: 14px/1.4 -apple-system, system-ui, sans-serif;
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
  .lang-sel {
    font: inherit; padding: 6px 10px; border-radius: 8px;
    border: 1px solid #ccd6dd; background: #fff; color: inherit; cursor: pointer;
  }
  @media (prefers-color-scheme: dark) {
    .card { background: #15202b; color: #e7e9ea; }
    .head, .foot { border-color: #38444d; }
    .cell { background: #1e2a36; }
    .cell:hover { background: #243340; }
    .icon-btn { color: #8b98a5; }
    .lang-sel { background: #1e2a36; border-color: #38444d; }
    .status { color: #8b98a5; }
  }
`;
  function mount() {
    host = document.createElement("div");
    root = host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = STYLE;
    const backdrop = document.createElement("div");
    backdrop.className = "backdrop";
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop)
        close();
    });
    const card = document.createElement("div");
    card.className = "card";
    const head = document.createElement("div");
    head.className = "head";
    const title = document.createElement("h2");
    title.textContent = "Review & block";
    countEl = document.createElement("span");
    countEl.className = "handle";
    const spacer = document.createElement("div");
    spacer.className = "spacer";
    langSel = document.createElement("select");
    langSel.className = "lang-sel";
    langSel.addEventListener("change", () => {
      langFilter = langSel.value;
      render();
    });
    const selAll = document.createElement("button");
    selAll.className = "btn btn-ghost";
    selAll.textContent = "Select all";
    selAll.addEventListener("click", () => {
      const rows = visible();
      const keys = rows.map((u) => u.handle.toLowerCase());
      const allSelected = keys.every((k) => selected.has(k));
      if (allSelected)
        for (const k of keys)
          selected.delete(k);
      else
        for (const k of keys)
          selected.add(k);
      render();
    });
    const closeBtn = document.createElement("button");
    closeBtn.className = "btn btn-ghost";
    closeBtn.textContent = "Close";
    closeBtn.addEventListener("click", close);
    head.append(title, countEl, spacer, langSel, selAll, closeBtn);
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
    chrome.storage.onChanged.addListener((_c, area) => {
      if (area === "local" && host && host.style.display !== "none")
        refresh();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && host && host.style.display !== "none")
        close();
    });
  }
  function cell(u) {
    const key = u.handle.toLowerCase();
    const el = document.createElement("div");
    el.className = "cell";
    const label = document.createElement("label");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = selected.has(key);
    cb.addEventListener("change", () => {
      if (cb.checked)
        selected.add(key);
      else
        selected.delete(key);
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
    rm.title = "Remove";
    rm.textContent = "✕";
    rm.addEventListener("click", async () => {
      selected.delete(key);
      await removeCollected(u.handle);
      await refresh();
    });
    el.append(label, rm);
    return el;
  }
  function updateBlockBtn() {
    if (!blockBtn)
      return;
    if (blocking) {
      blockBtn.textContent = "Blocking…";
      blockBtn.disabled = true;
      return;
    }
    blockBtn.textContent = `Block ${selected.size} selected`;
    blockBtn.disabled = selected.size === 0;
  }
  function syncLangOptions() {
    if (!langSel)
      return;
    const opts = langOptions(collected);
    langSel.replaceChildren(new Option("All languages", ""), ...opts.map((c) => new Option(langName(c), c)));
    if (!opts.includes(langFilter))
      langFilter = "";
    langSel.value = langFilter;
  }
  function render() {
    if (!grid || !countEl)
      return;
    syncLangOptions();
    const rows = visible();
    countEl.textContent = langFilter && rows.length !== collected.length ? `${rows.length} of ${collected.length} collected` : `${collected.length} collected`;
    if (rows.length) {
      grid.replaceChildren(...rows.map(cell));
    } else {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = collected.length ? "None in this language." : "Nothing collected.";
      grid.replaceChildren(empty);
    }
    updateBlockBtn();
  }
  async function refresh() {
    collected = [...await getCollected()].reverse();
    const present = new Set(collected.map((u) => u.handle.toLowerCase()));
    selected = new Set([...selected].filter((k) => present.has(k)));
    render();
  }
  function doBlock() {
    if (blocking)
      return;
    const handles = collected.map((u) => u.handle).filter((h) => selected.has(h.toLowerCase()));
    if (!handles.length)
      return;
    blocking = true;
    updateBlockBtn();
    if (statusEl)
      statusEl.textContent = `Blocking 0/${handles.length}…`;
    onBlock(handles, (p) => {
      if (!statusEl)
        return;
      if (p.phase === "blocking" || p.phase === "paused") {
        statusEl.textContent = p.phase === "paused" ? `Paused${p.error ? ` (${p.error})` : ""} — ${p.done}/${p.total}` : `Blocking ${p.done}/${p.total}…`;
        return;
      }
      blocking = false;
      statusEl.textContent = `Done — blocked ${p.done}/${p.total}.`;
      updateBlockBtn();
    });
  }
  function close() {
    if (host)
      host.style.display = "none";
  }
  async function openReview(block) {
    onBlock = block;
    if (!host)
      mount();
    host.style.display = "block";
    blocking = false;
    if (statusEl)
      statusEl.textContent = "";
    collected = [...await getCollected()].reverse();
    selected = new Set(collected.map((u) => u.handle.toLowerCase()));
    render();
  }

  // src/pacing.ts
  var PACING_JITTER = 0.3;
  function blockDelayMs(pacingSeconds, rand = Math.random()) {
    const base = pacingSeconds * 1000;
    return base + rand * base * PACING_JITTER;
  }
  var HOUR_MS = 60 * 60 * 1000;
  var DAY_MS = 24 * HOUR_MS;
  function capReached(timestamps, maxPerHour, maxPerDay, now = Date.now()) {
    let inHour = 0;
    let inDay = 0;
    for (const t of timestamps) {
      if (now - t < DAY_MS) {
        inDay++;
        if (now - t < HOUR_MS)
          inHour++;
      }
    }
    if (maxPerDay > 0 && inDay >= maxPerDay)
      return "day";
    if (maxPerHour > 0 && inHour >= maxPerHour)
      return "hour";
    return null;
  }

  // src/content.ts
  var sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  var ownHandle = null;
  var blockQueue = [];
  var draining = false;
  var paused = false;
  var blockTotal = 0;
  var blockDone = 0;
  var onBlockProgress = null;
  var runPort = null;
  async function reportProgress(p) {
    onBlockProgress?.(p);
    await setBlockProgress(p);
  }
  function detectOwnHandle() {
    const btn = document.querySelector('[data-testid="SideNav_AccountSwitcher_Button"]');
    const m = btn?.textContent?.match(/@([A-Za-z0-9_]+)/);
    if (m)
      ownHandle = m[1].toLowerCase();
  }
  function richText(el) {
    let out = "";
    for (const node of el.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        out += node.textContent ?? "";
      } else if (node instanceof HTMLImageElement) {
        out += node.alt;
      } else if (node instanceof Element) {
        out += richText(node);
      }
    }
    return out;
  }
  function extractUser(el) {
    let handle = "";
    for (const a of el.querySelectorAll('a[href^="/"]')) {
      const href = a.getAttribute("href") ?? "";
      const m = href.match(/^\/([A-Za-z0-9_]+)$/);
      if (m) {
        handle = m[1];
        break;
      }
    }
    if (!handle)
      return null;
    const full = richText(el).trim();
    const at = full.indexOf("@" + handle);
    const name = (at >= 0 ? full.slice(0, at) : full).trim();
    return { handle, name };
  }
  function tweetLang(userNameEl) {
    const scope = userNameEl.closest("article") ?? userNameEl.closest('[data-testid="cellInnerDiv"]');
    const text = scope?.querySelector('[data-testid="tweetText"]');
    const lang = text?.getAttribute("lang")?.trim();
    return lang && lang !== "und" ? lang : undefined;
  }
  async function collect() {
    const cfg = await getConfig();
    const existing = new Set((await getCollected()).map((u) => u.handle.toLowerCase()));
    for (const e of await getLog())
      existing.add(e.handle.toLowerCase());
    const found = [];
    for (const el of document.querySelectorAll('[data-testid="User-Name"]')) {
      const user = extractUser(el);
      if (!user)
        continue;
      const key = user.handle.toLowerCase();
      if (key === ownHandle || existing.has(key))
        continue;
      existing.add(key);
      const reason = matchReason(user.name, cfg) ?? matchReason(user.handle, cfg);
      if (!reason)
        continue;
      found.push({ handle: user.handle, name: user.name, reason, lang: tweetLang(el) });
    }
    if (found.length)
      await addCollected(found);
    return found.length;
  }
  function enqueueBlocks(handles, onProgress) {
    for (const h of handles) {
      if (!blockQueue.some((q) => q.toLowerCase() === h.toLowerCase())) {
        blockQueue.push(h);
      }
    }
    onBlockProgress = onProgress ?? null;
    blockTotal = blockQueue.length;
    blockDone = 0;
    paused = false;
    setBlocking(handles);
    setBlockQueue(blockQueue);
    setBlockProgress({ done: 0, total: blockTotal, phase: "blocking" });
    if (!draining)
      drain();
  }
  function pauseRun(error) {
    if (!draining || paused)
      return;
    paused = true;
    reportProgress({ done: blockDone, total: blockTotal, phase: "paused", error });
  }
  function resumeRun() {
    if (!paused)
      return;
    paused = false;
    setLastError(null);
    reportProgress({ done: blockDone, total: blockTotal, phase: "blocking" });
  }
  async function drain() {
    draining = true;
    runPort = chrome.runtime.connect({ name: "block-run" });
    while (blockQueue.length) {
      while (paused)
        await sleep(400);
      const cfg = await getConfig();
      const cap = capReached((await getLog()).map((e) => e.at), cfg.maxPerHour, cfg.maxPerDay);
      if (cap) {
        const msg = cap === "day" ? `Daily limit reached (${cfg.maxPerDay} blocks) — resume after a 24h break.` : `Hourly limit reached (${cfg.maxPerHour} blocks) — resume after a break.`;
        await setLastError(msg);
        pauseRun(msg);
        continue;
      }
      const handle = blockQueue[0];
      const entry = (await getCollected()).find((u) => u.handle.toLowerCase() === handle.toLowerCase());
      if (!entry) {
        blockQueue.shift();
        await setBlockQueue(blockQueue);
        continue;
      }
      try {
        await blockUser(handle);
        await addLog({
          handle,
          name: entry.name,
          reason: entry.reason,
          at: Date.now()
        });
        await removeCollected(handle);
        await setLastError(null);
        blockDone++;
        blockQueue.shift();
        await setBlockQueue(blockQueue);
      } catch (err) {
        const status = err instanceof BlockError ? err.status : -1;
        const message = String(err instanceof Error ? err.message : err);
        await setLastError(message);
        if (status === 429 || status === 403 || status === 401) {
          pauseRun(message);
          continue;
        }
        blockQueue.shift();
        await setBlockQueue(blockQueue);
      }
      await reportProgress({ done: blockDone, total: blockTotal, phase: "blocking" });
      if (blockQueue.length) {
        await sleep(blockDelayMs(cfg.pacingSeconds));
      }
    }
    draining = false;
    await clearBlocking();
    await setBlockQueue([]);
    await reportProgress({ done: blockDone, total: blockTotal, phase: "done" });
    runPort?.disconnect();
    runPort = null;
  }
  async function resumeInterruptedRun() {
    if (draining)
      return;
    const p = await getBlockProgress();
    if (p?.phase !== "blocking" && p?.phase !== "paused")
      return;
    const queue = await getBlockQueue();
    if (!queue.length) {
      await clearBlocking();
      await setBlockProgress({ ...p, phase: "done" });
      return;
    }
    blockQueue.push(...queue);
    blockTotal = p.total;
    blockDone = p.done;
    paused = p.phase === "paused";
    drain();
  }
  function start() {
    detectOwnHandle();
    resumeInterruptedRun();
    const tick = async () => {
      let seconds = DEFAULT_CONFIG.scanSeconds;
      try {
        const cfg = await getConfig();
        seconds = cfg.scanSeconds;
        if (cfg.autoCollect)
          await collect();
      } finally {
        setTimeout(() => void tick(), Math.max(1, seconds) * 1000);
      }
    };
    tick();
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      if (msg?.type === "collect") {
        collect().then((collected2) => sendResponse({ collected: collected2 }));
        return true;
      }
      if (msg?.type === "review") {
        openReview(enqueueBlocks);
        sendResponse({ ok: true });
        return;
      }
      if (msg?.type === "pauseBlocking") {
        pauseRun();
        sendResponse({ ok: true });
        return;
      }
      if (msg?.type === "resumeBlocking") {
        resumeRun();
        sendResponse({ ok: true });
        return;
      }
      return;
    });
  }
  start();
})();
