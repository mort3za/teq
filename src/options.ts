// Options page: edit the match rules, auto-collect toggle, and block pacing.
// Saved to synced config and read live by the content script. Config can also
// be exported/imported as JSON for backup or sharing.

import { getConfig, setConfig, DEFAULT_CONFIG, type Config } from "./storage.ts";
import { parseWords } from "./matcher.ts";
import { watchNavCount } from "./nav.ts";
import { applyI18n, setLang, t, type Lang } from "./i18n.ts";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const wordsEl = $<HTMLTextAreaElement>("words");
const autoCollect = $<HTMLInputElement>("autoCollect");
const langEl = $<HTMLSelectElement>("lang");
const persianNormalize = $<HTMLInputElement>("persianNormalize");
const matchHandle = $<HTMLInputElement>("matchHandle");
const scan = $<HTMLInputElement>("scan");
const pacing = $<HTMLInputElement>("pacing");
const maxPerHour = $<HTMLInputElement>("maxPerHour");
const maxPerDay = $<HTMLInputElement>("maxPerDay");
const status = $<HTMLElement>("status");
const exportBtn = $<HTMLButtonElement>("export");
const importBtn = $<HTMLButtonElement>("import");
const resetAdvancedBtn = $<HTMLButtonElement>("resetAdvanced");

function note(msg: string): void {
  status.textContent = msg;
  setTimeout(() => (status.textContent = ""), 1500);
}

async function load(): Promise<void> {
  const cfg = await getConfig();
  setLang(cfg.lang);
  applyI18n();
  langEl.value = cfg.lang;
  persianNormalize.checked = cfg.persianNormalize;
  matchHandle.checked = cfg.matchHandle;
  wordsEl.value = cfg.words.join("\n");
  autoCollect.checked = cfg.autoCollect;
  scan.value = String(cfg.scanSeconds);
  pacing.value = String(cfg.pacingSeconds);
  maxPerHour.value = String(cfg.maxPerHour);
  maxPerDay.value = String(cfg.maxPerDay);
}

/** Round an input to a positive integer, falling back to a default. */
function normalizedSeconds(el: HTMLInputElement, fallback: number): number {
  let n = Math.round(Number(el.value));
  if (!Number.isFinite(n)) n = fallback;
  if (n < 1) n = 1;
  return n;
}

/** Round a cap input to a non-negative integer (0 = no limit). */
function normalizedCap(el: HTMLInputElement, fallback: number): number {
  let n = Math.round(Number(el.value));
  if (!Number.isFinite(n)) n = fallback;
  if (n < 0) n = 0;
  return n;
}

async function save(): Promise<void> {
  const scanSeconds = normalizedSeconds(scan, DEFAULT_CONFIG.scanSeconds);
  const pacingSeconds = normalizedSeconds(pacing, DEFAULT_CONFIG.pacingSeconds);
  const perHour = normalizedCap(maxPerHour, DEFAULT_CONFIG.maxPerHour);
  const perDay = normalizedCap(maxPerDay, DEFAULT_CONFIG.maxPerDay);
  scan.value = String(scanSeconds);
  pacing.value = String(pacingSeconds);
  maxPerHour.value = String(perHour);
  maxPerDay.value = String(perDay);
  await setConfig({
    words: parseWords(wordsEl.value),
    autoCollect: autoCollect.checked,
    persianNormalize: persianNormalize.checked,
    matchHandle: matchHandle.checked,
    scanSeconds,
    pacingSeconds,
    maxPerHour: perHour,
    maxPerDay: perDay,
  });
  note(t("options.saved"));
}

/** Switch the interface language live and persist it. */
async function changeLang(): Promise<void> {
  const lang = (langEl.value === "fa" ? "fa" : "en") as Lang;
  await setConfig({ lang });
  setLang(lang);
  applyI18n();
}

langEl.addEventListener("change", () => void changeLang());
persianNormalize.addEventListener("change", () => void save());
matchHandle.addEventListener("change", () => void save());
wordsEl.addEventListener("input", () => void save());
autoCollect.addEventListener("change", () => void save());
scan.addEventListener("change", () => void save());
pacing.addEventListener("change", () => void save());
maxPerHour.addEventListener("change", () => void save());
maxPerDay.addEventListener("change", () => void save());

resetAdvancedBtn.addEventListener("click", async () => {
  scan.value = String(DEFAULT_CONFIG.scanSeconds);
  pacing.value = String(DEFAULT_CONFIG.pacingSeconds);
  maxPerHour.value = String(DEFAULT_CONFIG.maxPerHour);
  maxPerDay.value = String(DEFAULT_CONFIG.maxPerDay);
  await save();
});

exportBtn.addEventListener("click", async () => {
  const cfg = await getConfig();
  const blob = new Blob([JSON.stringify(cfg, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "teq-config.json";
  a.click();
  URL.revokeObjectURL(url);
});

importBtn.addEventListener("click", () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json,application/json";
  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    if (!file) return;
    let data: Partial<Config>;
    try {
      data = JSON.parse(await file.text());
    } catch {
      note(t("options.importInvalid"));
      return;
    }

    const patch: Partial<Config> = {};
    if (Array.isArray(data.words)) {
      patch.words = data.words.map(String);
    }
    if (typeof data.autoCollect === "boolean") {
      patch.autoCollect = data.autoCollect;
    }
    if (typeof data.persianNormalize === "boolean") {
      patch.persianNormalize = data.persianNormalize;
    }
    if (typeof data.matchHandle === "boolean") {
      patch.matchHandle = data.matchHandle;
    }
    if (data.lang === "en" || data.lang === "fa") {
      patch.lang = data.lang;
    }
    if (Number.isFinite(data.scanSeconds)) {
      patch.scanSeconds = Math.max(1, Math.round(data.scanSeconds as number));
    }
    if (Number.isFinite(data.pacingSeconds)) {
      patch.pacingSeconds = Math.max(1, Math.round(data.pacingSeconds as number));
    }
    if (Number.isFinite(data.maxPerHour)) {
      patch.maxPerHour = Math.max(0, Math.round(data.maxPerHour as number));
    }
    if (Number.isFinite(data.maxPerDay)) {
      patch.maxPerDay = Math.max(0, Math.round(data.maxPerDay as number));
    }

    if (!Object.keys(patch).length) {
      note(t("options.importNoSettings"));
      return;
    }

    await setConfig(patch);
    await load();
    note(t("options.imported"));
  });
  input.click();
});

void load();
watchNavCount();
