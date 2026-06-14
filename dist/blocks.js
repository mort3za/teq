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
    pageInfo.textContent = t("common.pageInfo", { page: page + 1, pages });
    prevBtn.disabled = page === 0;
    nextBtn.disabled = page >= pages - 1;
  }
  async function load() {
    setLang((await getConfig()).lang);
    applyI18n();
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
    if (!confirm(t("blocks.confirmClear"))) {
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
