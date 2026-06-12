Default to using Bun instead of Node.js.

- Use `bun <file>`
- Use `bun test`
- Use `bun build <file.html|file.ts|file.css>`
- Use `bun install`
- Use `bun run <script>`
- Use `bunx <package> <command>`
- Bun automatically loads .env, so don't use dotenv.

## APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## What this is

MV3 Chrome extension. On x.com it scans rendered user cells, collects accounts
whose display name (or @handle) matches your word/emoji rules, lets you review
them, then blocks the chosen ones via X's own `blocks/create` API — paced apart
so X doesn't flag it as automation. See `README.md` for the user-facing guide.

## Layout

```
src/content.ts   Content script on x.com. Auto-scans the DOM on an interval
                 (richText() restores Twemoji <img> emoji), collects matches,
                 and drains a paced block queue (SECONDS_PER_BLOCK + jitter;
                 stops on 401/403/429). Message-driven from the popup:
                 "collect" scans, "review" opens the overlay.
src/matcher.ts   Pure match logic (no DOM/chrome) — unit-testable. matchReason()
                 = case-insensitive substring; parseWords() parses the textarea.
src/blocker.ts   Wraps X blocks/create.json (same-origin authed fetch; ct0 CSRF).
src/pacing.ts    Pure timing logic (no DOM/chrome) — unit-testable. blockDelayMs()
                 = paced delay between blocks + up to PACING_JITTER random jitter.
src/storage.ts   chrome.storage. Config (words, autoCollect) in `sync`;
                 collected list, block log, last error in `local`. Source of
                 truth for the Config / CollectedUser / LogEntry types.
src/lang.ts      BCP-47 code → language name helpers for the language filters
                 (lang comes from X's `lang` attr on the matched tweet).
src/review.ts    Full-page "review & block" overlay injected into x.com, in a
                 Shadow DOM. Selecting + Block hands handles to content.ts's queue.
src/popup.*      Toolbar popup: edit rules, Collect matches, open review, links
                 to the standalone pages. Sends messages to the content script.
src/collected.*  Standalone extension page: search/paginate/clear collected list.
src/blocks.*     Standalone extension page: search/paginate/clear block log.
src/*.test.ts    bun tests (matcher.test.ts, csv.test.ts, pacing.test.ts).
build.ts         Bundle each entry (content, popup, blocks, collected) → IIFE in
                 dist/; copy manifest/html/css/icons. `bun run build [--watch]`.
manifest.json    MV3, perms: storage; hosts: x.com, twitter.com. Popup =
                 popup.html; content.js injected at document_idle.
```

Flow: popup → `chrome.tabs.sendMessage` → content.ts collects/opens review →
review overlay enqueues handles → content.ts drains them one at a time through
blocker.ts → storage `local` updates → popup/collected/blocks pages re-render via
`chrome.storage.onChanged`. `dist/` is committed (prebuilt, installable without
tooling) — rebuild after editing `src/`.

## Testing

Use `bun test` to run tests.

```ts#index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

## Frontend

Use HTML imports with `Bun.serve()`. Don't use `vite`. HTML imports fully support React, CSS, Tailwind.

Server:

```ts#index.ts
import index from "./index.html"

Bun.serve({
  routes: {
    "/": index,
    "/api/users/:id": {
      GET: (req) => {
        return new Response(JSON.stringify({ id: req.params.id }));
      },
    },
  },
  // optional websocket support
  websocket: {
    open: (ws) => {
      ws.send("Hello, world!");
    },
    message: (ws, message) => {
      ws.send(message);
    },
    close: (ws) => {
      // handle close
    }
  },
  development: {
    hmr: true,
    console: true,
  }
})
```

HTML files can import .tsx, .jsx or .js files directly and Bun's bundler will transpile & bundle automatically. `<link>` tags can point to stylesheets and Bun's CSS bundler will bundle.

```html#index.html
<html>
  <body>
    <h1>Hello, world!</h1>
    <script type="module" src="./frontend.tsx"></script>
  </body>
</html>
```

With the following `frontend.tsx`:

```tsx#frontend.tsx
import React from "react";
import { createRoot } from "react-dom/client";

// import .css files directly and it works
import './index.css';

const root = createRoot(document.body);

export default function Frontend() {
  return <h1>Hello, world!</h1>;
}

root.render(<Frontend />);
```

Then, run index.ts

```sh
bun --hot ./index.ts
```

For more information, read the Bun API docs in `node_modules/bun-types/docs/**.mdx`.
