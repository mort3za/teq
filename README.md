# x-teq

Chrome extension. Collect X.com (Twitter) users whose **display name** matches your word/emoji rules, review them, then block.

## What it does

- Hit **Collect matches** in the popup to scan the open x.com page for user cells. Read display name + @handle.
- Match against your rules: word substrings (case-insensitive); emoji listed as words match too.
- Matches are added to a review list in the popup (username + display name) with checkboxes and remove buttons.
- Pick who to block and hit **Block selected** → blocked via X's own `blocks/create` API (same call the site makes when you click "Block").
- Rate-limited: min seconds/block + jitter. Never blocks yourself.
- On 401/403/429 → stops the run, leaving the rest collected.

## Rules (config)

| field    | meaning                                 | default |
| -------- | --------------------------------------- | ------- |
| `words`  | substrings; name containing any → match | `[]`    |

Config in `chrome.storage.sync` (roams). Collected list, block log, and last error in `chrome.storage.local` (log keeps last 500 entries).

### How the rate limit works

Blocks aren't fired off instantly. Each one waits ~60 seconds (plus up to 30% random jitter) before the next. This pacing is deliberate and **not configurable**: X treats rapid-fire blocking as bot activity. If you go too fast X responds with a 429/403/401, at which point the run stops and the remaining accounts stay collected. Keeping the delay human-paced is what keeps your account out of trouble. Keep the X tab open while blocking runs.

## Install (no build needed)

The prebuilt extension is committed in [`dist/`](dist/), so you can install it without any tooling.

1. Download this repo: click **Code → Download ZIP** on GitHub and unzip it, or `git clone` it.
2. Open `chrome://extensions` in Chrome.
3. Toggle **Developer mode** on (top-right corner).
4. Click **Load unpacked** and pick the `dist/` folder from the repo.
5. The extension appears in the toolbar. Click it, set your rules, then use **Collect matches** and **Block selected**.

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
- Collecting reads the page as it's currently rendered — scroll to load more cells, then collect again to pick them up.
