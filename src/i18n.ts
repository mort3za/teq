// In-app i18n: a tiny string catalog plus a runtime language switch. No chrome
// or DOM dependency in the lookup layer, so t()/setLang() are unit-testable.
// The active language is stored in Config (see storage.ts); each page reads it,
// calls setLang(), then applyI18n() to localize the static markup + direction.

export type Lang = "en" | "fa";

export const LANGS: Lang[] = ["en", "fa"];

type Dict = Record<string, string>;

const en: Dict = {
  // nav (shared sidebar)
  "nav.blocked": "Blocked",
  "nav.collected": "Collected",
  "nav.ignored": "Ignored",
  "nav.options": "Options",
  "nav.credits": "Credits",
  "nav.donate": "Support Teq",

  // shared
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
  "common.tweetWordsLabel": "Phrases to match inside tweets (one per line)",

  // popup
  "popup.title": "Teq... block'em!",
  "popup.autoCollect": "Auto-collect",
  "popup.autoCollectTitle": "Auto-collect matches as you browse X",
  "popup.nothingCollected": "Nothing collected yet.",
  "popup.nothingToReview": "Nothing new to review.",
  "popup.reviewAndBlock": "Review and block",
  "popup.autoScroll": "Auto-scroll",
  "popup.stopScroll": "Stop scrolling",
  "popup.autoScrollTitle": "Scroll this X page and collect matches",
  "popup.blocked": "blocked",
  "popup.total": "in total",
  "popup.inProgress": "{n} in progress",
  "popup.collected": "collected",
  "popup.openOptions": "Settings",
  "popup.note":
    "Matches are collected as you browse X. Review the list, then block. Blocks are paced apart (configurable in Settings) to stay within X's rate limits — keep the X tab open.",
  "popup.dismissTip": "Hide this tip",
  "popup.progress.blocking": "Blocking {done} of {total}…",
  "popup.progress.paused": "Paused — {done} of {total}",
  "popup.progress.waiting": "Waiting{suffix} — {done} of {total}",
  "popup.resumesIn": " (resumes in {time})",
  "popup.aria.pause": "Pause",
  "popup.aria.resume": "Resume",
  "popup.openXControl": "Open the X tab to control the run.",
  "popup.reloadX": "Reload the X tab, then try again.",
  "popup.openXFirst": "Open an x.com tab first.",

  // options
  "options.title": "Options",
  "options.subtitle": "Blocking behaviour",
  "options.howTitle": "How it works",
  "options.importJson": "Import JSON",
  "options.exportJson": "Export JSON",
  "options.autoCollectLabel": "Auto-collect matches as you browse",
  "options.autoCollectHint":
    "When on, the content script scans X for matches automatically. Turn it off to pause collecting without losing your rules.",
  "options.wordsHint":
    "A display name containing any of these (case-insensitive) is collected. Enable \"Also match the @username\" below to match handles too.",
  "options.tweetWordsHint":
    "The author of any tweet whose text contains one of these (case-insensitive) is collected. Leave empty to match on names only.",
  "options.language": "Language",
  "options.languageHint": "Language of this extension's interface.",
  "options.persianNormalize": "Match Persian / Arabic letter and digit variants",
  "options.persianNormalizeHint":
    "Treats Arabic ي/ك and Persian ی/ک — and Arabic-Indic vs. Persian digits — as the same when matching. Off by default; turn it on for Persian/Arabic rules.",
  "options.matchHandle": "Also match the @username",
  "options.matchHandleHint":
    "Matches your words against the @username too, not just the display name. Off by default — only the display name is matched.",
  "options.advanced": "Advanced",
  "options.advancedHint": "Pacing, rate limits, and auto-scroll",
  "options.warning":
    "⚠️ These pacing and rate limits are tuned to keep blocking within X's rate limits. Raising them — or blocking faster than the recommended ranges — can get your X account rate-limited, temporarily locked, or permanently suspended. Only change these if you understand the risk.",
  "options.limitsTitle": "Why these limits aren't exact",
  "options.limitsTrust":
    "X doesn't enforce one fixed limit — it's calculated live from your account's standing. Older accounts, accounts with a linked phone number, and paid X Premium accounts tolerate far more. A brand-new, unverified free account can hit a limit after as few as ~50 blocks in a day, while an established Premium account may clear hundreds. Lower the caps below if your account is new or unverified; raise them only cautiously if it's well-established.",
  "options.limitsWindow":
    "X tracks actions in short rolling windows (typically 15 minutes and 1 hour). A 24-hour lockout is usually triggered by short-term velocity, not a daily total — repeatedly hitting the short-window limit can make X lock you out for the day. That's why \"Seconds between blocks\" matters more than the daily cap: keeping each block slow and well-spaced is your best protection.",
  "options.scanLabel": "Seconds between scans",
  "options.scanHint":
    "How often the page is automatically scanned for new matches while auto-collect is on.",
  "options.pacingLabel": "Seconds between blocks",
  "options.pacingHint":
    "Each block waits this long (plus a little random jitter) before the next. X limits how fast an account can block — 30s or more is recommended.",
  "options.maxPerHourLabel": "Max blocks per hour",
  "options.maxPerHourHint":
    "The run pauses once this many blocks happen within any rolling 60-minute window. Safe range is ~30–50; 0 disables the limit.",
  "options.maxPerDayLabel": "Max blocks per day",
  "options.maxPerDayHint":
    "The run pauses once this many blocks happen within any rolling 24-hour window. Safe range is ~200–300; approaching it can trigger a 24h cooling-off on X. 0 disables the limit.",
  "options.autoScroll": "Enable Auto-scroll",
  "options.scrollMaxFoundLabel": "Stop auto-scroll after this many found",
  "options.scrollMaxFoundHint": "One auto-scroll run stops once it has collected this many new matches. 0 disables the limit.",
  "options.autoScrollHint":
    "Shows the Auto-scroll button in the popup. It scrolls the X page for you and collects matches as it goes.",
  "options.autoScrollWarning":
    "⚠️ X's rules limit automated use of the site, and X may count auto-scroll as automated use. This can get your X account limited, locked, or suspended. Off by default — turn it on only if you accept this risk.",
  "options.reset": "Reset to defaults",
  "options.resetHint": "Restore the recommended scan, pacing, and rate-limit values above.",
  "options.saved": "Saved.",
  "options.imported": "Imported.",
  "options.importInvalid": "Import failed: invalid JSON.",
  "options.importNoSettings": "Import failed: no recognized settings.",

  // collected page
  "collected.title": "Collected accounts",
  "collected.filterByLang": "Filter by language",
  "collected.empty": "Nothing collected yet.",
  "collected.inProgress": "In progress",
  "collected.filterByStatus": "Filter by status",
  "collected.allStatuses": "All statuses",
  "collected.needsReview": "Needs review",
  "collected.ignore": "Ignore — never collect again",
  "collected.confirmClear": "Clear the entire collected list? This can't be undone.",
  "collected.importNoHandle": 'Import failed: CSV needs a "handle" column.',
  "collected.importNoRows": "Import failed: no rows with a handle found.",

  // ignored page
  "ignored.title": "Ignored accounts",
  "ignored.note": "These accounts are never collected again. Remove one to collect it as usual.",
  "ignored.empty": "Nothing ignored yet.",
  "ignored.confirmClear": "Clear the entire ignore list? This can't be undone.",

  // blocks page
  "blocks.title": "Blocked accounts",
  "blocks.empty": "No blocked accounts yet.",
  "blocks.confirmClear": "Clear the entire blocked-accounts list? This can't be undone.",

  // credits page
  "credits.title": "Credits",
  "credits.intro": "Teq uses these open source projects. Thank you!",
  "credits.vazirmatnUse": "The font of the extension.",
  "credits.lucideUse": "The icons across the extension.",

  // donate page
  "donate.title": "Keep Teq free",
  "donate.intro":
    "Teq is free and open source. It has no ads and no paid plan. If it helps you, you can support its development.",
  "donate.sponsor": "Sponsor on GitHub",
  "donate.monthly": "Monthly or one-time, no fee",
  "donate.paysFor": "Your support pays for",
  "donate.features": "New features",
  "donate.languages": "More languages",
  "donate.bugs": "Bug fixes",
  "donate.otherWays": "Other ways to help",
  "donate.noMoney": "No money? These help a lot too.",
  "donate.star": "Star the repo",
  "donate.starHint": "More stars, more people find it.",
  "donate.report": "Report a bug or idea",
  "donate.reportHint": "Tell us what to fix or add.",
  "donate.tell": "Tell a friend",
  "donate.copied": "Link copied!",
  "donate.copy": "Click to copy the link.",

  // review overlay (Shadow DOM on x.com)
  "review.title": "Review & block",
  "review.searchPlaceholder": "Search name or @handle",
  "review.selectAll": "Select all",
  "review.deselectAll": "Deselect all",
  "review.close": "Close",
  "review.ignore": "Ignore — never collect again",
  "review.showTweet": "Show the tweet text",
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

  // block run (content script, surfaced in progress text)
  "run.dailyLimit": "Daily limit ({n})",
  "run.hourlyLimit": "Hourly limit ({n})",
  "run.capReached": "{limit} reached — auto-resuming in {time}.",
  "run.rateLimited": "X says too many requests (429) — auto-resuming in {time}.",

  // auto-scroll pill (on x.com)
  "scroll.running": "Scrolling… {n} found",
  "scroll.limited": "X rate limit — resuming in {time} · {n} found",
  "scroll.end": "Reached the end — {n} found",
  "scroll.max": "Reached the limit — {n} found",
  "scroll.stopped": "Stopped — {n} found",
  "scroll.stop": "Stop",
  "scroll.stopHint": "Or scroll, click or press any key",
  "scroll.review": "Review",
};

const fa: Dict = {
  "nav.blocked": "بلاک‌شده‌ها",
  "nav.collected": "جمع‌آوری‌شده‌ها",
  "nav.ignored": "نادیده‌گرفته‌شده‌ها",
  "nav.options": "تنظیمات",
  "nav.credits": "قدردانی",
  "nav.donate": "حمایت",

  "common.total": "مجموع",
  "common.clear": "پاک کردن",
  "common.clearList": "پاک کردن فهرست",
  "common.importCsv": "بارگذاری CSV",
  "common.exportCsv": "استخراج CSV",
  "common.searchPlaceholder": "جستجو بر اساس نام کاربری یا نام…",
  "common.allLanguages": "همهٔ زبان‌ها",
  "common.remove": "حذف",
  "common.prev": "→ قبلی",
  "common.next": "بعدی ←",
  "common.pageInfo": "صفحهٔ {page} از {pages}",
  "common.wordsLabel": "کلمات / ایموجی برای تطبیق (هر کدام در یک خط)",
  "common.tweetWordsLabel": "عبارت‌ها برای تطبیق در متن توییت (هر کدام در یک خط)",

  "popup.title": "تق... بلاکشون کن!",
  "popup.autoCollect": "جمع‌آوری خودکار",
  "popup.autoCollectTitle": "جمع‌آوری خودکار موارد منطبق هنگام مرور X",
  "popup.nothingCollected": "هنوز چیزی جمع‌آوری نشده.",
  "popup.nothingToReview": "مورد تازه‌ای برای بررسی نیست.",
  "popup.reviewAndBlock": "بررسی و بلاک",
  "popup.autoScroll": "اسکرول خودکار",
  "popup.stopScroll": "توقف اسکرول",
  "popup.autoScrollTitle": "اسکرول خودکار این صفحهٔ X و جمع‌آوری موارد منطبق",
  "popup.blocked": "بلاک‌شده",
  "popup.total": "در مجموع",
  "popup.inProgress": "در حال بلاک: {n}",
  "popup.collected": "جمع‌آوری‌شده",
  "popup.openOptions": "تنظیمات",
  "popup.note":
    "موارد منطبق هنگام مرور X جمع‌آوری می‌شوند. فهرست را بررسی کنید، سپس بلاک کنید. بلاک‌ها با فاصلهٔ زمانی (قابل تنظیم در تنظیمات) انجام می‌شوند تا در محدودهٔ محدودیت‌های نرخ X بمانند — تب X را باز نگه دارید.",
  "popup.dismissTip": "پنهان کردن این راهنما",
  "popup.progress.blocking": "در حال بلاک کردن {done} از {total}…",
  "popup.progress.paused": "متوقف شد — {done} از {total}",
  "popup.progress.waiting": "در انتظار{suffix} — {done} از {total}",
  "popup.resumesIn": " (ازسرگیری در {time})",
  "popup.aria.pause": "توقف",
  "popup.aria.resume": "ازسرگیری",
  "popup.openXControl": "برای کنترل اجرا، تب X را باز کنید.",
  "popup.reloadX": "تب X را دوباره بارگذاری کنید و دوباره تلاش کنید.",
  "popup.openXFirst": "ابتدا یک تب x.com باز کنید.",

  "options.title": "تنظیمات",
  "options.subtitle": "رفتار بلاک",
  "options.howTitle": "چطور کار می‌کند",
  "options.importJson": "بارگذاری JSON",
  "options.exportJson": "استخراج JSON",
  "options.autoCollectLabel": "جمع‌آوری خودکار موارد منطبق هنگام مرور",
  "options.autoCollectHint":
    "وقتی روشن باشد، اسکریپت محتوا به‌طور خودکار X را برای موارد منطبق اسکن می‌کند. برای توقف جمع‌آوری بدون از دست رفتن قواعد، آن را خاموش کنید.",
  "options.wordsHint":
    "هر نام نمایشی که شامل هر یک از این‌ها باشد (بدون حساسیت به بزرگی/کوچکی) جمع‌آوری می‌شود. برای تطبیق نام کاربری هم، گزینهٔ «تطبیق با @نام‌کاربری» پایین را روشن کنید.",
  "options.tweetWordsHint":
    "نویسندهٔ هر توییتی که متنش شامل یکی از این عبارت‌ها باشد (بدون حساسیت به بزرگی/کوچکی) جمع‌آوری می‌شود. برای تطبیق تنها بر اساس نام، خالی بگذارید.",
  "options.language": "زبان",
  "options.languageHint": "زبان رابط کاربری این افزونه.",
  "options.persianNormalize": "تطبیق گونه‌های حروف و ارقام فارسی / عربی",
  "options.persianNormalizeHint":
    "هنگام تطبیق، ي/ك عربی و ی/ک فارسی — و ارقام عربی در برابر فارسی — یکسان در نظر گرفته می‌شوند. به‌طور پیش‌فرض خاموش است؛ برای قواعد فارسی/عربی روشنش کنید.",
  "options.matchHandle": "تطبیق با @نام‌کاربری",
  "options.matchHandleHint":
    "کلمات شما را علاوه بر نام نمایشی، با @نام‌کاربری هم تطبیق می‌دهد. به‌طور پیش‌فرض خاموش است — تنها نام نمایشی تطبیق داده می‌شود.",
  "options.advanced": "پیشرفته",
  "options.advancedHint": "فاصلهٔ بلاک‌ها، سقف‌ها و اسکرول خودکار",
  "options.warning":
    "⚠️ این فاصله‌ها و محدودیت‌های نرخ طوری تنظیم شده‌اند که بلاک در محدودهٔ محدودیت‌های نرخ X بماند. افزایش آن‌ها — یا بلاک سریع‌تر از بازه‌های توصیه‌شده — می‌تواند حساب X شما را محدود، موقتاً قفل یا برای همیشه معلق کند. فقط در صورتی این‌ها را تغییر دهید که خطر را می‌دانید.",
  "options.limitsTitle": "چرا این محدودیت‌ها دقیق نیستند",
  "options.limitsTrust":
    "سایت X یک محدودیت ثابت اعمال نمی‌کند — این مقدار به‌صورت زنده بر اساس اعتبار حساب شما محاسبه می‌شود. حساب‌های قدیمی‌تر، حساب‌هایی با شمارهٔ تلفن متصل، و حساب‌های پولی X Premium تحمل بسیار بیشتری دارند. یک حساب رایگانِ کاملاً جدید و تأییدنشده ممکن است تنها پس از حدود ۵۰ بلاک در روز به محدودیت برسد، در حالی که یک حساب جاافتادهٔ Premium می‌تواند صدها مورد را بدون مشکل انجام دهد. اگر حساب شما جدید یا تأییدنشده است سقف‌های زیر را پایین بیاورید؛ تنها در صورت جاافتاده بودن حساب، با احتیاط آن‌ها را بالا ببرید.",
  "options.limitsWindow":
    "سایت X کنش‌ها را در بازه‌های متحرک کوتاه (معمولاً ۱۵ دقیقه و ۱ ساعت) دنبال می‌کند. قفل ۲۴ ساعته معمولاً به‌خاطر سرعت کوتاه‌مدت رخ می‌دهد، نه مجموع روزانه — برخورد مکرر به محدودیت بازهٔ کوتاه می‌تواند باعث شود X برای آن روز قفل‌تان کند. به همین دلیل «ثانیه بین هر بلاک» مهم‌تر از سقف روزانه است: آهسته و بافاصله نگه داشتن هر بلاک بهترین محافظت شماست.",
  "options.scanLabel": "ثانیه بین هر اسکن",
  "options.scanHint":
    "هر چند وقت یک‌بار صفحه به‌طور خودکار برای موارد منطبق جدید اسکن شود، تا وقتی جمع‌آوری خودکار روشن است.",
  "options.pacingLabel": "ثانیه بین هر بلاک",
  "options.pacingHint":
    "هر بلاک این مدت (به‌علاوهٔ کمی تأخیر تصادفی) پیش از بعدی صبر می‌کند. سایت X سرعت بلاک هر حساب را محدود می‌کند — ۳۰ ثانیه یا بیشتر توصیه می‌شود.",
  "options.maxPerHourLabel": "حداکثر بلاک در ساعت",
  "options.maxPerHourHint":
    "اجرا پس از این تعداد بلاک در هر بازهٔ متحرک ۶۰ دقیقه‌ای متوقف می‌شود. بازهٔ ایمن حدود ۳۰ تا ۵۰ است؛ ۰ محدودیت را غیرفعال می‌کند.",
  "options.maxPerDayLabel": "حداکثر بلاک در روز",
  "options.maxPerDayHint":
    "اجرا پس از این تعداد بلاک در هر بازهٔ متحرک ۲۴ ساعته متوقف می‌شود. بازهٔ ایمن حدود ۲۰۰ تا ۳۰۰ است؛ نزدیک شدن به آن می‌تواند یک دورهٔ خنک‌سازی ۲۴ ساعته در X ایجاد کند. ۰ محدودیت را غیرفعال می‌کند.",
  "options.autoScroll": "فعال‌سازی اسکرول خودکار",
  "options.scrollMaxFoundLabel": "توقف اسکرول خودکار پس از این تعداد مورد",
  "options.scrollMaxFoundHint": "هر اجرای اسکرول خودکار وقتی این تعداد مورد تازه جمع کند، متوقف می‌شود. مقدار ۰ این محدودیت را خاموش می‌کند.",
  "options.autoScrollHint":
    "دکمهٔ «اسکرول خودکار» را در پاپ‌آپ نشان می‌دهد. این دکمه صفحهٔ X را برایتان پایین می‌برد و هم‌زمان موارد منطبق را جمع‌آوری می‌کند.",
  "options.autoScrollWarning":
    "⚠️ قوانین X استفادهٔ خودکار از سایت را محدود می‌کند و ممکن است X اسکرول خودکار را استفادهٔ خودکار به حساب آورد. این کار می‌تواند حساب X شما را محدود، قفل یا معلق کند. به‌طور پیش‌فرض خاموش است — فقط در صورتی روشنش کنید که این خطر را می‌پذیرید.",
  "options.reset": "بازنشانی به پیش‌فرض",
  "options.resetHint": "مقادیر توصیه‌شدهٔ اسکن، فاصله و محدودیت نرخ بالا را بازگردانید.",
  "options.saved": "ذخیره شد.",
  "options.imported": "وارد شد.",
  "options.importInvalid": "بارگذاری ناموفق: JSON نامعتبر.",
  "options.importNoSettings": "بارگذاری ناموفق: تنظیمات شناخته‌شده‌ای یافت نشد.",

  "collected.title": "حساب‌های جمع‌آوری‌شده",
  "collected.filterByLang": "فیلتر بر اساس زبان",
  "collected.empty": "هنوز چیزی جمع‌آوری نشده.",
  "collected.inProgress": "در حال انجام",
  "collected.filterByStatus": "فیلتر بر اساس وضعیت",
  "collected.allStatuses": "همهٔ وضعیت‌ها",
  "collected.needsReview": "در انتظار بررسی",
  "collected.ignore": "نادیده بگیر — دیگر جمع‌آوری نشود",
  "collected.confirmClear": "کل فهرست جمع‌آوری‌شده پاک شود؟ این کار قابل بازگشت نیست.",
  "collected.importNoHandle": "بارگذاری ناموفق: فایل CSV به ستون «handle» نیاز دارد.",
  "collected.importNoRows": "بارگذاری ناموفق: هیچ ردیفی با نام کاربری یافت نشد.",

  "ignored.title": "حساب‌های نادیده‌گرفته‌شده",
  "ignored.note": "این حساب‌ها دیگر هرگز جمع‌آوری نمی‌شوند. برای جمع‌آوری دوباره، مورد را حذف کنید.",
  "ignored.empty": "هنوز چیزی نادیده گرفته نشده.",
  "ignored.confirmClear": "کل فهرست نادیده‌گرفته‌شده پاک شود؟ این کار قابل بازگشت نیست.",

  "blocks.title": "حساب‌های بلاک‌شده",
  "blocks.empty": "هنوز حسابی بلاک نشده.",
  "blocks.confirmClear": "کل فهرست حساب‌های بلاک‌شده پاک شود؟ این کار قابل بازگشت نیست.",

  "credits.title": "قدردانی",
  "credits.intro": "افزونهٔ تق از این پروژه‌های متن‌باز استفاده می‌کند. سپاس!",
  "credits.vazirmatnUse": "قلم افزونه.",
  "credits.lucideUse": "آیکون‌های سراسر افزونه.",

  "donate.title": "کمک کنید تق رایگان بماند",
  "donate.intro":
    "افزونهٔ تق رایگان و متن‌باز است. نه تبلیغ دارد و نه طرح پولی. اگر به کارتان می‌آید، می‌توانید از توسعهٔ آن حمایت کنید.",
  "donate.sponsor": "حمایت در GitHub",
  "donate.monthly": "ماهانه یا یک‌باره، بدون کارمزد",
  "donate.paysFor": "حمایت شما هزینهٔ این‌ها را می‌دهد",
  "donate.features": "قابلیت‌های تازه",
  "donate.languages": "زبان‌های بیشتر",
  "donate.bugs": "رفع اشکال",
  "donate.otherWays": "راه‌های دیگر کمک",
  "donate.noMoney": "پول ندارید؟ این‌ها هم خیلی کمک می‌کنند.",
  "donate.star": "به مخزن ستاره بدهید",
  "donate.starHint": "ستارهٔ بیشتر یعنی افراد بیشتری آن را پیدا می‌کنند.",
  "donate.report": "گزارش اشکال یا ایده",
  "donate.reportHint": "بگویید چه چیزی را درست یا اضافه کنیم.",
  "donate.tell": "به یک دوست بگویید",
  "donate.copied": "پیوند کپی شد!",
  "donate.copy": "برای کپی پیوند کلیک کنید.",

  "review.title": "بررسی و بلاک",
  "review.searchPlaceholder": "جستجوی نام یا @نام‌کاربری",
  "review.selectAll": "انتخاب همه",
  "review.deselectAll": "لغو انتخاب همه",
  "review.close": "بستن",
  "review.ignore": "نادیده بگیر — دیگر جمع‌آوری نشود",
  "review.showTweet": "نمایش متن توییت",
  "review.noMatches": "موردی یافت نشد.",
  "review.nothingCollected": "چیزی جمع‌آوری نشده.",
  "review.blockingBtn": "در حال بلاک کردن…",
  "review.blockN": "بلاک {n} مورد انتخاب‌شده",
  "review.count": "{n} جمع‌آوری‌شده",
  "review.countFiltered": "{shown} از {total} جمع‌آوری‌شده",
  "review.statusBlocking": "در حال بلاک کردن {done}/{total}…",
  "review.statusPaused": "متوقف شد{err} — {done}/{total}",
  "review.statusWaiting": "{err} — {done}/{total}",
  "review.statusDone": "انجام شد — {done}/{total} بلاک شد.",
  "review.errSuffix": " ({err})",

  "run.dailyLimit": "محدودیت روزانه ({n})",
  "run.hourlyLimit": "محدودیت ساعتی ({n})",
  "run.capReached": "{limit} رسید — ازسرگیری خودکار در {time}.",
  "run.rateLimited": "ایکس می‌گوید درخواست‌ها زیاد است (۴۲۹) — ازسرگیری خودکار در {time}.",

  "scroll.running": "در حال اسکرول… پیدا شده: {n}",
  "scroll.limited": "محدودیت درخواست ایکس — ادامه در {time} · پیدا شده: {n}",
  "scroll.end": "به انتهای فهرست رسید — پیدا شده: {n}",
  "scroll.max": "به سقف تعیین‌شده رسید — پیدا شده: {n}",
  "scroll.stopped": "متوقف شد — پیدا شده: {n}",
  "scroll.stop": "توقف",
  "scroll.stopHint": "یا اسکرول کنید، کلیک کنید یا یک کلید بزنید",
  "scroll.review": "بررسی",
};

const DICTS: Record<Lang, Dict> = { en, fa };

let current: Lang = "en";

/** Browser UI locale → our nearest supported language. Falls back to English. */
export function detectLang(): Lang {
  try {
    return chrome.i18n.getUILanguage().toLowerCase().startsWith("fa") ? "fa" : "en";
  } catch {
    return "en";
  }
}

export function setLang(l: Lang): void {
  current = DICTS[l] ? l : "en";
}

export function getLang(): Lang {
  return current;
}

export function isRtl(l: Lang = current): boolean {
  return l === "fa";
}

/** Look up a key in the active language (falling back to English, then the raw
 * key) and substitute `{name}` placeholders from `params`. */
export function t(key: string, params?: Record<string, string | number>): string {
  const tmpl = DICTS[current][key] ?? en[key] ?? key;
  if (!params) return tmpl;
  return tmpl.replace(/\{(\w+)\}/g, (m, name: string) =>
    name in params ? String(params[name]) : m,
  );
}

/** Localize a document: set <html> dir/lang and fill any [data-i18n*] nodes.
 * Safe to call repeatedly (e.g. when the language changes live). */
export function applyI18n(doc: Document = document): void {
  const html = doc.documentElement;
  html.lang = current;
  html.dir = isRtl() ? "rtl" : "ltr";

  for (const el of doc.querySelectorAll<HTMLElement>("[data-i18n]")) {
    el.textContent = t(el.dataset.i18n!);
  }
  for (const el of doc.querySelectorAll<HTMLElement>("[data-i18n-placeholder]")) {
    (el as HTMLInputElement).placeholder = t(el.dataset.i18nPlaceholder!);
  }
  for (const el of doc.querySelectorAll<HTMLElement>("[data-i18n-title]")) {
    el.title = t(el.dataset.i18nTitle!);
  }
  for (const el of doc.querySelectorAll<HTMLElement>("[data-i18n-aria]")) {
    el.setAttribute("aria-label", t(el.dataset.i18nAria!));
  }
}
