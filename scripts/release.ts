#!/usr/bin/env bun
// Bump the version, sync it into package.json + manifest.json, commit, tag, and
// push. The new tag triggers .github/workflows/release.yml to build & publish.
//
//   bun run release            # patch bump (default): 1.0.2 -> 1.0.3
//   bun run release minor      # 1.0.2 -> 1.1.0
//   bun run release major      # 1.0.2 -> 2.0.0
//   bun run release 1.5.0      # explicit version
//
// The base version is the highest existing git tag (the last real release), so
// it can't collide with a tag that already exists.

import { $ } from "bun";

const VERSION_FILES = ["package.json", "manifest.json"];
const SEMVER = /^v?(\d+)\.(\d+)\.(\d+)$/;

async function latestTagVersion(): Promise<[number, number, number]> {
  const out = await $`git tag --list --sort=-v:refname`.text();
  for (const tag of out.split("\n")) {
    const m = tag.trim().match(SEMVER);
    if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];
  }
  return [0, 0, 0]; // no tags yet
}

function nextVersion(arg: string, [maj, min, pat]: [number, number, number]): string {
  switch (arg) {
    case "major": return `${maj + 1}.0.0`;
    case "minor": return `${maj}.${min + 1}.0`;
    case "patch": return `${maj}.${min}.${pat + 1}`;
    default: {
      const m = arg.match(SEMVER);
      if (!m) throw new Error(`Invalid version "${arg}" — use major|minor|patch or X.Y.Z`);
      return `${m[1]}.${m[2]}.${m[3]}`;
    }
  }
}

// Refuse to release on top of uncommitted changes — they'd be swept into the
// release commit.
const status = (await $`git status --porcelain`.text()).trim();
if (status) {
  console.error("Working tree is not clean. Commit or stash first:\n" + status);
  process.exit(1);
}

const branch = (await $`git rev-parse --abbrev-ref HEAD`.text()).trim();
const version = nextVersion(Bun.argv[2] ?? "patch", await latestTagVersion());
const tag = `v${version}`;

if ((await $`git tag --list ${tag}`.text()).trim()) {
  console.error(`Tag ${tag} already exists.`);
  process.exit(1);
}

for (const file of VERSION_FILES) {
  const json = await Bun.file(file).json();
  json.version = version;
  await Bun.write(file, JSON.stringify(json, null, 2) + "\n");
}

console.log(`Releasing ${tag} (from branch ${branch}) …`);
await $`git add ${VERSION_FILES}`;
await $`git commit -m ${`release: ${tag}`}`;
await $`git tag -a ${tag} -m ${`release: ${tag}`}`;
await $`git push origin ${branch}`;
await $`git push origin ${tag}`;
console.log(`Pushed ${tag}. CI will build & publish the release.`);
