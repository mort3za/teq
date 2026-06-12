# x-teq

Chrome extension. Collect X.com (Twitter) users whose **display name or @handle** matches your word/emoji rules, review them, then block.

## What it does

- As you browse x.com it **auto-scans** the rendered page for user cells (display name + @handle) on an interval. No clicking required — matches just accumulate. (You can turn auto-collect off and scan on demand with **Collect matches** in the popup instead.)
- Match against your rules: word substrings (case-insensitive); emoji listed as words match too. Both the display name **and** the @username are checked.
- Each match also records the **language** of the tweet it was found on (from X's own `lang` attribute), so you can review by language later.
- Matches accumulate in a **collected list**. Open **Review** to see them all in a full-page overlay: filter by language, select who to block, remove ones you don't want.
- Hit **Block selected** → blocked via X's own `blocks/create` API (the same call the site makes when you click "Block"). Never blocks yourself.
- The run is **paced and capped** so X doesn't flag it as automation (see below). You can **pause/resume** it at any time, and it **survives a tab reload** — a run picks up where it left off.
- On 401/403/429 → the run **pauses** (it doesn't die), leaving the rest queued so you can resume after a break.

## Rules & settings (config)

Edit rules and the auto-collect toggle in the popup; the full settings live on the **Options** page (`options.html`, opens in a tab).

| field          | meaning                                                            | default |
| -------------- | ------------------------------------------------------------------ | ------- |
| `words`        | substrings; display name or @handle containing any → match         | `[]`    |
| `autoCollect`  | auto-scan the page for matches on an interval                      | `true`  |
| `scanSeconds`  | seconds between automatic page scans                               | `3`     |
| `pacingSeconds`| base seconds to wait between blocks (+ up to 30% random jitter)     | `30`    |
| `maxPerHour`   | max blocks in any rolling 60-minute window (`0` = no limit)        | `40`    |
| `maxPerDay`    | max blocks in any rolling 24-hour window (`0` = no limit)          | `250`   |

Config lives in `chrome.storage.sync` (roams with your account). The collected list, block log, run progress, the active block queue, and last error live in `chrome.storage.local` (the log keeps the last 500 entries).

On the Options page you can also **export** the config to a JSON file and **import** it back — handy for backup or sharing your rules.

### How the pacing & rate limits work

X treats rapid-fire blocking as bot activity, so blocks are never fired off instantly:

- **Pacing** — each block waits `pacingSeconds` (default 30s) plus up to 30% random jitter before the next. The jitter keeps the cadence from looking mechanical.
- **Rolling caps** — the run also stops once you've blocked `maxPerHour` accounts within the trailing hour, or `maxPerDay` within the trailing day. These count against the **block log**, so the limit holds across tab reloads and separate runs — it tracks your account, not a single run.
- When a cap is hit (or X returns a 429/403/401) the run **pauses** rather than dies. The remaining accounts stay queued; resume from the popup after a break.

Keep the X tab open while a run is in progress — blocking only happens from the content script on the x.com origin. A small dot on the toolbar icon shows run state: **green** while blocking, **yellow** while paused.

## Install (no build needed)

The prebuilt extension is committed in [`dist/`](dist/), so you can install it without any tooling.

1. Download this repo: click **Code → Download ZIP** on GitHub and unzip it, or `git clone` it.
2. Open `chrome://extensions` in Chrome.
3. Toggle **Developer mode** on (top-right corner).
4. Click **Load unpacked** and pick the `dist/` folder from the repo.
5. The extension appears in the toolbar. Click it, set your rules, then browse x.com and use **Review** → **Block selected**.

## Pages

- **Popup** (toolbar icon) — edit rules, toggle auto-collect, see the collected count and live run progress (with pause/resume), open **Review**, and link to the standalone pages.
- **Review overlay** — injected full-page into x.com (style-isolated in a Shadow DOM): language filter, select all, per-row remove, and **Block selected**. Stays open during the paced run so you can watch progress.
- **Options** — full settings (rules, auto-collect, scan interval, pacing, hourly/daily caps) plus config export/import.
- **Collected** — standalone page to search/paginate/clear the collected list.
- **Blocks** — standalone page to search/paginate/clear the block log.

## Build from source (optional)

```sh
bun install
bun run build        # → dist/
bun run watch        # rebuild on change
bun test
```

After a rebuild (`bun run build` / `bun run watch`), hit the **reload** ↻ icon on the extension card in `chrome://extensions` to pick up the new code.

## Notes

- Bearer token in `blocker.ts` is x.com's public web-app token, not a secret.
- Blocking runs from the content script on x.com origin → cookies + ct0 CSRF ride along, exactly like the web app.
- Collecting reads the page as it's currently rendered — scroll to load more cells and (with auto-collect on) they get picked up on the next scan.
