import { test, expect } from "bun:test";
import { setLang, getLang, isRtl, t } from "./i18n.ts";

test("setLang switches the active language and getLang reports it", () => {
  setLang("en");
  expect(getLang()).toBe("en");
  expect(t("common.clear")).toBe("Clear");
  setLang("fa");
  expect(getLang()).toBe("fa");
  expect(t("common.clear")).toBe("پاک کردن");
  setLang("en"); // reset for other tests
});

test("t substitutes {named} placeholders", () => {
  setLang("en");
  expect(t("common.pageInfo", { page: 2, pages: 5 })).toBe("Page 2 of 5");
  expect(t("review.blockN", { n: 3 })).toBe("Block 3 selected");
});

test("t falls back to English, then to the raw key", () => {
  setLang("fa");
  // a key only present in English still resolves via the English fallback
  expect(t("popup.title")).toBe("تک... بلاکشون کن!");
  // an unknown key returns the key itself
  expect(t("does.not.exist")).toBe("does.not.exist");
  setLang("en");
});

test("isRtl is true only for Persian", () => {
  setLang("fa");
  expect(isRtl()).toBe(true);
  setLang("en");
  expect(isRtl()).toBe(false);
});

test("an unknown language argument is ignored (stays English)", () => {
  setLang("en");
  // @ts-expect-error — exercising the runtime guard
  setLang("zz");
  expect(getLang()).toBe("en");
});
