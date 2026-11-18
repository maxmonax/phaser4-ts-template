# Phaser 4 — TypeScript + Vite Template

A starter template for browser games built with **Phaser 4**, **TypeScript** and **Vite**.

> The same template for Phaser 3: [phaser3-ts-webpack](https://github.com/maxmonax/phaser3-ts-webpack).

## Stack

| Tool                                          | Version | Purpose                         |
| --------------------------------------------- | ------- | ------------------------------- |
| [Phaser](https://phaser.io)                   | 4.2     | Game engine                     |
| [TypeScript](https://www.typescriptlang.org)  | 6.0     | Type-safe game code             |
| [Vite](https://vite.dev)                      | 8       | Dev server and production build |
| [ESLint](https://eslint.org)                  | 10      | Linting                         |
| [Prettier](https://prettier.io)               | 3       | Code formatting                 |
| [Vitest](https://vitest.dev)                  | 5       | Unit tests                      |

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

| Command                | Description                                        |
| ---------------------- | -------------------------------------------------- |
| `npm run dev`          | Start the dev server                               |
| `npm run build`        | Type-check and build for production into `dist/`   |
| `npm run preview`      | Serve the production build locally                 |
| `npm run check`        | Type-check, lint, formatting check and unit tests  |
| `npm run typecheck`    | TypeScript type checking                           |
| `npm run lint`         | Run ESLint (`lint:fix` to auto-fix)                |
| `npm run format`       | Format with Prettier (`format:check` to only check) |
| `npm test`             | Run unit tests (`test:watch` for watch mode)       |

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
│   ├── gui/             # UI components (buttons, preloader bar, curtain)
│   ├── audio/           # Audio manager
│   ├── locale/          # Translations (en, ru)
│   ├── events/          # Event bus and bridge to the host page
│   ├── scaling/         # Orientation overlay
│   ├── data/            # Config, runtime params, audio list
│   ├── utils/           # Logging, math, state machines, font loading
│   └── styles/          # Page CSS
├── tests/               # Unit tests
└── vite.config.ts       # Build and test configuration
```

## Features

- **Scene flow** — Boot → Preloader → Menu → Game, with a curtain transition between scenes
  (`TransitionScene.change(scene, target)`).
- **UI components** — `MyButton`, `MyTextButton`, `MyText`, `MyImage`, `MyContainer`,
  `MyGraphics`, `PreloaderBar`, `Curtain`.
- **Audio manager** — `AudioMng`: music with fades, crossfade and ducking, sound effects with
  instance limits, separate music/sfx switches and volumes, global mute. It belongs to the game,
  not to a scene, so music and fades continue across scene changes.
- **Localization** — English and Russian, type-safe keys, switching at runtime, language
  detection from the browser settings.
- **Scaling** — fixed-height layout (2400×1080 with a 1440×1080 safe zone) and an overlay that
  asks to rotate the device and pauses the game meanwhile.
- **Shell bridge** — typed events between the game and the page that hosts it.
- **State machines** — `FSM` and `StackFSM`.
- **Logging** — `LogMng`: warnings and errors in every build, verbose output in dev builds.
- **Bundled fonts** — web fonts ship with the game; no requests to external servers.
- **Path alias** — `@/` points to `src/`.

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

1. Set `name` and `description` in `package.json` and `<title>` in `index.html`.
2. Replace the icons in `public/assets/icons/`.
3. Set the game size and orientation in `src/data/Config.ts`.
4. Replace the demo atlas and sounds, then build your scenes on top of `BaseScene`.
5. Add texts to `src/locale/`: new keys go to `en.ts` first, the other locales must translate them.

## Development notes

- **Verbose logs** — open the dev server with `#debug` in the URL, e.g.
  `http://localhost:9100/#debug`.
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

- **Deploy** — `npm run build` produces a static site in `dist/`. All paths are relative, so it
  works from any folder or from a zip uploaded to a game portal.

## License

[MIT](LICENSE)
