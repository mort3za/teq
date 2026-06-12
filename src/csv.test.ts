import { test, expect } from "bun:test";
import { toCsv, parseCsv } from "./csv.ts";

test("round-trips plain rows", () => {
  const csv = toCsv(["handle", "name"], [["alice", "Alice"], ["bob", "Bob"]]);
  expect(parseCsv(csv)).toEqual([
    ["handle", "name"],
    ["alice", "Alice"],
    ["bob", "Bob"],
  ]);
});

test("quotes fields with commas, quotes, and newlines", () => {
  const csv = toCsv(["a", "b"], [['x,y', 'he said "hi"'], ["line1\nline2", "z"]]);
  expect(parseCsv(csv)).toEqual([
    ["a", "b"],
    ['x,y', 'he said "hi"'],
    ["line1\nline2", "z"],
  ]);
});

test("parses without a trailing newline and skips blank lines", () => {
  expect(parseCsv("handle\nalice\n\nbob")).toEqual([
    ["handle"],
    ["alice"],
    ["bob"],
  ]);
});
