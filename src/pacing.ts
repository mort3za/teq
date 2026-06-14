// Pure timing logic for the paced block queue (no DOM/chrome) — unit-testable.

/** Fraction of the base pacing added as positive random jitter. X flags
 * rapid-fire blocking as automation, so the delay is never below the base and
 * up to this much is sprinkled on top to make the cadence look less mechanical. */
export const PACING_JITTER = 0.3;

/**
 * Milliseconds to wait before the next block: the configured pacing plus up to
 * PACING_JITTER of positive random jitter. `rand` is the [0,1) source
 * (Math.random() in production; injected in tests for determinism).
 */
export function blockDelayMs(pacingSeconds: number, rand: number = Math.random()): number {
  const base = pacingSeconds * 1000;
  return base + rand * base * PACING_JITTER;
}

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/**
 * Which rolling-window block cap (if any) is currently maxed out, given the
 * epoch-ms timestamps of recent blocks. "Rolling" = counted against the trailing
 * hour/day from `now`, not a calendar reset. A cap of 0 means "no limit". The
 * day cap wins when both are hit (it's the longer wait). Returns null when
 * another block is allowed. `now` is injectable for tests.
 */
export function capReached(
  timestamps: number[],
  maxPerHour: number,
  maxPerDay: number,
  now: number = Date.now(),
): "hour" | "day" | null {
  let inHour = 0;
  let inDay = 0;
  for (const t of timestamps) {
    if (now - t < DAY_MS) {
      inDay++;
      if (now - t < HOUR_MS) inHour++;
    }
  }
  if (maxPerDay > 0 && inDay >= maxPerDay) return "day";
  if (maxPerHour > 0 && inHour >= maxPerHour) return "hour";
  return null;
}

/**
 * Milliseconds to wait until `capReached` clears for the same inputs — i.e. how
 * long until the next block is allowed. Returns 0 when no cap is currently hit.
 * The wait is until enough of the oldest in-window blocks age out past the
 * trailing hour/day boundary to free one slot: the run can then auto-resume
 * instead of stopping for good. `now` is injectable for tests.
 */
export function capRetryMs(
  timestamps: number[],
  maxPerHour: number,
  maxPerDay: number,
  now: number = Date.now(),
): number {
  const cap = capReached(timestamps, maxPerHour, maxPerDay, now);
  if (!cap) return 0;
  const windowMs = cap === "day" ? DAY_MS : HOUR_MS;
  const max = cap === "day" ? maxPerDay : maxPerHour;
  // In-window blocks, oldest first. To drop the count to max - 1 (one free
  // slot), the oldest (count - max + 1) must leave the window; the newest of
  // those leaves last, so wait until it crosses the boundary.
  const inWindow = timestamps.filter((t) => now - t < windowMs).sort((a, b) => a - b);
  const pivot = inWindow[inWindow.length - max]!;
  return pivot + windowMs - now;
}

/** Compact human duration for the auto-resume countdown: "45s", "12m", "2h 5m". */
export function fmtDuration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}
