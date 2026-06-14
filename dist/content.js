(() => {
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
  var backdrop = null;
  var mountedLang = null;
  var grid = null;
  var blockBtn = null;
  var countEl = null;
  var statusEl = null;
  var langSel = null;
  var searchEl = null;
  var selected = new Set;
  var collected = [];
  var langFilter = "";
  var searchTerm = "";
  var blocking = false;
  var onBlock = () => {};
  function visible() {
    let rows = langFilter ? collected.filter((u) => u.lang === langFilter) : collected;
    if (searchTerm) {
      rows = rows.filter((u) => u.handle.toLowerCase().includes(searchTerm) || u.name.toLowerCase().includes(searchTerm));
    }
    return rows;
  }
  var STYLE = `
  :host { all: initial; }
  .backdrop {
    position: fixed; inset: 0; z-index: 2147483647;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0,0,0,.6);
    font: 14px/1.4 'Vazirmatn', -apple-system, system-ui, sans-serif;
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
  .lang-sel, .search {
    font: inherit; padding: 6px 10px; border-radius: 8px;
    border: 1px solid #ccd6dd; background: #fff; color: inherit;
  }
  .lang-sel { cursor: pointer; }
  .search { width: 180px; }
  @media (prefers-color-scheme: dark) {
    .card { background: #15202b; color: #e7e9ea; }
    .head, .foot { border-color: #38444d; }
    .cell { background: #1e2a36; }
    .cell:hover { background: #243340; }
    .icon-btn { color: #8b98a5; }
    .lang-sel, .search { background: #1e2a36; border-color: #38444d; }
    .status { color: #8b98a5; }
  }
`;
  function mount() {
    host = document.createElement("div");
    root = host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = STYLE;
    backdrop = document.createElement("div");
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
    title.textContent = t("review.title");
    countEl = document.createElement("span");
    countEl.className = "handle";
    const spacer = document.createElement("div");
    spacer.className = "spacer";
    searchEl = document.createElement("input");
    searchEl.className = "search";
    searchEl.type = "search";
    searchEl.placeholder = t("review.searchPlaceholder");
    searchEl.addEventListener("input", () => {
      searchTerm = searchEl.value.trim().toLowerCase();
      render();
    });
    langSel = document.createElement("select");
    langSel.className = "lang-sel";
    langSel.addEventListener("change", () => {
      langFilter = langSel.value;
      render();
    });
    const selAll = document.createElement("button");
    selAll.className = "btn btn-ghost";
    selAll.textContent = t("review.selectAll");
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
    closeBtn.textContent = t("review.close");
    closeBtn.addEventListener("click", close);
    head.append(title, countEl, spacer, searchEl, langSel, selAll, closeBtn);
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
    mountedLang = getLang();
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
    rm.title = t("common.remove");
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
      blockBtn.textContent = t("review.blockingBtn");
      blockBtn.disabled = true;
      return;
    }
    blockBtn.textContent = t("review.blockN", { n: selected.size });
    blockBtn.disabled = selected.size === 0;
  }
  function syncLangOptions() {
    if (!langSel)
      return;
    const opts = langOptions(collected);
    langSel.replaceChildren(new Option(t("common.allLanguages"), ""), ...opts.map((c) => new Option(langName(c), c)));
    if (!opts.includes(langFilter))
      langFilter = "";
    langSel.value = langFilter;
  }
  function render() {
    if (!grid || !countEl)
      return;
    syncLangOptions();
    const rows = visible();
    countEl.textContent = rows.length !== collected.length ? t("review.countFiltered", { shown: rows.length, total: collected.length }) : t("review.count", { n: collected.length });
    if (rows.length) {
      grid.replaceChildren(...rows.map(cell));
    } else {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = collected.length ? t("review.noMatches") : t("review.nothingCollected");
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
      statusEl.textContent = t("review.statusBlocking", { done: 0, total: handles.length });
    onBlock(handles, (p) => {
      if (!statusEl)
        return;
      if (p.phase === "blocking" || p.phase === "paused" || p.phase === "waiting") {
        statusEl.textContent = p.phase === "paused" ? t("review.statusPaused", {
          err: p.error ? t("review.errSuffix", { err: p.error }) : "",
          done: p.done,
          total: p.total
        }) : p.phase === "waiting" ? t("review.statusWaiting", { err: p.error ?? "", done: p.done, total: p.total }) : t("review.statusBlocking", { done: p.done, total: p.total });
        return;
      }
      blocking = false;
      statusEl.textContent = t("review.statusDone", { done: p.done, total: p.total });
      updateBlockBtn();
    });
  }
  function close() {
    if (host)
      host.style.display = "none";
  }
  async function openReview(block) {
    onBlock = block;
    setLang((await getConfig()).lang);
    if (host && mountedLang !== getLang()) {
      host.remove();
      host = null;
    }
    if (!host)
      mount();
    if (backdrop)
      backdrop.dir = isRtl() ? "rtl" : "ltr";
    host.style.display = "block";
    blocking = false;
    if (statusEl)
      statusEl.textContent = "";
    searchTerm = "";
    if (searchEl)
      searchEl.value = "";
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
    for (const t2 of timestamps) {
      if (now - t2 < DAY_MS) {
        inDay++;
        if (now - t2 < HOUR_MS)
          inHour++;
      }
    }
    if (maxPerDay > 0 && inDay >= maxPerDay)
      return "day";
    if (maxPerHour > 0 && inHour >= maxPerHour)
      return "hour";
    return null;
  }
  function capRetryMs(timestamps, maxPerHour, maxPerDay, now = Date.now()) {
    const cap = capReached(timestamps, maxPerHour, maxPerDay, now);
    if (!cap)
      return 0;
    const windowMs = cap === "day" ? DAY_MS : HOUR_MS;
    const max = cap === "day" ? maxPerDay : maxPerHour;
    const inWindow = timestamps.filter((t2) => now - t2 < windowMs).sort((a, b) => a - b);
    const pivot = inWindow[inWindow.length - max];
    return pivot + windowMs - now;
  }
  function fmtDuration(ms) {
    const s = Math.max(0, Math.round(ms / 1000));
    if (s < 60)
      return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60)
      return `${m}m`;
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m`;
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
      const opts = { words: cfg.words, normalize: cfg.persianNormalize };
      const reason = matchReason(user.name, opts) ?? matchReason(user.handle, opts);
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
  var CAP_RECHECK_MS = 30000;
  async function waitOutCap() {
    while (!paused) {
      const cfg = await getConfig();
      setLang(cfg.lang);
      const ts = (await getLog()).map((e) => e.at);
      const active = capReached(ts, cfg.maxPerHour, cfg.maxPerDay);
      if (!active)
        break;
      const waitMs = capRetryMs(ts, cfg.maxPerHour, cfg.maxPerDay);
      const limit = active === "day" ? t("run.dailyLimit", { n: cfg.maxPerDay }) : t("run.hourlyLimit", { n: cfg.maxPerHour });
      await reportProgress({
        done: blockDone,
        total: blockTotal,
        phase: "waiting",
        error: t("run.capReached", { limit, time: fmtDuration(waitMs) }),
        resumeAt: Date.now() + waitMs
      });
      await sleep(Math.min(waitMs + 1000, CAP_RECHECK_MS));
    }
    if (!paused) {
      await setLastError(null);
      await reportProgress({ done: blockDone, total: blockTotal, phase: "blocking" });
    }
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
        await waitOutCap();
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
    if (p?.phase !== "blocking" && p?.phase !== "paused" && p?.phase !== "waiting")
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
