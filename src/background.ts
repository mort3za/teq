// Service worker: while a block run is in progress, overlays a small dot on the
// top-right corner of the toolbar icon (drawn onto the icon bitmap, so it's
// crisp — no fuzzy badge glyph). Green while blocking, yellow while paused. The
// content script holds a "block-run" port open for the duration of the run; an
// open port keeps this worker alive.

import { getBlockProgress } from "./storage.ts";

const GREEN = "#00ba7c";
const YELLOW = "#f5b800";
const SIZES = [16, 32, 48] as const;

let runners = 0;
// The dot color currently painted on the icon, or null when no dot is shown —
// lets syncDot() skip redundant (costly) redraws.
let dotColor: string | null = null;

/** Draw the base icon at each size with a colored dot in the top-right corner. */
async function dottedIcon(color: string): Promise<Record<number, ImageData>> {
  const out: Record<number, ImageData> = {};
  for (const size of SIZES) {
    const res = await fetch(chrome.runtime.getURL(`icons/icon${size}.png`));
    const bitmap = await createImageBitmap(await res.blob());
    const canvas = new OffscreenCanvas(size, size);
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(bitmap, 0, 0, size, size);

    const r = size * 0.26;
    const cx = size - r;
    const cy = r;
    // White ring so the dot stays legible over any icon pixels.
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.74, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    out[size] = ctx.getImageData(0, 0, size, size);
  }
  return out;
}

function hideDot(): void {
  void chrome.action.setIcon({
    path: Object.fromEntries(SIZES.map((s) => [s, `icons/icon${s}.png`])),
  });
}

/** Paint the icon dot to match the current run: green while blocking, yellow
 * while paused, no dot when no run is active. Skips redundant redraws. */
async function syncDot(): Promise<void> {
  if (runners === 0) {
    if (dotColor !== null) {
      dotColor = null;
      hideDot();
    }
    return;
  }
  const p = await getBlockProgress();
  const color = p?.phase === "paused" ? YELLOW : GREEN;
  if (color === dotColor) return;
  dotColor = color;
  void chrome.action.setIcon({ imageData: await dottedIcon(color) });
}

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "block-run") return;
  runners++;
  void syncDot();
  port.onDisconnect.addListener(() => {
    runners = Math.max(0, runners - 1);
    void syncDot();
  });
});

// Pause/resume flips the dot color mid-run without touching the port.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.blockProgress) void syncDot();
});
