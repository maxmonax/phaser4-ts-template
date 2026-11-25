# Phaser 4 — TypeScript + Vite Template

A starter template for browser games built with **Phaser 4**, **TypeScript** and **Vite**.

> The same template for Phaser 3: [phaser3-ts-template](https://github.com/maxmonax/phaser3-ts-template).

## Stack

| Tool                                         | Version | Purpose                         |
| -------------------------------------------- | ------- | ------------------------------- |
| [Phaser](https://phaser.io)                  | 4.2     | Game engine                     |
| [TypeScript](https://www.typescriptlang.org) | 6.0     | Type-safe game code             |
| [Vite](https://vite.dev)                     | 8       | Dev server and production build |
| [ESLint](https://eslint.org)                 | 10      | Linting                         |
| [Prettier](https://prettier.io)              | 3       | Code formatting                 |
| [Vitest](https://vitest.dev)                 | 5       | Unit tests                      |
| [Playwright](https://playwright.dev)         | 1.65    | Browser tests of the builds     |

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
| `npm run check`            | Atlas types, type-check, lint, formatting check and unit tests                        |
| `npm run typecheck`        | TypeScript type checking                                                              |
| `npm run lint`             | Run ESLint (`lint:fix` to auto-fix)                                                   |
| `npm run format`           | Format with Prettier (`format:check` to only check)                                   |
| `npm test`                 | Run unit tests (`test:watch` for watch mode)                                          |
| `npm run test:e2e`         | Start every build from `dist/` in a headless browser (run `build:all` first)          |
| `npm run gen:assets`       | Regenerate the atlas frame types after changing an atlas                              |
| `npm run init`             | Rename the template into a new game, see [Starting a new game](#starting-a-new-game)  |

## Project structure

```
├── index.html           # Page shell, entry point for Vite
├── public/assets/       # Game assets, copied to the build as is
│   ├── atlases/         # Texture atlases (png + json)
│   ├── audio/
│   ├── icons/
│   └── images/
├── raw-assets/          # Source art: the SVG files the demo atlas is packed from
├── src/
│   ├── index.ts         # Entry point: platform, fonts, saves, language, game config
│   ├── scenes/          # Boot, Preloader, Menu, Game, Popup, Transition
│   ├── gui/             # Theme, buttons, popups, preloader bar, curtain, ad countdown
│   ├── demo/            # The demo round: replace it with your game
│   ├── platform/        # Game portal adapters (web, Yandex Games, CrazyGames, Poki)
│   ├── ads/             # Ads for the game code
│   ├── save/            # Saved game state
│   ├── pause/           # Pause with reasons (ad, rotate overlay, hidden tab, portal)
│   ├── audio/           # Audio manager, saved sound switches
│   ├── locale/          # Translations (10 languages)
│   ├── events/          # Event bus and bridge to the host page
│   ├── scaling/         # Visible area, camera centering, orientation overlay
│   ├── data/            # Config, URL params, audio list, atlas frame types
│   ├── utils/           # Logging, math, state machines, promises, font loading
│   ├── debug/           # Frame rate and errors on screen
│   └── styles/          # Page CSS, the background of every scene
├── scripts/             # zip packing, build checks, atlas types, init
├── tests/               # Unit tests
├── e2e/                 # Browser tests of the builds
├── docs/ROADMAP.md      # Ideas, known limitations, what is not verified yet
├── AGENTS.md            # Rules and recipes for coding agents
└── vite.config.ts       # Build and test configuration
```

## Features

- **Game portals** — one code base, a build per portal: Yandex Games, CrazyGames, Poki and a plain
  web version. See [Platforms](#platforms).
- **Ads** — `AdMng`: interstitial and rewarded ads, one at a time, interstitials at least a
  minute apart. The game stops while an ad is requested and is muted once it is on screen; an SDK
  that does not start the ad in 5 seconds does not hold the game. See [Ads](#ads).
- **Saves** — `SaveMng`: a typed game state, saved to the portal's cloud storage or `localStorage`,
  writes batched and flushed when the page is hidden.
- **Pause** — `PauseMng`: the game is paused while any reason is active (an ad, the rotate overlay,
  a hidden tab, a portal request), so sources do not resume each other.
- **Scene flow** — Boot → Preloader → Menu → Game, with a curtain transition between scenes
  (`TransitionScene.change(scene, target)`).
- **One look** — `Theme`: colors, sizes and text styles in one file. Buttons and panels are drawn
  in code, icons are white and tinted, so a game is restyled without redrawing art. See [UI](#ui).
- **Popups** — `PopupScene.open()`: a panel over a shade that blocks the input below, stacked
  popups, a result as a promise. Settings and pause popups are included.
- **Screen** — the safe area (1440×1080) is always on screen, the canvas grows towards the full
  area (2400×1080) as the window allows and renders only what is visible (`Phaser.Scale.EXPAND`).
  Anchors to the visible edges (`this.anchor(obj, { right: 110, top: 110 })`), a "rotate your
  device" overlay for phones held the wrong way. See [Screen and layout](#screen-and-layout).
- **Localization** — ten languages, type-safe keys, plural forms, number formatting, a language
  list for the player, tests that check every translation. See [Localization](#localization).
- **Audio manager** — `AudioMng`: music with fades, crossfade and ducking, sound effects with
  instance limits, separate music/sfx switches and volumes, global mute. It belongs to the game,
  not to a scene, so music and fades continue across scene changes. `AudioSettings` keeps the
  player's switches between sessions.
- **Typed assets** — the frame names of the atlases are types: a typo is a compile error.
- **Demo round** — a small playable game in `src/demo` that uses all of the above: round states
  on an `FSM`, a pause popup over the paused scene, ads at the breaks, a saved best score.
- **Promises for scenes** — `this.wait(ms)` and `this.tween(config)` on the scene clock.
- **Shell bridge** — typed events between the game and the page that hosts it.
- **State machines** — `FSM` and `StackFSM`.
- **Logging** — `LogMng`: warnings and errors in every build, verbose output in dev builds.
- **Bundled fonts** — web fonts ship with the game; no requests to external servers.
- **Tests** — unit tests of the engine-independent logic, browser tests that start every build.
- **Path alias** — `@/` points to `src/`.

## Platforms

| Platform     | Build                      | Language                          | Saves                           | Ads                     |
| ------------ | -------------------------- | --------------------------------- | ------------------------------- | ----------------------- |
| Web          | `npm run build`            | browser                           | `localStorage`                  | none (simulated in dev) |
| Yandex Games | `npm run build:yandex`     | `environment.i18n.lang`, fallback | player data, SDK safe storage   | fullscreen, rewarded    |
| CrazyGames   | `npm run build:crazygames` | `user.systemInfo.locale`          | `SDK.data`, `localStorage`      | midgame, rewarded       |
| Poki         | `npm run build:poki`       | `getLanguage()`                   | `localStorage` (synced by Poki) | commercial, rewarded    |

**How it works.** The platform is chosen at build time: `vite build --mode yandex`.
`vite.config.ts` adds the SDK `<script>` of that platform to `index.html` and replaces
`import.meta.env.VITE_PLATFORM` in the code, so only the adapter of that platform gets into the
bundle (`npm run check:builds` verifies it). The SDKs themselves are not part of the repository or
the bundle: each portal serves its SDK from its own server. An adapter is 1–2 kB.

If the SDK does not load or fails to start (an ad blocker, the game opened outside the portal), the
game runs on the web platform without ads, and an error goes to the console. A slow SDK holds the
start for 5 seconds at most: then the game starts in the browser language and with
`localStorage`, and the SDK joins when it is ready (within 30 seconds). It then hears what it has
missed: loading finished, gameplay going, the level attempt.

**In the game code:**

```ts
PlatformMng.loadingFinished(); // once, when the player can start playing (PreloaderScene)
PlatformMng.gameplayStart(); // a round starts (GameScene)
PlatformMng.gameplayStop(); // the round ends, a menu opens
PlatformMng.levelStart(3); // an attempt at level 3 (Poki statistics)
PlatformMng.levelEnd(won); // the attempt is over; leaving it for the menu: levelEnd(false)
void PlatformMng.reportScore(best); // the best result to the leaderboard (Yandex)

await AdMng.showInterstitial(); // at a natural break; the demo: before every round but the first
if (await AdMng.showRewarded()) giveReward();
if (!AdMng.isAvailable()) hideRewardButtons();

SaveMng.set('best', score); // fields are declared in src/save/SaveData.ts
```

Gameplay is reported to the portal only while the game is not paused: during an ad, with a hidden
tab or with the rotate overlay the portal gets `gameplayStop`, and `gameplayStart` after that.
Never twice in a row, and not on behalf of the SDK: Yandex stops and starts `GameplayAPI` itself on
`game_api_pause` and `game_api_resume` (`IPlatform.pauseStopsGameplay`).

### Ads

`AdMng.showInterstitial()` and `showRewarded()` work the same on every portal:

- **The request** stops the game (`adWait`), so the ad opens over the screen the player has left.
  The sound plays on: the SDK may answer that there is no ad, and CrazyGames asks to mute only
  when an ad starts.
- **The ad starts** (`onOpen`, `adStarted`): the game is muted until it is over. Poki does not
  always report the start, so there the game is muted from the request on.
- **No answer in 5 seconds** (`Config.ADS.START_TIMEOUT_MS`): the game goes on as if there were no
  ad, a rewarded ad gives no reward. If the ad starts later anyway, the game stops again until it
  is over. No other ad is requested until the SDK has answered.
- **The interval.** Interstitials are at least `Config.ADS.INTERSTITIAL_INTERVAL_MS` (60 s) apart,
  and the first one comes that long after the game has loaded: the portal may show its own ad at
  the start. A rewarded ad restarts the interval too. Yandex and CrazyGames pace ads themselves as
  well (CrazyGames: one midgame ad in 3 minutes); Poki decides every break itself, so there the
  game keeps no interval and signals every natural break.

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

- **Yandex Games** — the language is the SDK's; a language the game lacks gets the Yandex
  fallback: Russian for Belarusian, Kazakh, Ukrainian and Uzbek, English for the rest. On a
  desktop the game field is at most 2:1 (requirement 1.6.2.2), centered, the page background
  around it. For a leaderboard set `Config.YANDEX_LEADERBOARD` and create a numeric leaderboard
  with that technical name in the console; a guest writes nothing. Upload the archive from
  `npm run zip`.
- **CrazyGames** — turn on "Progress Save" when submitting the game, or saves stay in
  `localStorage`. Between two levels show either a midgame ad or a rewarded "continue", not both.
- **Poki** — a commercial break is expected before every gameplay start except the first one.
  With an ad blocker `PokiSDK.init()` fails: the game goes on with the SDK, without ads.
  Level attempts go to `measure('level', …)`.

**Adding a platform:** implement `IPlatform` in `src/platform/<id>/`, add the id and the SDK script
to `PLATFORMS` in `src/platform/platforms.ts`, add a branch to `createPlatform()`, the scripts to
`package.json` and the SDK global to `scripts/check-builds.mjs`.

## UI

**Theme.** `src/gui/Theme.ts` holds the palette, the button skins, the text styles and the sizes.
The UI is drawn from these values and the atlas icons are white, so changing the theme restyles
the whole game. The background of every scene is the page background in `src/styles/main.css`:
the canvas is transparent, and the background costs nothing to render.

**Buttons:**

```ts
// a round button with an icon, pinned to the corner of the visible area
const btnPause = iconButton(this, 'icons/pause', this.onPauseClick, this);
this.add.existing(btnPause);
this.anchor(btnPause, { left: 110, top: 110 });

// a button with a caption and an icon; a long caption is scaled down to fit
const btnPlay = textButton(this, this.t('btn_play'), this.onPlayClick, this, {
  width: 580,
  skin: Theme.skin.primary,
  icon: 'icons/play',
});
```

`ToggleButton` is an on/off switch, `LangButton` opens the list of languages. Rounded shapes come from
`gui/shapes.ts`: they are drawn once into a texture (a `Graphics` object is tessellated again on
every frame).

**Popups** live in their own scene above the game, so a popup keeps working while the scene that
opened it is paused:

```ts
this.scene.pause(); // update(), timers and tweens of the game scene stop
const answer = await PopupScene.open(this, PausePopup); // 'resume' | 'menu'
this.scene.resume();
```

To make a popup, extend `Popup<Result>`: add objects to `this.content`, call `this.close(result)`.
`allowDismiss(result)` adds a close button and closes the popup on a tap outside of it. A panel
larger than the screen (a portrait phone) is scaled down to fit it.

## Screen and layout

The game world has two areas, one inside the other, both centered (`src/data/Config.ts`):

| Area      | Size                                   | Meaning                                                |
| --------- | -------------------------------------- | ------------------------------------------------------ |
| Full area | `GW` × `GH`, 2400×1080 (20:9)          | The most a screen can show. Backgrounds are this size. |
| Safe area | `GW_SAFE` × `GH_SAFE`, 1440×1080 (4:3) | Always on screen whole: the gameplay and the main UI.  |

The canvas uses `Phaser.Scale.EXPAND`: it shows the safe area whole and grows by as much as the
window allows. It is always exactly the visible area, so nothing off screen is rendered:

| Window         | Canvas    | On screen                                        |
| -------------- | --------- | ------------------------------------------------ |
| 4:3            | 1440×1080 | the safe area                                    |
| 16:9           | 1920×1080 | the safe area and 240 px on each side            |
| 20:9           | 2400×1080 | the full area                                    |
| 21:9           | 2520×1080 | the full area, the page background at the sides  |
| a square       | 1440×1440 | the safe area, the page background above, below  |

The main camera of every scene looks at the middle of the full area (`CenterCameraPlugin`), so
coordinates do not depend on the window: `Config.GW_HALF, Config.GH_HALF` is the middle of the
screen, and the safe area is always in the same place. UI near the screen edges is pinned with
`this.anchor(obj, { right: 110, top: 110 })`: `Viewport` gives the visible edges, never beyond the
full area. A full-screen shade or background is sized by `Viewport.screen`.

**Orientation.** `Config.ORIENTATION` is `'landscape'`, `'portrait'` or `'any'`. A phone or a
tablet held the wrong way shows the "rotate your device" overlay: the game keeps loading behind it
and is paused once loaded. A desktop window of any shape shows the game.

**A portal may limit the field.** Yandex Games asks for a game field of at most 2:1 on a desktop:
there the game is a centered box of that shape (`limitFieldAspect()`), and the canvas fills the
box, not the window. The layout needs nothing: the box is just a window of another shape.

**Choosing the sizes.** The safe area height is the resolution the art is drawn for: 1080 looks
sharp on most phones, a lower one (720 in landscape, 1200–1400 in portrait) means smaller atlases
and less memory on weak phones. The safe area is the narrowest screen you design for, the full
area the widest:

- landscape: safe 4:3 (a tablet), full 20:9 (a phone) — the template's 1440×1080 and 2400×1080;
- portrait, 1400 high: safe 9:19.5 (a phone) `GW_SAFE = 646`, full 3:4 (a tablet) `GW = 1050`,
  `GH = GH_SAFE = 1400`, `ORIENTATION: 'portrait'`;
- both orientations (`'any'`): a square safe area, e.g. 1080×1080, keeps the same scale either
  way; the layout follows `Viewport.isPortrait`.

The demo works with all three: the menu is laid out from the middle of the screen, its texts fit
the safe area width (`fitText()`), the popups scale down, and the HUD of the round moves below the
pause button when the safe area is narrow.

A full area taller than the safe area (`GH > GH_SAFE`) lets tall phones show more in portrait.
`Config.PRELOADER.DRAW_DEBUG_BORDER` shades both areas on the preloader screen.

**A scene that moves its camera** (a scrolling level) turns the centering off in `create()`:
`this.centerCamera.enabled = false`, and keeps its UI in another scene. A camera that follows a
target (`startFollow`) needs nothing.

## Localization

The ten languages games are usually translated into: English, Russian, German, French, Spanish,
Brazilian Portuguese, Italian, Japanese, Korean and Simplified Chinese. Texts are in
`src/locale/`, one file per language. English is the reference: a key is added to `en.ts` first,
and the compiler asks for it in every other locale. Unit tests check every translation: the same
keys and parameters as in English, no more plural forms than the language has.

```ts
this.t('demo_best', { count: 5 }); // 'Best: 5 orbs'
LocaleMng.getInstance().formatNumber(1234567); // '1,234,567' or '1 234 567'
this.registerLangChange(this.updateTexts); // texts follow the language switch
```

- **Parameters** — `{name}` in a string is replaced by the parameter `name`.
- **Plural forms** — `{count|orb|orbs}` picks a form by the number in `count`. The forms go in the
  order of the language's plural categories (a missing form falls back to the last one):

  | Language                             | Forms              | Example                       |
  | ------------------------------------ | ------------------ | ----------------------------- |
  | English, German                      | `one\|other`       | `{count\|orb\|orbs}`           |
  | Russian                              | `one\|few\|many`   | `{count\|шар\|шара\|шаров}`    |
  | French, Spanish, Portuguese, Italian | `one\|many\|other` | `{count\|bulle\|bulles}`       |
  | Japanese, Korean, Chinese            | none               | `{count}個`                   |

  In French, Spanish, Portuguese and Italian `many` is for a million and more, so two forms,
  singular and plural, are enough.

- **The language** is the one the player picked (`LangButton` opens the list, the choice is
  saved), then the portal's, then the browser's, then English. Yandex names a fallback after the
  player's language (Russian or English), so there the browser is not asked. Any Chinese variant gets
  Simplified Chinese, any Portuguese one gets Brazilian Portuguese.
- **Fonts** — the bundled font (Ubuntu, Latin and Cyrillic) covers seven of the languages. Chinese,
  Japanese and Korean are drawn with a system font of the device: every phone and computer has
  one, and a CJK web font would weigh several megabytes. The page `lang` follows the game language,
  so the browser picks the Japanese, Korean or Chinese variant of the system font.
- **Long translations** — `fitText(text, maxWidth)` scales a text down to fit; buttons do it
  themselves. German and Portuguese are usually the longest.

**Adding a language:** add its code to `LANGS` in `src/locale/LocaleKeys.ts` and follow the
compiler: a name in `LANG_NAMES`, a locale file listed in `LOCALES` in `LocaleMng.ts`. Check that
the font has its letters: Turkish, Polish, Czech or Vietnamese need another Fontsource subset
(`latin-ext`, `vietnamese`) imported in `src/index.ts` and a sample letter in `SAMPLE_TEXT`
(`src/utils/FontLoader.ts`). Right-to-left languages (Arabic, Hebrew) also need a mirrored layout.

## Assets

Everything in `public/` is copied to the build unchanged and is loaded at runtime by path.

- **Atlases** — pack sprites with [TexturePacker](https://www.codeandweb.com/texturepacker) or
  [Free Texture Packer](https://free-tex-packer.com) using a Phaser JSON format and put the
  result into `public/assets/atlases/`, then run `npm run gen:assets`. Every atlas in that folder
  is loaded by `PreloaderScene`, and its frame names become the `AtlasFrame` type.
- **Source art** — unpacked images and packer project files live in `raw-assets/`. Only `public/`
  gets into the build. The demo atlas is packed from the SVG files in `raw-assets/atlas/`: icons
  are 120 px, white, and tinted in code.
- **Audio** — put files into `public/assets/audio/` and list them in `src/data/AudioData.ts`.
  The demo sounds and the music loop are synthesized placeholders: replace them.
- **Fonts** — fonts come from [Fontsource](https://fontsource.org) packages. To change the font:
  install the package, import its CSS in `src/index.ts` (one file per script and weight) and set
  the family and the weights in `Config.FONT` and `Config.FONT_WEIGHTS` (`src/data/Config.ts`).
  They are loaded before the game starts.

## Starting a new game

1. Run `npm run init -- my-game "My Game"`. It sets the package name, the page title, the save
   key (`Config.SAVE.KEY`) and the title on the menu screen, and moves this file to `TEMPLATE.md`.
2. Replace the icons in `public/assets/icons/`.
3. Set the game size and orientation in `src/data/Config.ts` (see
   [Screen and layout](#screen-and-layout)), the colors in `src/gui/Theme.ts`
   and `src/styles/main.css`.
4. Build your game in place of the demo round. `GameScene` shows how a round uses the template
   (states, pause, ads, saves): rewrite it, and when the demo is no longer needed remove
   - `src/demo/` and `tests/demo/`;
   - the `demo_*` keys in `src/locale/`;
   - the `best` field in `src/save/SaveData.ts` and its test;
   - the demo sounds in `src/data/AudioData.ts` and `public/assets/audio/`;
   - the sprites `orb`, `orb-shine`, `ring` and `dot` in the atlas (then `npm run gen:assets`).

   The compiler points at everything that still uses them.
5. Add texts to `src/locale/`: new keys go to `en.ts` first, the other locales must translate them.

## Development notes

- **Debug mode** — add `#debug` to the URL, e.g. `http://localhost:9100/#debug`: verbose logs
  (dev builds only), a frame rate overlay and errors on screen (any build, so they work on a phone
  and in a portal draft too).
- **Open a scene directly** — `http://localhost:9100/?scene=GameScene` skips the menu (dev builds).
- **Browser tests** — `npm run build:all && npm run test:e2e` starts every build in headless
  Chromium with a mock of its SDK (`e2e/mocks/`): no errors, no requests to other servers, the
  portal gets "loading finished" once. Before the first run: `npx playwright install chromium`.
- **Coding agents** — `AGENTS.md` lists the rules of the code base and recipes for common changes.
- **Phaser import** — import Phaser explicitly in every module that uses it:
  `import * as Phaser from 'phaser'`. There is no global `Phaser` object in the production
  build; a lint rule guards this.
- **Host page events** — the page can talk to the game through `window` events:

  ```js
  // page → game
  window.dispatchEvent(new CustomEvent('shellEvent', { detail: { type: 'MUTE', muted: true } }));
  // game → page: 'LOADED' when the game is ready for the player
  window.addEventListener('gameEvent', (e) => console.log(e.detail.type));
  ```

  Incoming event types are listed in `ShellInEvent`; anything else is ignored.

- **Deploy** — `npm run build` produces a static site in `dist/web/`, `build:<platform>` in
  `dist/<platform>/`. All paths are relative, so a build works from any folder. `npm run zip`
  packs every build into `dist/<name>-<platform>-<version>.zip` with `index.html` at the root.

## Roadmap

Ideas for the template, its known limitations and what has not been verified yet are listed in
[docs/ROADMAP.md](docs/ROADMAP.md).

## License

[MIT](LICENSE)
