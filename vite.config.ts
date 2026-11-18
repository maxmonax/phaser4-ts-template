import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { PLATFORMS, type PlatformId } from './src/platform/platforms.ts';

/** Vite's own modes build the web version. */
const WEB_MODES = new Set(['development', 'production', 'test']);

/** `vite build --mode yandex` → `yandex`. A typo in the mode fails the build. */
function platformFromMode(mode: string): PlatformId {
  if (WEB_MODES.has(mode)) return 'web';
  if (Object.hasOwn(PLATFORMS, mode)) return mode as PlatformId;
  throw new Error(
    `Unknown platform "${mode}" in --mode. Known platforms: ${Object.keys(PLATFORMS).join(', ')}.`
  );
}

/** Adds the platform SDK script to <head>, before the game bundle. */
function platformSdk(src: string | null): Plugin {
  return {
    name: 'platform-sdk',
    transformIndexHtml: () =>
      src ? [{ tag: 'script', attrs: { src }, injectTo: 'head-prepend' }] : [],
  };
}

export default defineConfig(({ mode }) => {
  const platform = platformFromMode(mode);

  return {
    // Relative asset paths: the build works from any subfolder
    // (itch.io, Yandex Games, GitHub Pages, ...).
    base: './',
    define: {
      // Replaced in the code at build time: only the adapter of this platform is bundled.
      'import.meta.env.VITE_PLATFORM': JSON.stringify(platform),
    },
    plugins: [platformSdk(PLATFORMS[platform].sdk)],
    resolve: {
      // Path aliases (@/*) are taken from tsconfig.json.
      tsconfigPaths: true,
    },
    server: {
      port: 9100,
    },
    build: {
      outDir: `dist/${platform}`,
      // Keep bundled JS/CSS apart from the game assets copied from public/assets.
      assetsDir: 'bundle',
      // Phaser alone is larger than the default 500 kB warning limit.
      chunkSizeWarningLimit: 1500,
      rolldownOptions: {
        output: {
          // Phaser goes to its own chunk: it stays cached between game releases.
          codeSplitting: {
            groups: [{ name: 'phaser', test: /node_modules[\\/]phaser/ }],
          },
        },
      },
    },
    test: {
      // Unit tests cover engine-independent logic only, so no DOM is needed.
      environment: 'node',
      include: ['tests/**/*.test.ts'],
    },
  };
});
