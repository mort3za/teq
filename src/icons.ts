// Inline SVG icons shared by the scripts that build buttons. SVG, not ⏸/▶/ℹ/✕
// glyphs: glyph size and baseline differ per font, so they never sat centered.
// Lucide shapes (ISC), 24×24 grid, stroked with currentColor.

const svg = (size: number, body: string): string =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const X_ICON = svg(14, '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>');
export const EYE_OFF_ICON = svg(14, '<path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/>');
export const INFO_ICON = svg(16, '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>');
export const PAUSE_ICON = svg(14, '<rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor"/><rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor"/>');
export const BAN_ICON = svg(16, '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>');
export const SQUARE_CHECK_ICON = svg(16, '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/>');
export const SQUARE_MINUS_ICON = svg(16, '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M8 12h8"/>');
export const PLAY_ICON = svg(14, '<path d="M6 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 6 4.5z" fill="currentColor"/>');
