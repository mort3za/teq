(() => {
  // src/i18n.ts
  var en = {
    "nav.blocked": "Blocked",
    "nav.collected": "Collected",
    "nav.options": "Options",
    "common.total": "total",
    "common.clear": "Clear",
    "common.clearList": "Clear list",
    "common.importCsv": "Import CSV",
    "common.exportCsv": "Export CSV",
    "common.searchPlaceholder": "Search by username or name…",
    "common.allLanguages": "All languages",
    "common.remove": "Remove",
    "common.prev": "← Prev",
    "common.next": "Next →",
    "common.pageInfo": "Page {page} of {pages}",
    "common.wordsLabel": "Words / emoji to match (one per line)",
    "popup.title": "Teq... block'em!",
    "popup.autoCollect": "Auto-collect",
    "popup.autoCollectTitle": "Auto-collect matches as you browse X",
    "popup.viewAll": "View all →",
    "popup.nothingCollected": "Nothing collected yet.",
    "popup.reviewAndBlock": "Review and block",
    "popup.blockedTotal": "blocked total",
    "popup.recentBlocks": "Recent blocks →",
    "popup.note": "Matches are collected as you browse X. Review the list, then block. Blocks are paced apart (configurable in Options) to stay under X's automation radar — keep the X tab open.",
    "popup.collectedCount": "{n} collected",
    "popup.progress.blocking": "Blocking {done} of {total}…",
    "popup.progress.paused": "Paused — {done} of {total}",
    "popup.progress.waiting": "Waiting{suffix} — {done} of {total}",
    "popup.resumesIn": " (resumes in {time})",
    "popup.aria.pause": "Pause",
    "popup.aria.resume": "Resume",
    "popup.openXControl": "Open the X tab to control the run.",
    "popup.reloadX": "Reload the X tab, then try again.",
    "popup.openXFirst": "Open an x.com tab first.",
    "options.title": "Options",
    "options.subtitle": "Blocking behaviour",
    "options.importJson": "Import JSON",
    "options.exportJson": "Export JSON",
    "options.autoCollectLabel": "Auto-collect matches as you browse",
    "options.autoCollectHint": "When on, the content script scans X for matches automatically. Turn it off to pause collecting without losing your rules.",
    "options.wordsHint": "A display name or @handle containing any of these (case-insensitive) is collected.",
    "options.language": "Language",
    "options.languageHint": "Language of this extension's interface.",
    "options.persianNormalize": "Match Persian / Arabic letter and digit variants",
    "options.persianNormalizeHint": "Treats Arabic ي/ك and Persian ی/ک — and Arabic-Indic vs. Persian digits — as the same when matching. Off by default; turn it on for Persian/Arabic rules.",
    "options.advanced": "Advanced",
    "options.warning": "⚠️ These pacing and rate limits are tuned to keep blocking under X's automation radar. Raising them — or blocking faster than the recommended ranges — makes your activity look automated, which can get your X account rate-limited, temporarily locked, or permanently suspended. Only change these if you understand the risk.",
    "options.scanLabel": "Seconds between scans",
    "options.scanHint": "How often the page is automatically scanned for new matches while auto-collect is on.",
    "options.pacingLabel": "Seconds between blocks",
    "options.pacingHint": "Each block waits this long (plus a little random jitter) before the next. X flags rapid-fire blocking as automation — 30s or more is recommended.",
    "options.maxPerHourLabel": "Max blocks per hour",
    "options.maxPerHourHint": "The run pauses once this many blocks happen within any rolling 60-minute window. Safe range is ~30–50; 0 disables the limit.",
    "options.maxPerDayLabel": "Max blocks per day",
    "options.maxPerDayHint": "The run pauses once this many blocks happen within any rolling 24-hour window. Safe range is ~200–300; approaching it can trigger a 24h cooling-off on X. 0 disables the limit.",
    "options.reset": "Reset to defaults",
    "options.resetHint": "Restore the recommended scan, pacing, and rate-limit values above.",
    "options.saved": "Saved.",
    "options.imported": "Imported.",
    "options.importInvalid": "Import failed: invalid JSON.",
    "options.importNoSettings": "Import failed: no recognized settings.",
    "collected.title": "Collected accounts",
    "collected.filterByLang": "Filter by language",
    "collected.empty": "Nothing collected yet.",
    "collected.inProgress": "In progress",
    "collected.confirmClear": "Clear the entire collected list? This can't be undone.",
    "collected.importNoHandle": 'Import failed: CSV needs a "handle" column.',
    "collected.importNoRows": "Import failed: no rows with a handle found.",
    "blocks.title": "Blocked accounts",
    "blocks.empty": "No blocked accounts yet.",
    "blocks.confirmClear": "Clear the entire blocked-accounts list? This can't be undone.",
    "review.title": "Review & block",
    "review.searchPlaceholder": "Search name or @handle",
    "review.selectAll": "Select all",
    "review.close": "Close",
    "review.noMatches": "No matches.",
    "review.nothingCollected": "Nothing collected.",
    "review.blockingBtn": "Blocking…",
    "review.blockN": "Block {n} selected",
    "review.count": "{n} collected",
    "review.countFiltered": "{shown} of {total} collected",
    "review.statusBlocking": "Blocking {done}/{total}…",
    "review.statusPaused": "Paused{err} — {done}/{total}",
    "review.statusWaiting": "{err} — {done}/{total}",
    "review.statusDone": "Done — blocked {done}/{total}.",
    "review.errSuffix": " ({err})",
    "run.dailyLimit": "Daily limit ({n})",
    "run.hourlyLimit": "Hourly limit ({n})",
    "run.capReached": "{limit} reached — auto-resuming in {time}."
  };
  var fa = {
    "nav.blocked": "مسدودشده‌ها",
    "nav.collected": "جمع‌آوری‌شده‌ها",
    "nav.options": "تنظیمات",
    "common.total": "مجموع",
    "common.clear": "پاک کردن",
    "common.clearList": "پاک کردن فهرست",
    "common.importCsv": "ورود CSV",
    "common.exportCsv": "خروج CSV",
    "common.searchPlaceholder": "جستجو بر اساس نام کاربری یا نام…",
    "common.allLanguages": "همهٔ زبان‌ها",
    "common.remove": "حذف",
    "common.prev": "→ قبلی",
    "common.next": "بعدی ←",
    "common.pageInfo": "صفحهٔ {page} از {pages}",
    "common.wordsLabel": "کلمات / ایموجی برای تطبیق (هر کدام در یک خط)",
    "popup.title": "تک... بلاکشون کن!",
    "popup.autoCollect": "جمع‌آوری خودکار",
    "popup.autoCollectTitle": "جمع‌آوری خودکار موارد منطبق هنگام مرور X",
    "popup.viewAll": "مشاهدهٔ همه ←",
    "popup.nothingCollected": "هنوز چیزی جمع‌آوری نشده.",
    "popup.reviewAndBlock": "بررسی و مسدودسازی",
    "popup.blockedTotal": "مجموع مسدودشده",
    "popup.recentBlocks": "مسدودسازی‌های اخیر ←",
    "popup.note": "موارد منطبق هنگام مرور X جمع‌آوری می‌شوند. فهرست را بررسی کنید، سپس مسدود کنید. مسدودسازی‌ها با فاصلهٔ زمانی (قابل تنظیم در تنظیمات) انجام می‌شوند تا از رادار خودکارسازی X دور بمانند — تب X را باز نگه دارید.",
    "popup.collectedCount": "{n} جمع‌آوری‌شده",
    "popup.progress.blocking": "در حال مسدودسازی {done} از {total}…",
    "popup.progress.paused": "متوقف شد — {done} از {total}",
    "popup.progress.waiting": "در انتظار{suffix} — {done} از {total}",
    "popup.resumesIn": " (ازسرگیری در {time})",
    "popup.aria.pause": "توقف",
    "popup.aria.resume": "ازسرگیری",
    "popup.openXControl": "برای کنترل اجرا، تب X را باز کنید.",
    "popup.reloadX": "تب X را دوباره بارگذاری کنید و دوباره تلاش کنید.",
    "popup.openXFirst": "ابتدا یک تب x.com باز کنید.",
    "options.title": "تنظیمات",
    "options.subtitle": "رفتار مسدودسازی",
    "options.importJson": "ورود JSON",
    "options.exportJson": "خروج JSON",
    "options.autoCollectLabel": "جمع‌آوری خودکار موارد منطبق هنگام مرور",
    "options.autoCollectHint": "وقتی روشن باشد، اسکریپت محتوا به‌طور خودکار X را برای موارد منطبق اسکن می‌کند. برای توقف جمع‌آوری بدون از دست رفتن قواعد، آن را خاموش کنید.",
    "options.wordsHint": "هر نام نمایشی یا @نام‌کاربری که شامل هر یک از این‌ها باشد (بدون حساسیت به بزرگی/کوچکی) جمع‌آوری می‌شود.",
    "options.language": "زبان",
    "options.languageHint": "زبان رابط کاربری این افزونه.",
    "options.persianNormalize": "تطبیق گونه‌های حروف و ارقام فارسی / عربی",
    "options.persianNormalizeHint": "هنگام تطبیق، ي/ك عربی و ی/ک فارسی — و ارقام عربی در برابر فارسی — یکسان در نظر گرفته می‌شوند. به‌طور پیش‌فرض خاموش است؛ برای قواعد فارسی/عربی روشنش کنید.",
    "options.advanced": "پیشرفته",
    "options.warning": "⚠️ این فاصله‌ها و محدودیت‌های نرخ طوری تنظیم شده‌اند که مسدودسازی زیر رادار خودکارسازی X بماند. افزایش آن‌ها — یا مسدودسازی سریع‌تر از بازه‌های توصیه‌شده — فعالیت شما را خودکار جلوه می‌دهد و می‌تواند حساب X شما را محدود، موقتاً قفل یا برای همیشه معلق کند. فقط در صورتی این‌ها را تغییر دهید که خطر را می‌دانید.",
    "options.scanLabel": "ثانیه بین هر اسکن",
    "options.scanHint": "هر چند وقت یک‌بار صفحه به‌طور خودکار برای موارد منطبق جدید اسکن شود، تا وقتی جمع‌آوری خودکار روشن است.",
    "options.pacingLabel": "ثانیه بین هر مسدودسازی",
    "options.pacingHint": "هر مسدودسازی این مدت (به‌علاوهٔ کمی تأخیر تصادفی) پیش از بعدی صبر می‌کند. X مسدودسازی پرسرعت را خودکار تشخیص می‌دهد — ۳۰ ثانیه یا بیشتر توصیه می‌شود.",
    "options.maxPerHourLabel": "حداکثر مسدودسازی در ساعت",
    "options.maxPerHourHint": "اجرا پس از این تعداد مسدودسازی در هر بازهٔ متحرک ۶۰ دقیقه‌ای متوقف می‌شود. بازهٔ ایمن حدود ۳۰ تا ۵۰ است؛ ۰ محدودیت را غیرفعال می‌کند.",
    "options.maxPerDayLabel": "حداکثر مسدودسازی در روز",
    "options.maxPerDayHint": "اجرا پس از این تعداد مسدودسازی در هر بازهٔ متحرک ۲۴ ساعته متوقف می‌شود. بازهٔ ایمن حدود ۲۰۰ تا ۳۰۰ است؛ نزدیک شدن به آن می‌تواند یک دورهٔ خنک‌سازی ۲۴ ساعته در X ایجاد کند. ۰ محدودیت را غیرفعال می‌کند.",
    "options.reset": "بازنشانی به پیش‌فرض",
    "options.resetHint": "مقادیر توصیه‌شدهٔ اسکن، فاصله و محدودیت نرخ بالا را بازگردانید.",
    "options.saved": "ذخیره شد.",
    "options.imported": "وارد شد.",
    "options.importInvalid": "ورود ناموفق: JSON نامعتبر.",
    "options.importNoSettings": "ورود ناموفق: تنظیمات شناخته‌شده‌ای یافت نشد.",
    "collected.title": "حساب‌های جمع‌آوری‌شده",
    "collected.filterByLang": "فیلتر بر اساس زبان",
    "collected.empty": "هنوز چیزی جمع‌آوری نشده.",
    "collected.inProgress": "در حال انجام",
    "collected.confirmClear": "کل فهرست جمع‌آوری‌شده پاک شود؟ این کار قابل بازگشت نیست.",
    "collected.importNoHandle": "ورود ناموفق: فایل CSV به ستون «handle» نیاز دارد.",
    "collected.importNoRows": "ورود ناموفق: هیچ ردیفی با نام کاربری یافت نشد.",
    "blocks.title": "حساب‌های مسدودشده",
    "blocks.empty": "هنوز حسابی مسدود نشده.",
    "blocks.confirmClear": "کل فهرست حساب‌های مسدودشده پاک شود؟ این کار قابل بازگشت نیست.",
    "review.title": "بررسی و مسدودسازی",
    "review.searchPlaceholder": "جستجوی نام یا @نام‌کاربری",
    "review.selectAll": "انتخاب همه",
    "review.close": "بستن",
    "review.noMatches": "موردی یافت نشد.",
    "review.nothingCollected": "چیزی جمع‌آوری نشده.",
    "review.blockingBtn": "در حال مسدودسازی…",
    "review.blockN": "مسدودسازی {n} مورد انتخاب‌شده",
    "review.count": "{n} جمع‌آوری‌شده",
    "review.countFiltered": "{shown} از {total} جمع‌آوری‌شده",
    "review.statusBlocking": "در حال مسدودسازی {done}/{total}…",
    "review.statusPaused": "متوقف شد{err} — {done}/{total}",
    "review.statusWaiting": "{err} — {done}/{total}",
    "review.statusDone": "انجام شد — {done}/{total} مسدود شد.",
    "review.errSuffix": " ({err})",
    "run.dailyLimit": "محدودیت روزانه ({n})",
    "run.hourlyLimit": "محدودیت ساعتی ({n})",
    "run.capReached": "{limit} رسید — ازسرگیری خودکار در {time}."
  };
  var DICTS = { en, fa };
  var current = "en";
  function detectLang() {
    try {
      return chrome.i18n.getUILanguage().toLowerCase().startsWith("fa") ? "fa" : "en";
    } catch {
      return "en";
    }
  }
  function setLang(l) {
    current = DICTS[l] ? l : "en";
  }
  function getLang() {
    return current;
  }
  function isRtl(l = current) {
    return l === "fa";
  }
  function t(key, params) {
    const tmpl = DICTS[current][key] ?? en[key] ?? key;
    if (!params)
      return tmpl;
    return tmpl.replace(/\{(\w+)\}/g, (m, name) => (name in params) ? String(params[name]) : m);
  }
  function applyI18n(doc = document) {
    const html = doc.documentElement;
    html.lang = current;
    html.dir = isRtl() ? "rtl" : "ltr";
    for (const el of doc.querySelectorAll("[data-i18n]")) {
      el.textContent = t(el.dataset.i18n);
    }
    for (const el of doc.querySelectorAll("[data-i18n-placeholder]")) {
      el.placeholder = t(el.dataset.i18nPlaceholder);
    }
    for (const el of doc.querySelectorAll("[data-i18n-title]")) {
      el.title = t(el.dataset.i18nTitle);
    }
    for (const el of doc.querySelectorAll("[data-i18n-aria]")) {
      el.setAttribute("aria-label", t(el.dataset.i18nAria));
    }
  }

  // src/storage.ts
  var DEFAULT_CONFIG = {
    words: [],
    autoCollect: true,
    scanSeconds: 3,
    pacingSeconds: 30,
    maxPerHour: 40,
    maxPerDay: 250,
    lang: detectLang(),
    persianNormalize: false
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
  var FOLD = {
    "ي": "ی",
    "ى": "ی",
    "ك": "ک",
    "‌": ""
  };
  function normalizePersian(text) {
    let out = text.normalize("NFC").replace(/[يىك‌]/g, (c) => FOLD[c]);
    out = out.replace(/[٠-٩۰-۹]/g, (c) => {
      const code = c.codePointAt(0);
      const base = code >= 1776 ? 1776 : 1632;
      return String(code - base);
    });
    return out;
  }
  function matchReason(name, opts) {
    const fold = (s) => (opts.normalize ? normalizePersian(s) : s).toLowerCase();
    const haystack = fold(name);
    for (const word of opts.words) {
      const trimmed = word.trim();
      const needle = fold(trimmed);
      if (needle && haystack.includes(needle))
        return trimmed;
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
  var langEl = $("lang");
  var persianNormalize = $("persianNormalize");
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
    setLang(cfg.lang);
    applyI18n();
    langEl.value = cfg.lang;
    persianNormalize.checked = cfg.persianNormalize;
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
      persianNormalize: persianNormalize.checked,
      scanSeconds,
      pacingSeconds,
      maxPerHour: perHour,
      maxPerDay: perDay
    });
    note(t("options.saved"));
  }
  async function changeLang() {
    const lang = langEl.value === "fa" ? "fa" : "en";
    await setConfig({ lang });
    setLang(lang);
    applyI18n();
  }
  langEl.addEventListener("change", () => void changeLang());
  persianNormalize.addEventListener("change", () => void save());
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
        note(t("options.importInvalid"));
        return;
      }
      const patch = {};
      if (Array.isArray(data.words)) {
        patch.words = data.words.map(String);
      }
      if (typeof data.autoCollect === "boolean") {
        patch.autoCollect = data.autoCollect;
      }
      if (typeof data.persianNormalize === "boolean") {
        patch.persianNormalize = data.persianNormalize;
      }
      if (data.lang === "en" || data.lang === "fa") {
        patch.lang = data.lang;
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
        note(t("options.importNoSettings"));
        return;
      }
      await setConfig(patch);
      await load();
      note(t("options.imported"));
    });
    input.click();
  });
  load();
  watchNavCount();
})();
