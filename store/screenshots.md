# Update the screenshots

How to make new images for the Chrome Web Store (`store/*.png`).

There are two steps:

1. Take raw screenshots of the extension in a headless browser, with demo data.
2. Put each raw screenshot in a frame with a heading (`tools/compose.html`), then take a screenshot of that page.

The `store/tools/` folder has:

| File           | What it does                                                                                       |
| -------------- | -------------------------------------------------------------------------------------------------- |
| `x.html`       | Mock-up of the X home timeline. It has only the markup that `src/extract.ts` reads.                |
| `serve.ts`     | HTTPS server on port 8443 that sends `x.html` for every path (self-signed cert in `.cert/`).       |
| `seed.js`      | Demo rules, collected list, block log and ignored list. Run it on an extension page.               |
| `tidy.js`      | Screenshot-only CSS: hides the page scrollbar and keeps the sidebar in view when the page scrolls. |
| `compose.html` | Frames with headings, and the promo tiles.                                                         |

Raw screenshots go to `store/tools/shots/` and frame output goes to `store/tools/out/`. Git ignores both folders and `.cert/`.

The browser maps `x.com` to the local server, so the real content script runs on the mock page and opens the real review screen.

## 1. Start the server and the browser

Branded Chrome ignores `--load-extension`, so use Chrome for Testing. Download it to a temp folder (not the repo):

```sh
bunx @puppeteer/browsers install chrome@stable --path <temp>/cft
```

Build, start the mock X server (it keeps running, so use a second terminal), and open the browser headless with the session name `teq`:

```sh
bun run build
bun store/tools/serve.ts
```

```sh
CFT="<temp>/cft/chrome/<version>/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"
agent-browser --session teq --executable-path "$CFT" --extension "$PWD/dist" \
  --args "--headless=new,--disable-blink-features=AutomationControlled,--lang=en-US,--host-resolver-rules=MAP x.com 127.0.0.1:8443,--ignore-certificate-errors" \
  --user-agent "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36" \
  open chrome://extensions
agent-browser --session teq set media dark
```

The extension ID comes from the `key` in `manifest.json`, so it is always the same:

```sh
E=fgbpmnhpbkpfodjfdadfijhfhdaeekch
A="agent-browser --session teq"
T=store/tools
mkdir -p $T/shots
```

## 2. Add the demo data

```sh
$A open "chrome-extension://$E/blocks.html"
$A eval "$(cat $T/seed.js)"   # must return "seeded"
```

The authors of the matching tweets in `x.html` are already in the demo list, so the content script does not add new accounts.

## 3. X shots (`x.png`, `review.png`)

The X tab is `t1`. Each tab has its own viewport, so set it after you go to the tab. These shots use 1280×727 at 2× (the same shape as the 1056×600 frame window, but the review cards have room for one line).

```sh
$A tab t1; $A set viewport 1280 727 2
$A open "https://x.com/home"; sleep 3
$A screenshot $T/shots/x.png
```

The popup sends the "review" message to open the review screen. Do the same from an extension tab, then go back to the X tab:

```sh
$A tab new "chrome-extension://$E/popup.html"   # becomes t2
$A eval "chrome.tabs.query({url:'*://x.com/*'}).then(([t])=>chrome.tabs.sendMessage(t.id,{type:'review'})).then(()=>'ok')"
$A tab t1; sleep 1
$A screenshot $T/shots/review.png
```

## 4. Popup shot (`popup.png`)

The popup reads the block progress from storage. Set a fake run, take the shot, then remove it. Do this after the X page loads: when the X page loads, the content script ends a run that has no queue.

```sh
$A tab t2
$A eval "chrome.storage.local.set({blockProgress:{done:12,total:30,phase:'blocking'}}).then(()=>'ok')"
$A set viewport 344 900 2
$A open "chrome-extension://$E/popup.html"; sleep 2
H=$($A eval "Math.ceil(document.body.getBoundingClientRect().height)" | tr -d '"')
$A set viewport 344 $H 2; sleep 1
$A screenshot $T/shots/popup.png
$A eval "chrome.storage.local.remove('blockProgress').then(()=>'ok')"
```

## 5. App page shots (`collected.png`, `blocks.png`, `options.png`)

These use 1056×600 at 2×, the size of the frame window.

```sh
$A set viewport 1056 600 2
for p in collected blocks; do
  $A open "chrome-extension://$E/$p.html"; sleep 2
  $A eval "$(cat $T/tidy.js)"
  $A screenshot $T/shots/$p.png
done
$A open "chrome-extension://$E/options.html"; sleep 2
$A eval "$(cat $T/tidy.js)"
$A eval "(()=>{document.querySelector('details.advanced').open=true;document.getElementById('scan').closest('.field').scrollIntoView({block:'start'});return scrollY})()"
$A screenshot $T/shots/options.png
```

## 6. Make the frames

Headings and captions are in `store/tools/compose.html`. Change them there if the UI changes. The frames load the Inter font from Google Fonts, so the browser needs network access.

```sh
C=$PWD/store/tools; mkdir -p $C/out
$A tab new about:blank
shoot() { $A set viewport $2 $3 1 >/dev/null; $A open "about:blank" >/dev/null; $A open "file://$C/compose.html#$1" >/dev/null; sleep 3; $A screenshot $4 >/dev/null; }
for n in 1 2 3 4 5; do shoot $n 1280 800 $C/out/screenshot-$n.png; done
shoot small 440 280 $C/out/promo-small-440x280.png
shoot marquee 1400 560 $C/out/promo-marquee-1400x560.png
cp $C/out/*.png store/
$A close
```

Stop `serve.ts` (Ctrl+C) when you are done.

Look at each output image before you commit. The store needs 24-bit PNG (no alpha); `file store/screenshot-*.png store/promo-*.png` must say `8-bit/color RGB`.
