// Bundle the extension into dist/. Content scripts and the popup script can't be
// ES modules in the browser, so we bundle each entrypoint to a self-contained
// IIFE. Static files (manifest, html, css) are copied as-is.
//
//   bun run build          one-shot build
//   bun run build --watch  rebuild on change

import { watch } from "node:fs";

const OUT = "dist";

async function build(): Promise<void> {
  const result = await Bun.build({
    entrypoints: ["src/content.ts", "src/popup.ts", "src/blocks.ts", "src/collected.ts", "src/ignored.ts", "src/options.ts", "src/credits.ts", "src/donate.ts", "src/background.ts"],
    // Explicit root: with 9+ entrypoints Bun otherwise nests output under dist/src/.
    root: "src",
    outdir: OUT,
    target: "browser",
    format: "iife",
  });

  if (!result.success) {
    console.error("Build failed:");
    for (const log of result.logs) console.error(log);
    return;
  }

  for (const [dest, src] of [
    ["manifest.json", "manifest.json"],
    ["popup.html", "src/popup.html"],
    ["popup.css", "src/popup.css"],
    ["fonts.css", "src/fonts.css"],
    ["theme.css", "src/theme.css"],
    ["blocks.html", "src/blocks.html"],
    ["blocks.css", "src/blocks.css"],
    ["collected.html", "src/collected.html"],
    ["ignored.html", "src/ignored.html"],
    ["options.html", "src/options.html"],
    ["credits.html", "src/credits.html"],
    ["donate.html", "src/donate.html"],
    ["icons/icon16.png", "icons/icon16.png"],
    ["icons/icon32.png", "icons/icon32.png"],
    ["icons/icon48.png", "icons/icon48.png"],
    ["icons/icon128.png", "icons/icon128.png"],
  ] as const) {
    await Bun.write(`${OUT}/${dest}`, Bun.file(src));
  }
  // Bundled Vazirmatn (see src/fonts.css).
  for (const sub of ["arabic", "latin", "latin-ext"]) {
    const file = `vazirmatn-${sub}-wght-normal.woff2`;
    await Bun.write(`${OUT}/fonts/${file}`, Bun.file(`node_modules/@fontsource-variable/vazirmatn/files/${file}`));
  }

  console.log(`Built → ${OUT}/  (${new Date().toLocaleTimeString()})`);
}

await build();

if (process.argv.includes("--watch")) {
  console.log("Watching src/ and manifest.json …");
  let timer: ReturnType<typeof setTimeout> | undefined;
  const rebuild = () => {
    clearTimeout(timer);
    timer = setTimeout(() => void build(), 100);
  };
  watch("src", { recursive: true }, rebuild);
  watch("manifest.json", rebuild);
}
