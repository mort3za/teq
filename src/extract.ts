// Pure DOM extraction for an x.com "User-Name" cell. Lives apart from content.ts
// so it can be unit-tested against captured markup with no chrome APIs involved.
//
// Matching rule of thumb: rely only on stable, semantic signals — the
// data-testid="User-Name" container, the shape of anchor href values, the
// presence of <time>, and <img alt> for emoji. NEVER key off X's CSS class
// names (e.g. r-1wbh5a2, css-1jxf684): they're build-hashed, meaningless, and
// rotate between deploys, so any matcher built on them rots silently.

// A profile-link href is exactly "/handle" — nothing after it. The status link
// ("/handle/status/123…") and the date link therefore don't match, so the first
// hit is the user's @handle and not some other anchor in the cell.
const HANDLE_HREF = /^\/([A-Za-z0-9_]+)$/;

// Like textContent, but emoji that X renders as Twemoji <img> elements (the
// actual character lives in the alt attribute) are restored — textContent alone
// would drop them, so emoji in display names would never match.
export function richText(el: Element): string {
  let out = "";
  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      out += node.textContent ?? "";
    } else if (node instanceof HTMLImageElement) {
      out += node.alt;
    } else if (node instanceof Element) {
      out += richText(node);
    }
  }
  return out;
}

/** Extract { handle, name } from a [data-testid="User-Name"] container. */
export function extractUser(el: Element): { handle: string; name: string } | null {
  let handle = "";
  for (const a of el.querySelectorAll('a[href^="/"]')) {
    const href = a.getAttribute("href") ?? "";
    const m = href.match(HANDLE_HREF);
    if (m) {
      handle = m[1]!;
      break;
    }
  }
  if (!handle) return null;

  // The container text is roughly "Display Name@handle·time"; the display name
  // is everything before the "@handle" token (emoji restored by richText).
  const full = richText(el).trim();
  const at = full.indexOf("@" + handle);
  const name = (at >= 0 ? full.slice(0, at) : full).trim();
  return { handle, name };
}
