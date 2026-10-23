import { test, expect } from "bun:test";
import { relativeTime, exactTime } from "./time.ts";

const now = Date.UTC(2026, 9, 23, 18, 0);
const ago = (ms: number) => now - ms;
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

test("under a minute reads as now", () => {
  expect(relativeTime(ago(20_000), now, "en")).toBe("now");
});

test("picks the largest whole unit and truncates", () => {
  expect(relativeTime(ago(5 * MIN), now, "en")).toBe("5 minutes ago");
  expect(relativeTime(ago(90 * MIN), now, "en")).toBe("1 hour ago");
  expect(relativeTime(ago(3 * DAY), now, "en")).toBe("3 days ago");
  expect(relativeTime(ago(15 * DAY), now, "en")).toBe("2 weeks ago");
  expect(relativeTime(ago(400 * DAY), now, "en")).toBe("last year");
});

test("one day back is yesterday", () => {
  expect(relativeTime(ago(DAY), now, "en")).toBe("yesterday");
});

test("follows the UI language", () => {
  expect(relativeTime(ago(5 * MIN), now, "fa")).toContain("پیش");
});

test("exact time carries both date and time", () => {
  const s = exactTime(now, "en");
  expect(s).toContain("2026");
  expect(s).toMatch(/\d:\d\d/);
});
