# Phaser 4 — TypeScript + Vite Template

A starter template for browser games built with **Phaser 4**, **TypeScript** and **Vite**.

> The same template for Phaser 3: [phaser3-ts-webpack](https://github.com/maxmonax/phaser3-ts-webpack).

## Stack

| Tool                                         | Version | Purpose                         |
| -------------------------------------------- | ------- | ------------------------------- |
| [Phaser](https://phaser.io)                  | 4.2     | Game engine                     |
| [TypeScript](https://www.typescriptlang.org) | 6.0     | Type-safe game code             |
| [Vite](https://vite.dev)                     | 8       | Dev server and production build |
| [ESLint](https://eslint.org)                 | 10      | Linting                         |
| [Prettier](https://prettier.io)              | 3       | Code formatting                 |
| [Vitest](https://vitest.dev)                 | 5       | Unit tests                      |

## Getting started

Requires [Node.js](https://nodejs.org) 22.12 or newer (`.nvmrc` pins the version used in CI).

```sh
git clone https://github.com/maxmonax/phaser4-ts-template.git my-game
cd my-game
npm install
npm run dev
```

Open [http://localhost:9100](http://localhost:9100).

## Scripts

| Command                    | Description                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------- |
| `npm run dev`              | Start the dev server (web platform)                                                   |
| `npm run dev:<platform>`   | Dev server with the adapter of a platform: `dev:yandex`, `dev:crazygames`, `dev:poki` |
| `npm run build`            | Type-check and build the web version into `dist/web/`                                 |
| `npm run build:<platform>` | Build for a platform into `dist/<platform>/`                                          |
| `npm run build:all`        | Build every platform                                                                  |
| `npm run check:builds`     | Check that no build contains another platform's adapter                               |
| `npm run zip`              | Pack every build in `dist/` into a zip for upload                                     |
| `npm run preview`          | Serve the web build locally (`-- --mode <platform>` for others)                       |
| `npm run check`            | Type-check, lint, formatting check and unit tests                                     |
| `npm run typecheck`        | TypeScript type checking                                                              |
| `npm run lint`             | Run ESLint (`lint:fix` to auto-fix)                                                   |
| `npm run format`           | Format with Prettier (`format:check` to only check)                                   |
| `npm test`                 | Run unit tests (`test:watch` for watch mode)                                          |

## Project structure

```
├── index.html           # Page shell, entry point for Vite
├── public/assets/       # Game assets, copied to the build as is
│   ├── atlases/         # Texture atlases (png + json)
│   ├── audio/
│   ├── icons/
│   └── images/
├── src/
│   ├── index.ts         # Entry point: fonts, language, game config
│   ├── scenes/          # Boot, Preloader, Menu, Game, Transition
│   ├── gui/             # UI components (buttons, preloader bar, curtain, ad countdown)
│   ├── platform/        # Game portal adapters (web, Yandex Games, CrazyGames, Poki)
│   ├── ads/             # Ads for the game code
│   ├── save/            # Saved game state
│   ├── pause/           # Pause with reasons (ad, rotate overlay, hidden tab, portal)
│   ├── audio/           # Audio manager
│   ├── locale/          # Translations (en, ru)
│   ├── events/          # Event bus and bridge to the host page
│   ├── scaling/         # Orientation overlay
│   ├── data/            # Config, runtime params, audio list
│   ├── utils/           # Logging, math, state machines, font loading
│   ├── debug/           # Frame rate overlay
│   └── styles/          # Page CSS
├── scripts/             # zip packing, build checks
├── tests/               # Unit tests
└── vite.config.ts       # Build and test configuration
```

## Features

- **Game portals** — one code base, a build per portal: Yandex Games, CrazyGames, Poki and a plain
  web version. See [Platforms](#platforms).
- **Ads** — `AdMng`: interstitial and rewarded ads, one at a time, the game is paused and muted
  while an ad is on screen.
- **Saves** — `SaveMng`: a typed game state, saved to the portal's cloud storage or `localStorage`,
  writes batched and flushed when the page is hidden.
- **Pause** — `PauseMng`: the game is paused while any reason is active (an ad, the rotate overlay,
  a hidden tab, a portal request), so sources do not resume each other.
- **Scene flow** — Boot → Preloader → Menu → Game, with a curtain transition between scenes
  (`TransitionScene.change(scene, target)`).
- **UI components** — `MyButton`, `MyTextButton`, `MyText`, `MyImage`, `MyContainer`,
  `MyGraphics`, `PreloaderBar`, `Curtain`.
- **Audio manager** — `AudioMng`: music with fades, crossfade and ducking, sound effects with
  instance limits, separate music/sfx switches and volumes, global mute. It belongs to the game,
  not to a scene, so music and fades continue across scene changes.
- **Localization** — English and Russian, type-safe keys, switching at runtime. The language is
  the one the player picked in the menu, then the portal's, then the browser's.
- **Scaling** — fixed-height layout (2400×1080 with a 1440×1080 safe zone) and an overlay that
  asks to rotate the device and pauses the game meanwhile.
- **Shell bridge** — typed events between the game and the page that hosts it.
- **State machines** — `FSM` and `StackFSM`.
- **Logging** — `LogMng`: warnings and errors in every build, verbose output in dev builds.
- **Bundled fonts** — web fonts ship with the game; no requests to external servers.
- **Path alias** — `@/` points to `src/`.

## Platforms

| Platform     | Build                      | Language                 | Saves                           | Ads                     |
| ------------ | -------------------------- | ------------------------ | ------------------------------- | ----------------------- |
| Web          | `npm run build`            | browser                  | `localStorage`                  | none (simulated in dev) |
| Yandex Games | `npm run build:yandex`     | `environment.i18n.lang`  | player data, SDK safe storage   | fullscreen, rewarded    |
| CrazyGames   | `npm run build:crazygames` | `user.systemInfo.locale` | `SDK.data`, `localStorage`      | midgame, rewarded       |
| Poki         | `npm run build:poki`       | `getLanguage()`          | `localStorage` (synced by Poki) | commercial, rewarded    |

**How it works.** The platform is chosen at build time: `vite build --mode yandex`.
`vite.config.ts` adds the SDK `<script>` of that platform to `index.html` and replaces
`import.meta.env.VITE_PLATFORM` in the code, so only the adapter of that platform gets into the
bundle (`npm run check:builds` verifies it). The SDKs themselves are not part of the repository or
the bundle: each portal serves its SDK from its own server. An adapter is 1–2 kB.

If the SDK does not load or fails to start (an ad blocker, the game opened outside the portal), the
game runs on the web platform without ads, and an error goes to the console.

**In the game code:**

```ts
PlatformMng.loadingFinished(); // once, when the player can start playing (PreloaderScene)
PlatformMng.gameplayStart(); // a round starts (GameScene)
PlatformMng.gameplayStop(); // the round ends, a menu opens

await AdMng.showInterstitial(); // at a natural break; the demo: before every round but the first
if (await AdMng.showRewarded()) giveReward();
if (!AdMng.isAvailable()) hideRewardButtons();

SaveMng.set('coins', SaveMng.get('coins') + 10); // fields are declared in src/save/SaveData.ts
```

Gameplay is reported to the portal only while the game is not paused: during an ad, with a hidden
tab or with the rotate overlay the portal gets `gameplayStop`, and `gameplayStart` after that.

**Testing a platform locally:**

- **Web** — `npm run dev`. Ads are simulated: a one-second pause and a log message.
- **Yandex Games** — Yandex serves `/sdk.js` only on its own site, so `npm run dev:yandex` runs
  without the SDK (as the web platform). To run with the real SDK, build and use the Yandex proxy:
  `npm run build:yandex && npx @yandex-games/sdk-dev-proxy -p dist/yandex`
  ([docs](https://yandex.ru/dev/games/doc/ru/concepts/local-launch)).
- **CrazyGames** — `npm run dev:crazygames`. On `localhost` the SDK works in the `local`
  environment: ads are replaced by an overlay.
- **Poki** — upload `dist/poki` to the [Poki Inspector](https://developers.poki.com/guide/inspector).

**Platform notes:**

- **Yandex Games** — keep `interstitialCooldownMs` in `YandexPlatform` in line with the ad interval
  in the developer console. Upload the archive from `npm run zip`.
- **CrazyGames** — turn on "Progress Save" when submitting the game, or saves stay in
  `localStorage`. Between two levels show either a midgame ad or a rewarded "continue", not both.
- **Poki** — a commercial break is expected before every gameplay start except the first one.

**Adding a platform:** implement `IPlatform` in `src/platform/<id>/`, add the id and the SDK script
to `PLATFORMS` in `src/platform/platforms.ts`, add a branch to `createPlatform()`, the scripts to
`package.json` and the SDK global to `scripts/check-builds.mjs`.

## Assets

Everything in `public/` is copied to the build unchanged and is loaded at runtime by path, for
example `this.load.atlas('game', 'game.png', 'game.json')` in `PreloaderScene`.

- **Atlases** — pack sprites with [TexturePacker](https://www.codeandweb.com/texturepacker) or
  [Free Texture Packer](https://free-tex-packer.com) using the Phaser JSON format and put the
  result into `public/assets/atlases/`.
- **Source art** — keep unpacked images and packer project files in a top-level `raw-assets/`
  folder. Only `public/` gets into the build.
- **Audio** — put files into `public/assets/audio/` and list them in `src/data/AudioData.ts`.
- **Fonts** — fonts come from [Fontsource](https://fontsource.org) packages. To change the font:
  install the package, import its CSS in `src/index.ts` and set the family in
  `Config.FONT` (`src/data/Config.ts`). Every family listed there is loaded before the game starts.

## Starting a new game

1. Set `name` and `description` in `package.json`, `<title>` in `index.html` and the save key
   `Config.SAVE.KEY` in `src/data/Config.ts`.
2. Replace the icons in `public/assets/icons/`.
3. Set the game size and orientation in `src/data/Config.ts`.
4. Replace the demo atlas and sounds, then build your scenes on top of `BaseScene`.
5. Add texts to `src/locale/`: new keys go to `en.ts` first, the other locales must translate them.

## Development notes

- **Debug mode** — add `#debug` to the URL, e.g. `http://localhost:9100/#debug`: verbose logs
  (dev builds only) and a frame rate overlay (any build, so it works in a portal draft too).
- **Phaser import** — import Phaser explicitly in every module that uses it:
  `import * as Phaser from 'phaser'`. There is no global `Phaser` object in the production
  build; a lint rule guards this.
- **Host page events** — the page can talk to the game through `window` events:

  ```js
  // page → game
  window.dispatchEvent(new CustomEvent('shellEvent', { detail: { type: 'MUTE', muted: true } }));
  // game → page
  window.addEventListener('gameEvent', (e) => console.log(e.detail.type));
  ```

  Incoming event types are listed in `ShellInEvent`; anything else is ignored.

- **Deploy** — `npm run build` produces a static site in `dist/web/`, `build:<platform>` in
  `dist/<platform>/`. All paths are relative, so a build works from any folder. `npm run zip`
  packs every build into `dist/<name>-<platform>-<version>.zip` with `index.html` at the root.

## License

[MIT](LICENSE)
