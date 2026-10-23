// Sidebar: keep the "(N)" badges in front of the Collected and Blocked nav links
// in sync with their counts, and show the extension version under the GitHub
// link. Shared by every page that renders the sidebar.

import { getCollected, getIgnored, getLog } from "./storage.ts";

function setBadge(id: string, n: number): void {
  const el = document.getElementById(id);
  if (el) el.textContent = n ? `(${n}) ` : "";
}

async function syncCollected(): Promise<void> {
  setBadge("navCount", (await getCollected()).length);
}

async function syncIgnored(): Promise<void> {
  setBadge("navCountIgnored", (await getIgnored()).length);
}

async function syncBlocked(): Promise<void> {
  // One entry per handle — match the deduped total shown on the Blocked page.
  const handles = new Set((await getLog()).map((e) => e.handle.toLowerCase()));
  setBadge("navCountBlocked", handles.size);
}

/** Render the counts now and refresh them whenever their lists change. Also
 * fills in the sidebar's version line. */
export function watchNavCount(): void {
  const version = document.getElementById("version");
  if (version) version.textContent = `v${chrome.runtime.getManifest().version}`;
  void syncCollected();
  void syncIgnored();
  void syncBlocked();
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (changes.collected) void syncCollected();
    if (changes.ignored) void syncIgnored();
    if (changes.blockLog) void syncBlocked();
  });
}
