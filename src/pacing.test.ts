import { test, expect } from "bun:test";
import { blockDelayMs, PACING_JITTER, capReached, capRetryMs, fmtDuration } from "./pacing.ts";

test("with zero jitter the delay is exactly the configured pacing", () => {
  expect(blockDelayMs(30, 0)).toBe(30_000);
  expect(blockDelayMs(5, 0)).toBe(5_000);
});

test("max jitter adds PACING_JITTER on top of the base", () => {
  expect(blockDelayMs(10, 1)).toBe(13_000);
  expect(blockDelayMs(30, 1)).toBe(30_000 * (1 + PACING_JITTER));
});

test("jitter is interpolated linearly between base and base + jitter", () => {
  expect(blockDelayMs(20, 0.5)).toBe(20_000 + 20_000 * PACING_JITTER * 0.5);
});

test("delay scales linearly with the pacing seconds", () => {
  expect(blockDelayMs(60, 0.5)).toBe(blockDelayMs(30, 0.5) * 2);
});

test("the delay never drops below the configured pacing (paced-apart invariant)", () => {
  const base = 30_000;
  for (const rand of [0, 0.25, 0.5, 0.75, 0.999]) {
    const d = blockDelayMs(30, rand);
    expect(d).toBeGreaterThanOrEqual(base);
    expect(d).toBeLessThanOrEqual(base * (1 + PACING_JITTER));
  }
});

test("the default Math.random() jitter stays within [base, base + jitter)", () => {
  const base = 30_000;
  for (let i = 0; i < 50; i++) {
    const d = blockDelayMs(30);
    expect(d).toBeGreaterThanOrEqual(base);
    expect(d).toBeLessThan(base * (1 + PACING_JITTER));
  }
});

const NOW = 1_000_000_000_000;
const MIN = 60_000;
const HOUR = 60 * MIN;

/** `n` timestamps, the i-th one `i*stepMin` minutes before NOW. */
const recent = (n: number, stepMin: number) =>
  Array.from({ length: n }, (_, i) => NOW - i * stepMin * MIN);

test("no cap is reached when under both limits", () => {
  expect(capReached(recent(5, 5), 40, 250, NOW)).toBeNull();
});

test("hourly cap fires once the rolling hour is full", () => {
  // 40 blocks, one per minute → all 40 land inside the last hour.
  expect(capReached(recent(40, 1), 40, 250, NOW)).toBe("hour");
});

test("blocks older than an hour age out of the hourly window", () => {
  // 40 blocks spaced 2 min apart span 78 min, so only ~30 are within the hour.
  expect(capReached(recent(40, 2), 40, 250, NOW)).toBeNull();
});

test("daily cap fires and wins over the hourly cap when both are hit", () => {
  // 60 blocks one per minute: hourly (40) is also exceeded, but day is reported.
  expect(capReached(recent(60, 1), 40, 50, NOW)).toBe("day");
});

test("blocks older than a day age out of the daily window", () => {
  const stale = Array.from({ length: 300 }, () => NOW - 25 * HOUR);
  expect(capReached(stale, 40, 250, NOW)).toBeNull();
});

test("a cap of 0 disables that limit", () => {
  expect(capReached(recent(100, 1), 0, 0, NOW)).toBeNull();
  // hourly off, daily still enforced
  expect(capReached(recent(100, 1), 0, 50, NOW)).toBe("day");
});

test("capRetryMs is 0 when no cap is reached", () => {
  expect(capRetryMs(recent(5, 5), 40, 250, NOW)).toBe(0);
});

test("capRetryMs waits for the oldest hourly block to age out", () => {
  // 40 blocks one per minute fill the hour; the oldest is 39 min old, so a slot
  // frees in 60 - 39 = 21 minutes.
  expect(capRetryMs(recent(40, 1), 40, 250, NOW)).toBe(21 * MIN);
});

test("capRetryMs waits on the daily window when the day cap is the one hit", () => {
  // 60 blocks one per minute, day cap 50: drop the count to 49 by aging out the
  // 11 oldest. The 11th-oldest is 49 min old, so it clears in 24h - 49m.
  expect(capRetryMs(recent(60, 1), 40, 50, NOW)).toBe(24 * HOUR - 49 * MIN);
});

test("after capRetryMs elapses the cap has cleared", () => {
  const ts = recent(40, 1);
  const wait = capRetryMs(ts, 40, 250, NOW);
  expect(capReached(ts, 40, 250, NOW + wait)).toBeNull();
});

test("fmtDuration formats seconds, minutes, and hours", () => {
  expect(fmtDuration(45_000)).toBe("45s");
  expect(fmtDuration(90_000)).toBe("1m");
  expect(fmtDuration(21 * MIN)).toBe("21m");
  expect(fmtDuration(HOUR)).toBe("1h 0m");
  expect(fmtDuration(2 * HOUR + 5 * MIN)).toBe("2h 5m");
  expect(fmtDuration(-1000)).toBe("0s");
});
