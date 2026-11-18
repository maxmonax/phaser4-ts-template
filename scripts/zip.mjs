// Packs every platform build into an archive for upload to a game portal:
// dist/<platform>/ → dist/<name>-<platform>-<version>.zip, index.html at the root.
//
//   npm run zip              all builds found in dist/
//   npm run zip -- yandex    only the given platforms

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { zipSync } from 'fflate';

const DIST = 'dist';
const SKIP_FILES = new Set(['.DS_Store', 'Thumbs.db']);

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

function listFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(path);
    return SKIP_FILES.has(entry.name) ? [] : [path];
  });
}

const requested = process.argv.slice(2);
const platforms = requested.length
  ? requested
  : existsSync(DIST)
    ? readdirSync(DIST).filter((name) => existsSync(join(DIST, name, 'index.html')))
    : [];

if (platforms.length === 0) {
  console.error('Nothing to pack: build the game first (npm run build, npm run build:all).');
  process.exit(1);
}

for (const platform of platforms) {
  const dir = join(DIST, platform);
  if (!existsSync(join(dir, 'index.html'))) {
    console.error(`${dir}/index.html not found: run the build for "${platform}" first.`);
    process.exit(1);
  }

  const files = {};
  for (const path of listFiles(dir)) {
    // Zip entries always use forward slashes.
    files[relative(dir, path).split(sep).join('/')] = readFileSync(path);
  }

  const archive = join(DIST, `${pkg.name}-${platform}-${pkg.version}.zip`);
  writeFileSync(archive, zipSync(files, { level: 9 }));
  const sizeKb = Math.round(statSync(archive).size / 1024);
  console.log(`${archive}  ${Object.keys(files).length} files, ${sizeKb} KB`);
}
