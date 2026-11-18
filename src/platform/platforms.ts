/**
 * Platforms the game can be built for: `vite build --mode <id>`.
 *
 * `sdk` is the script of the platform SDK. vite.config.ts adds it to index.html
 * of that platform's build only. Runtime code imports just the `PlatformId` type,
 * so nothing from this list gets into the game bundle.
 */
export const PLATFORMS = {
  /** No portal: own site, itch.io, local development. Ads are simulated in dev builds. */
  web: { sdk: null },
  /** Yandex Games. The SDK is served by Yandex itself at this relative path. */
  yandex: { sdk: '/sdk.js' },
} as const satisfies Record<string, { sdk: string | null }>;

export type PlatformId = keyof typeof PLATFORMS;
