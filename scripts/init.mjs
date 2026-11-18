// Turns a fresh copy of the template into a new game:
//
//   npm run init -- my-game "My Game"
//
// Sets the package name and version, the page title, the save key and the title on
// the menu screen, moves the template's README to TEMPLATE.md and removes itself.
// The demo round is left in place as a working example: the list of what to delete
// is in TEMPLATE.md, "Starting a new game".
import { existsSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const args = process.argv.slice(2);
const force = args.includes('--force');
const [name, title = name] = args.filter((arg) => !arg.startsWith('--'));

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

const read = (file) => readFileSync(join(root, file), 'utf8');
const write = (file, text) => writeFileSync(join(root, file), text);

/** Replaces the first match of `pattern`; a file that does not match is a reason to stop. */
function replaceIn(file, pattern, replacement) {
  const text = read(file);
  if (!pattern.test(text)) fail(`${file}: nothing matches ${pattern}, the file is not changed.`);
  write(
    file,
    text.replace(pattern, () => replacement)
  );
  console.log(`✓ ${file}`);
}

/** A TypeScript string literal the way Prettier would write it. */
function quote(text) {
  const escaped = text.replaceAll('\\', '\\\\');
  if (text.includes("'") && !text.includes('"')) return `"${escaped}"`;
  return `'${escaped.replaceAll("'", "\\'")}'`;
}

if (!name || !/^[a-z0-9][a-z0-9._-]*$/.test(name)) {
  fail(
    'Usage: npm run init -- <package-name> ["Game Title"]\n' +
      '  package-name: lower-case letters, digits, "-", "." and "_", e.g. my-game'
  );
}

const pkg = JSON.parse(read('package.json'));
if (!/^phaser\d(-ts)?-template$/.test(pkg.name) && !force) {
  fail(`The project is already named "${pkg.name}". Pass --force to rename it again.`);
}

// package.json and the lock file
pkg.name = name;
pkg.version = '0.1.0';
pkg.description = title;
delete pkg.scripts.init;
write('package.json', `${JSON.stringify(pkg, null, 2)}\n`);
console.log('✓ package.json');

if (existsSync(join(root, 'package-lock.json'))) {
  const lock = JSON.parse(read('package-lock.json'));
  lock.name = name;
  lock.version = pkg.version;
  if (lock.packages?.['']) {
    lock.packages[''].name = name;
    lock.packages[''].version = pkg.version;
  }
  write('package-lock.json', `${JSON.stringify(lock, null, 2)}\n`);
  console.log('✓ package-lock.json');
}

// The page title, the save key and the title on the menu screen
const htmlTitle = title.replaceAll('&', '&amp;').replaceAll('<', '&lt;');
replaceIn('index.html', /<title>[^<]*<\/title>/, `<title>${htmlTitle}</title>`);
replaceIn('src/data/Config.ts', /KEY: '[^']*'/, `KEY: '${name}'`);
for (const locale of ['src/locale/en.ts', 'src/locale/ru.ts']) {
  replaceIn(locale, /menu_title: (['"]).*\1,/, `menu_title: ${quote(title)},`);
}

// The template's README stays as a reference under another name.
renameSync(join(root, 'README.md'), join(root, 'TEMPLATE.md'));
write(
  'README.md',
  [
    `# ${title}`,
    '',
    'Built on a Phaser + TypeScript + Vite template. The scripts, the project structure',
    'and the platform builds are described in [TEMPLATE.md](TEMPLATE.md).',
    '',
    '```sh',
    'npm install',
    'npm run dev        # http://localhost:9100',
    'npm run check      # types, lint, formatting, unit tests',
    'npm run build:all  # dist/<platform>',
    '```',
    '',
  ].join('\n')
);
console.log('✓ README.md (the template guide is now TEMPLATE.md)');

if (existsSync(join(root, 'AGENTS.md'))) {
  write('AGENTS.md', read('AGENTS.md').replaceAll('README.md', 'TEMPLATE.md'));
  console.log('✓ AGENTS.md');
}

rmSync(fileURLToPath(import.meta.url));

console.log(`
"${title}" is ready. Next:
  - replace the icons in public/assets/icons/
  - set the game size and orientation in src/data/Config.ts
  - translate the title in src/locale/ru.ts if it differs
  - see "Starting a new game" in TEMPLATE.md for the rest, including how to remove the demo`);
