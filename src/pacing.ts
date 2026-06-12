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
