// Credits page: the open source projects that ship in the extension. Static
// markup; this script only localizes it and keeps the sidebar badges in sync.

import { getConfig } from "./storage.ts";
import { watchNavCount } from "./nav.ts";
import { applyI18n, setLang } from "./i18n.ts";

async function load(): Promise<void> {
  setLang((await getConfig()).lang);
  applyI18n();
}

void load();
watchNavCount();
