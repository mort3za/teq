// Donate page: GitHub Sponsors link plus ways to help without money (star,
// report, tell a friend). Static markup; this script localizes it and handles
// the "copy the repo link" tile.

import { getConfig } from "./storage.ts";
import { watchNavCount } from "./nav.ts";
import { applyI18n, setLang, t } from "./i18n.ts";

const REPO = "https://github.com/mort3za/teq";

const copyBtn = document.getElementById("copyLink") as HTMLButtonElement;
const copyHint = document.getElementById("copyHint") as HTMLElement;

let timer: ReturnType<typeof setTimeout> | undefined;

copyBtn.addEventListener("click", async () => {
  await navigator.clipboard.writeText(REPO);
  copyBtn.classList.add("copied");
  copyHint.textContent = t("donate.copied");
  clearTimeout(timer);
  timer = setTimeout(() => {
    copyBtn.classList.remove("copied");
    copyHint.textContent = t("donate.copy");
  }, 2000);
});

async function load(): Promise<void> {
  setLang((await getConfig()).lang);
  applyI18n();
}

void load();
watchNavCount();
