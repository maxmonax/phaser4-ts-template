import { defineConfig } from '@playwright/test';

/** End-to-end checks of the builds in `dist/`: `npm run build:all && npm run test:e2e`. */
export default defineConfig({
  testDir: 'e2e',
  // A few short tests of static builds: one worker keeps CI light.
  workers: 1,
  timeout: 30_000,
  reporter: 'list',
  use: {
    viewport: { width: 1280, height: 720 },
    // A headless browser has no GPU: WebGL runs on the software renderer.
    launchOptions: { args: ['--use-gl=swiftshader'] },
  },
});
