// Puts the extension logo on the avatar of every collected account shown on the
// page: gray while the account still needs review, in full colour once it was
// reviewed and queued for blocking. Ignored and blocked accounts leave the
// collected list, so their mark goes away on the next pass.
//
// Avatars are found by X's data-testid="UserAvatar-Container-<handle>" — a
// stable, semantic signal that already names the account (see extract.ts).

import { getCollected, type CollectedUser } from "./storage.ts";

const AVATAR_PREFIX = "UserAvatar-Container-";
const MARK_CLASS = "teq-mark";
// X renders new tweets while you scroll; re-check this often. Cheap: one
// querySelectorAll and a map lookup per avatar, no storage reads.
const REFRESH_MS = 1000;

// Lower-case handle → true when reviewed (queued for blocking).
let reviewed = new Map<string, boolean>();

function load(list: CollectedUser[]): void {
  reviewed = new Map(list.map((u) => [u.handle.toLowerCase(), !!u.blocking]));
}

function createMark(): HTMLImageElement {
  const img = document.createElement("img");
  img.className = MARK_CLASS;
  img.src = chrome.runtime.getURL("icons/icon48.png");
  img.alt = "";
  img.draggable = false;
  Object.assign(img.style, {
    position: "absolute",
    right: "-2px",
    bottom: "-2px",
    width: "45%",
    minWidth: "14px",
    maxWidth: "28px",
    height: "auto",
    zIndex: "1",
    pointerEvents: "none",
  });
  return img;
}

function paint(): void {
  for (const el of document.querySelectorAll<HTMLElement>(`[data-testid^="${AVATAR_PREFIX}"]`)) {
    const handle = el.dataset.testid!.slice(AVATAR_PREFIX.length).toLowerCase();
    const state = reviewed.get(handle);
    let mark = el.querySelector<HTMLImageElement>(`:scope > .${MARK_CLASS}`);
    if (state === undefined) {
      mark?.remove();
      continue;
    }
    if (!mark) {
      mark = createMark();
      if (getComputedStyle(el).position === "static") el.style.position = "relative";
      el.append(mark);
    }
    mark.style.filter = state ? "" : "grayscale(1)";
  }
}

export function startMarks(): void {
  void getCollected().then((list) => {
    load(list);
    paint();
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes.collected) return;
    load((changes.collected.newValue as CollectedUser[] | undefined) ?? []);
    paint();
  });
  setInterval(paint, REFRESH_MS);
}
