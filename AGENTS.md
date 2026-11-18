# Guide for coding agents

A browser game on Phaser, TypeScript and Vite. One code base, a build per game portal: web,
Yandex Games, CrazyGames, Poki. `README.md` describes the features; this file holds the rules
that are not visible from the structure, and recipes for common changes.

## Commands

| Command | When |
| --- | --- |
| `npm run dev` | Dev server at http://localhost:9100, ads are simulated. `?scene=GameScene` opens a scene directly, `#debug` shows the frame rate and errors on screen. |
| `npm run check` | Before a change is called done: atlas types, type-check, lint, formatting, unit tests. |
| `npm run format` | Fixes formatting (Prettier). |
| `npm run build:all && npm run check:builds && npm run test:e2e` | The rest of CI. Run it after touching `src/platform/`, `src/index.ts`, the Boot or Preloader scene, `index.html` or `vite.config.ts`. |
| `npm run gen:assets` | After any change in `public/assets/atlases/`. |

## Map

- `src/index.ts` — startup order: platform SDK and fonts → saves → sound switches → language → game.
- `src/scenes/` — Boot → Preloader → Menu ⇄ Game. `PopupScene` (popups) and `TransitionScene`
  (the curtain) run above them.
- `src/gui/` — `Theme.ts` (every color, size and text style), `buttons.ts`, `shapes.ts`, `popup/`.
- `src/scaling/` — `Viewport` (the visible edges), `CenterCameraPlugin`, the rotate overlay.
- `src/demo/` — the demo round. It is an example to replace, not a part of the template.
- `src/platform/`, `src/ads/`, `src/save/`, `src/pause/`, `src/audio/`, `src/locale/` — services,
  static classes named `*Mng`.
- `tests/` — unit tests: Vitest, Node environment, no DOM, no Phaser. `e2e/` — Playwright tests
  of the builds in `dist/`.

## Rules

1. **Coordinates.** World coordinates are fixed: the full area is `Config.GW` × `Config.GH`
   (2400×1080), the safe area `Config.GW_SAFE` × `Config.GH_SAFE` (1440×1080) in its middle is
   always on screen whole: gameplay must fit there. The canvas is only the visible part
   (`Phaser.Scale.EXPAND`), and `CenterCameraPlugin` keeps every main camera on the middle of the
   full area. UI at the edges is placed with `this.anchor(obj, { left: 90, top: 80 })`, never with
   hand-written math; a full-screen shade is sized by `Viewport.screen`. Do not lay out by
   `this.scale.width` or `this.cameras.main.width`: they are the screen, not the world.
2. **Scenes** extend `BaseScene`. Subscribe with `registerResize`, `registerLangChange` and
   `anchor`: they are removed on shutdown. A scene object is reused when the scene starts again,
   so reset its state in `create()`.
3. **Phaser import.** `import * as Phaser from 'phaser'` in every file that uses it. There is no
   global `Phaser`.
4. **Pause.** Never call `game.pause()` or `game.resume()`: use `PauseMng.pause(reason)` and
   `PauseMng.resume(reason)`. A pause menu is `this.scene.pause()` plus
   `PopupScene.open(this, PausePopup)`.
5. **Ads** go through `AdMng` only (`showInterstitial`, `showRewarded`), at natural breaks. Hide
   reward buttons when `AdMng.isAvailable()` is false.
6. **Gameplay boundaries.** Call `PlatformMng.gameplayStart()` when the player gets control and
   `PlatformMng.gameplayStop()` when a round ends or is paused.
7. **Portal SDKs.** The SDK globals (`YaGames`, `CrazyGames`, `PokiSDK`) appear only inside
   `src/platform/<id>/`. Adapters are imported only dynamically, in `createPlatform()`: a static
   import puts the adapter into every build and fails `check:builds`. Game code talks to
   `PlatformMng`, `AdMng` and `SaveMng`. An SDK failure must never break the game.
8. **Saves.** A field needs three things in `src/save/SaveData.ts`: the type, the default and
   a check in `parseSave()`. Read and write with `SaveMng.get` and `SaveMng.set`, not with
   `localStorage`.
9. **Texts.** No text for the player in code. Add the key to `src/locale/en.ts` first, then to
   all ten locale files (`npm test` fails on a missing key or parameter). Use
   `this.t('key', params)`; plural forms are `{count|orb|orbs}`, their order differs per language
   (see `LocaleMng.t()`), Japanese, Korean and Chinese have none. Every
   text must follow a language change (`registerLangChange`, `Popup.updateTexts`). A translation
   can be longer than the original: `fitText()`.
10. **Look.** Colors, sizes and text styles come from `Theme`, not from literals in scenes.
    Buttons are made with `iconButton()` and `textButton()`. Rounded shapes are textures from
    `gui/shapes.ts`, not `Graphics`: Phaser tessellates a `Graphics` object on every frame.
11. **Assets.** Atlas frames are typed (`AtlasFrame`). Sounds are listed in
    `src/data/AudioData.ts` and played with `AudioMng`, not with `scene.sound`. The player's
    sound switches are `AudioSettings`.
12. **Time.** Game timers and tweens use the scene clock (`this.time`, `this.tweens`,
    `this.wait(ms)`, `this.tween(config)`), so they stop with a pause. `delay()` from
    `utils/async` is real time.
13. **Logs.** `LogMng`, not `console`. `debug()` and `info()` are compiled out of production.
14. **Tests.** Logic that does not need Phaser lives in plain classes with unit tests (see
    `src/demo/Round.ts`). A module that imports `phaser` cannot be imported in a unit test.
15. **Language.** Code, comments, commit messages and docs are in English.

## Recipes

**Add a scene.** Add its key to `SceneNames`, write a class that extends `BaseScene` in
`src/scenes/`, add it to the `scene` list in `src/index.ts` before `PopupScene`. Switch to it with
`TransitionScene.change(this, SceneNames.MyScene)`.

**Add a popup.** Extend `Popup<Result>` (see `src/gui/popup/PausePopup.ts`): build the content in
the constructor with `this.content.add()`, set texts in `updateTexts()`, finish with
`this.close(result)`. Open it with `await PopupScene.open(this, MyPopup, ...constructorArgs)`.

**Add a text.** Key in `src/locale/en.ts`, translation in the nine other locale files, `this.t('key')`
in the scene, and a line in the scene's language-change handler.

**Add a save field.** In `src/save/SaveData.ts`: the field in `SaveData`, its default in
`DEFAULT_SAVE`, its check in `parseSave()`. Add a case to `tests/save/SaveMng.test.ts`.

**Add a sound.** File in `public/assets/audio/`, an alias in `AudioAlias` and a line in
`AUDIO_LOAD_DATA` (`src/data/AudioData.ts`), then `AudioMng.playSfx(AudioAlias.MySound)`.

**Add a sprite or an icon.** Source image in `raw-assets/atlas/`, repack
`public/assets/atlases/game.png` and `game.json`, run `npm run gen:assets`. Icons are white and
tinted in code.

**Add a language.** Add the code to `LANGS` in `src/locale/LocaleKeys.ts` and follow the compiler
errors. If the bundled font lacks its letters (Turkish, Polish, Vietnamese), import the
Fontsource subset in `src/index.ts`: see "Adding a language" in `README.md`.

**Add a portal.** See "Adding a platform" in `README.md`.
