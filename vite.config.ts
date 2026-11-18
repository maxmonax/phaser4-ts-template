import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative asset paths: the build works from any subfolder
  // (itch.io, Yandex Games, GitHub Pages, ...).
  base: './',
  resolve: {
    // Path aliases (@/*) are taken from tsconfig.json.
    tsconfigPaths: true,
  },
  server: {
    port: 9100,
  },
  build: {
    outDir: 'dist',
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
});
