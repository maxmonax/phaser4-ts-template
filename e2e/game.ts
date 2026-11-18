import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Page } from '@playwright/test';
import { PLATFORMS, type PlatformId } from '../src/platform/platforms.ts';

declare global {
  interface Window {
    /** Calls recorded by the mock SDKs in `e2e/mocks`. */
    __sdkCalls?: string[];
    /** Types of the `gameEvent`s the game has sent to the page. */
    __gameEvents?: string[];
  }
}

/**
 * The address of the game under test. Nothing listens there: every request
 * of the page is answered from `dist/<platform>`, so the tests need no server.
 */
const ORIGIN = 'http://game.test';

export type GameUnderTest = {
  /** Page errors, console errors and requests to other servers, as they come. */
  problems: string[];
  /** Calls the game has made to the (mock) SDK of the platform so far. */
  sdkCalls(): Promise<string[]>;
  /** Resolves when the game reports that it is loaded. */
  loaded(): Promise<void>;
  /** Taps the middle of the game. */
  tapCenter(): Promise<void>;
};

export type OpenOptions = {
  /** `mock` (default): the SDK is replaced by `e2e/mocks/<platform>.js`. `missing`: it fails to load. */
  sdk?: 'mock' | 'missing';
};

/** Opens the build of a platform from `dist/` and waits for its canvas. */
export async function openGame(
  page: Page,
  platform: PlatformId,
  options: OpenOptions = {}
): Promise<GameUnderTest> {
  const dist = join(process.cwd(), 'dist', platform);
  if (!existsSync(join(dist, 'index.html'))) {
    throw new Error(`No build in dist/${platform}. Run: npm run build:all`);
  }

  const problems: string[] = [];
  page.on('pageerror', (error) => problems.push(`page error: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`console error: ${message.text()}`);
  });

  const sdk = PLATFORMS[platform].sdk;
  const sdkUrl = sdk ? new URL(sdk, `${ORIGIN}/`).href : null;

  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.href === sdkUrl) {
      if (options.sdk === 'missing') return route.fulfill({ status: 404, body: 'Not found' });
      return route.fulfill({ path: join(import.meta.dirname, 'mocks', `${platform}.js`) });
    }
    // A build is self-contained: besides the SDK it must not need any other server.
    if (url.origin !== ORIGIN) {
      problems.push(`external request: ${url.href}`);
      return route.abort();
    }
    const file = join(
      dist,
      decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname)
    );
    if (!existsSync(file)) return route.fulfill({ status: 404, body: 'Not found' });
    return route.fulfill({ path: file });
  });

  await page.addInitScript(() => {
    window.__gameEvents = [];
    window.addEventListener('gameEvent', (event) => {
      window.__gameEvents?.push(String((event as CustomEvent).detail?.type));
    });
  });

  await page.goto(`${ORIGIN}/`);
  const canvas = page.locator('canvas');
  await canvas.waitFor({ state: 'visible' });

  return {
    problems,
    sdkCalls: () => page.evaluate(() => window.__sdkCalls ?? []),
    loaded: async () => {
      await page.waitForFunction(() => window.__gameEvents?.includes('LOADED'));
    },
    tapCenter: async () => {
      const box = await canvas.boundingBox();
      if (!box) throw new Error('The canvas is not visible');
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    },
  };
}
