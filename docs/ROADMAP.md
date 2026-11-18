# Roadmap

What could come next for the template, what it does not do well yet, and what has not been
checked. Nothing here blocks making a game with it. Last reviewed: 2026-11-19.

Remove an item when it is done; add one when you find a limitation.

## Waiting on dependencies

- **TypeScript 7.** The code already type-checks with TypeScript 7.0, but `typescript-eslint`
  (8.73) supports TypeScript below 6.1 only. Update both together once it supports 7.

## Ideas

### Game portals

- **More portals** — VK Play, GameDistribution, GamePush and others fit the same scheme: an
  adapter in `src/platform/<id>/`, see [Adding a platform](../README.md#platforms).
- **Features of one portal** — reviews on Yandex Games (`feedback.canReview()`,
  `requestReview()`), leaderboards, achievements. They are not in every portal, so they need an
  optional part of `IPlatform` that the game checks before use.
- **The ad countdown** — `AdShower` ("Ad in 3… 2… 1…") is not used by the demo: on CrazyGames
  and Poki the portal decides whether an ad is shown, and the countdown could end with no ad.
  It fits a portal where the game paces ads itself (`interstitialCooldownMs > 0`, Yandex).

### Localization

- **Turkish** — a large audience on Yandex Games and other portals. It needs the `latin-ext`
  subset of the font, see [Adding a language](../README.md#localization).
- **A font for Chinese, Japanese and Korean** — these languages use a system font of the device
  now, so the look differs between devices, and titles are regular where that font has no bold.
  A subset of a CJK font with only the characters of the locale files, generated at build time,
  would look the same everywhere and stay small. Texts that come from players (names) would still
  need the system font.
- **Numbers inside texts** — `{count}` is inserted as is: "1234 bulles", not "1 234 bulles".
  `t()` could format number parameters for the language, as the HUD does with `formatNumber()`.
- **Locales on demand** — all ten locale files are in the bundle, under 1 kB each. A game with
  hundreds of texts would load the current language only, with a dynamic `import()`.

### Demo

- **Real sounds and music** — the demo audio is synthesized placeholders.

### Tooling and repository

- **A bundle size report** — the webpack setup had `build:analyze`; the Vite build has no
  replacement yet.
- **A playable demo** — a CI job that deploys `dist/web` to GitHub Pages, linked from the README.
- **Versions** — tags and a changelog, so a game made from the template can tell what has changed
  since it was created.
- **Verbose logs in production builds** — `#debug` shows the frame rate and errors on screen in
  any build, but `LogMng.debug()` and `info()` print only in dev builds. Turning them on with
  `#debug` would help to debug a portal draft; the open question is whether players should be
  able to do that.

## Known limitations

- **The canvas can be larger than the full area.** On a screen wider or taller than the full area
  the canvas covers the whole window, and the part beyond the full area is rendered transparent.
  Phaser's `scale.max` cannot limit it: Phaser applies `max` both to the canvas size and to its
  CSS size, which stretches the picture on screens taller than 1080 CSS pixels.

## Not verified yet

The template is checked by unit tests, by browser tests that start every build with a mock of its
portal SDK, and by screenshots in headless Chromium. Not checked yet:

- real phones and tablets: frame rate, touch targets, rotating the device with a popup open;
- Safari and iOS, including `(pointer: coarse)` on iPad, which decides whether the rotate overlay
  is shown; Firefox;
- the real portal SDKs: the Yandex SDK proxy and a draft, CrazyGames developer tools, the Poki
  Inspector (see [Platforms](../README.md#platforms));
- fullscreen modes of the portals.
