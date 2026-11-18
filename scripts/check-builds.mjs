// Checks that every platform build contains only its own adapter:
// the SDK globals of other platforms must not appear in its JavaScript.
//
//   npm run build:all && npm run check:builds

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Global object of each platform SDK, as the adapter accesses it. */
const SDK_GLOBALS = {
  web: null,
  yandex: 'YaGames',
  crazygames: 'CrazyGames',
  poki: 'PokiSDK',
};

function readJs(dir) {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
    .map((entry) => readFileSync(join(entry.parentPath, entry.name), 'utf8'))
    .join('\n');
}

/** Problems with the build of one platform; an empty list when it is fine. */
function checkPlatform(dir, platform, ownGlobal) {
  if (!existsSync(join(dir, 'index.html')))
    return [`${dir}: no build, run npm run build:all first`];

  const js = readJs(dir);
  const problems = [];
  if (ownGlobal && !js.includes(ownGlobal)) {
    problems.push(`${dir}: its own adapter (${ownGlobal}) is missing`);
  }
  for (const [other, otherGlobal] of Object.entries(SDK_GLOBALS)) {
    if (other !== platform && otherGlobal && js.includes(otherGlobal)) {
      problems.push(`${dir}: contains the ${other} adapter (${otherGlobal})`);
    }
  }
  return problems;
}

let failed = false;
for (const [platform, ownGlobal] of Object.entries(SDK_GLOBALS)) {
  const dir = join('dist', platform);
  const problems = checkPlatform(dir, platform, ownGlobal);
  for (const problem of problems) console.error(`✗ ${problem}`);
  if (problems.length > 0) failed = true;
  else console.log(`✓ ${dir}: only the ${platform} adapter`);
}

process.exit(failed ? 1 : 0);
