import { test, expect } from "bun:test";
import { matchReason, parseWords } from "./matcher.ts";

test("matches a word case-insensitively as a substring", () => {
  expect(matchReason("Official Crypto Guy", { words: ["crypto"] })).toBe("crypto");
  expect(matchReason("AIRDROP now", { words: ["airdrop"] })).toBe("airdrop");
});

test("returns the configured (trimmed) word as the reason, not the haystack", () => {
  expect(matchReason("airdrop now", { words: ["  AirDrop  "] })).toBe("AirDrop");
});

test("returns null when nothing matches", () => {
  expect(matchReason("Jane Doe", { words: ["crypto", "airdrop"] })).toBeNull();
});

test("returns the first matching word when several match", () => {
  expect(matchReason("crypto airdrop", { words: ["airdrop", "crypto"] })).toBe(
    "airdrop",
  );
});

test("empty or whitespace-only words never match", () => {
  expect(matchReason("anything", { words: ["", "   "] })).toBeNull();
});

test("emoji listed as a word matches via substring", () => {
  expect(matchReason("To the moon 🚀", { words: ["🚀"] })).toBe("🚀");
  expect(matchReason("plain name", { words: ["🚀"] })).toBeNull();
});

test("parseWords trims, drops blank lines, and keeps order", () => {
  expect(parseWords("  crypto \n\n airdrop\n   \nnft")).toEqual([
    "crypto",
    "airdrop",
    "nft",
  ]);
});

test("parseWords on empty input yields an empty list", () => {
  expect(parseWords("")).toEqual([]);
  expect(parseWords("\n  \n")).toEqual([]);
});
