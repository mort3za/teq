// Sidebar: keep the "(N)" badges in front of the Collected and Blocked nav links
// in sync with their counts. Shared by every page that renders the sidebar.

import { getCollected, getLog } from "./storage.ts";

function setBadge(id: string, n: number): void {
  const el = document.getElementById(id);
  if (el) el.textContent = n ? `(${n}) ` : "";
}

async function syncCollected(): Promise<void> {
  setBadge("navCount", (await getCollected()).length);
}

async function syncBlocked(): Promise<void> {
  // One entry per handle — match the deduped total shown on the Blocked page.
  const handles = new Set((await getLog()).map((e) => e.handle.toLowerCase()));
  setBadge("navCountBlocked", handles.size);
}

/** Render the counts now and refresh them whenever their lists change. */
export function watchNavCount(): void {
  void syncCollected();
  void syncBlocked();
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (changes.collected) void syncCollected();
    if (changes.blockLog) void syncBlocked();
  });
}
