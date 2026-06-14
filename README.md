# teq

A Chrome extension that finds X.com (Twitter) accounts by **name or @handle** and blocks them for you — safely, in the background, while you browse.

You write a few rules (words or emoji). As you scroll X, teq quietly collects everyone whose display name or handle matches. When you're ready, you review the list and block them in one click. teq then blocks them one at a time, slowly enough that X never sees a bot.

> **Heads up:** Blocking is hard to undo at scale. teq always lets you review and edit the list before anything happens — nothing is blocked automatically.

---

## Install

A ready-to-use build lives in [`dist/`](dist/), so you don't need any tools.

1. **Download the repo** — _Code → Download ZIP_ on GitHub (or `git clone`), then unzip.
2. Open **`chrome://extensions`** in Chrome.
3. Turn on **Developer mode** (top-right).
4. Click **Load unpacked** and select the **`dist/`** folder.

The teq icon appears in your toolbar. You're ready.

---

## How to use it

**1. Set your rules.** Click the toolbar icon and add words or emoji — one per line. A match is a case-insensitive substring, checked against both the display name _and_ the @handle.

**2. Browse X.** Leave auto-collect on (the default) and just scroll. teq scans the page every few seconds and adds matching accounts to your **collected list**. No clicking required.

**3. Review and block.** Open **Review** from the popup for a full-page list of everyone collected. Filter by language, deselect anyone you want to keep, then hit **Block selected**. teq blocks them one by one in the background — keep the X tab open and watch the progress.

That's the whole loop: **rules → collect → review → block.**

---

## Why it won't get you flagged

X treats rapid-fire blocking as bot activity, so teq deliberately goes slow and stays within human-looking limits.

- **Paced** — waits ~30s between blocks (plus a little random jitter, so the rhythm isn't mechanical).
- **Rate-capped** — stops after 40 blocks/hour or 250/day by default. These are rolling windows tracked against your whole block history, not a single run, so they hold across reloads.
- **Self-resuming** — when a cap is hit, the run waits and continues on its own once the window clears. The popup shows a "resumes in…" countdown.
- **Resilient** — a run survives tab reloads and browser restarts; it picks up where it left off. Just keep (or reopen) an X tab so it has somewhere to run.
- **Backs off on pushback** — if X returns a 401/403/429, the run pauses (it doesn't crash) and keeps the rest queued. Resume from the popup after a break.

A dot on the toolbar icon shows the state: **green** = blocking, **yellow** = paused. teq never blocks your own account.

---

## Settings

Edit your rules and the auto-collect toggle right in the popup. The full set lives on the **Options** page.

| Setting           | What it does                                               | Default |
| ----------------- | ---------------------------------------------------------- | ------- |
| **Words**         | Substrings to match against names/handles (emoji work too) | empty   |
| **Auto-collect**  | Scan the page for matches automatically as you scroll      | on      |
| **Scan interval** | Seconds between automatic scans                            | 3       |
| **Pacing**        | Base seconds between blocks (+ up to 30% jitter)           | 30      |
| **Max per hour**  | Cap on blocks in any rolling 60 min (`0` = no limit)       | 40      |
| **Max per day**   | Cap on blocks in any rolling 24 h (`0` = no limit)         | 250     |

Rules sync across your Chrome profile. Your collected list and block log stay on this device (the log keeps the last 500 entries). On the Options page you can **export/import** your config as JSON — handy for backup or sharing rules.

---

## The pages

- **Popup** — edit rules, toggle auto-collect, see the collected count and live run progress, open Review.
- **Review** — the full-page block screen, injected into X: language filter, select/deselect, and **Block selected**.
- **Options** — every setting, plus config export/import.
- **Collected** — search, page through, or clear your collected list.
- **Blocks** — search, page through, or clear your block log.

---

## Build from source

Built with [Bun](https://bun.sh).

```sh
bun install
bun run build     # → dist/
bun run watch     # rebuild on change
bun test
```

After rebuilding, click the **reload ↻** icon on the extension card in `chrome://extensions` to load the new code.

---

## Good to know

- Blocks use X's own `blocks/create` API — the exact call the site makes when you click "Block." It runs from the X tab, so your cookies and CSRF token ride along just like the real app.
- The bearer token in the code is X's public web-app token, not a secret.
- Collecting only sees what's currently rendered — scroll to load more accounts, and they get picked up on the next scan.
