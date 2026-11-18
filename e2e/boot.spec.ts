import { expect, test } from '@playwright/test';
import { PLATFORMS, type PlatformId } from '../src/platform/platforms.ts';
import { openGame } from './game.ts';

/** What the mock SDK of each platform records for "initialized" and "loading finished". */
const SDK_CALLS: Record<Exclude<PlatformId, 'web'>, { init: string; loaded: string }> = {
  yandex: { init: 'YaGames.init', loaded: 'LoadingAPI.ready' },
  crazygames: { init: 'init', loaded: 'loadingStop' },
  poki: { init: 'init', loaded: 'gameLoadingFinished' },
};

for (const platform of Object.keys(PLATFORMS) as PlatformId[]) {
  test(`${platform}: the build starts without errors`, async ({ page }) => {
    const game = await openGame(page, platform);
    await game.loaded();

    // The first tap leaves the preloader: the first scene of the game must start cleanly too.
    await game.tapCenter();
    await page.waitForTimeout(1000);

    expect(game.problems).toEqual([]);

    const calls = await game.sdkCalls();
    if (platform === 'web') {
      expect(calls).toEqual([]);
    } else {
      const expected = SDK_CALLS[platform];
      expect(calls[0]).toBe(expected.init);
      // The portal hears "loading finished" exactly once.
      expect(calls.filter((call) => call === expected.loaded)).toHaveLength(1);
    }
  });
}

test('yandex: without the SDK the game runs as the web version', async ({ page }) => {
  const game = await openGame(page, 'yandex', { sdk: 'missing' });
  await game.loaded();
  await game.tapCenter();
  await page.waitForTimeout(1000);

  expect(game.problems.filter((problem) => problem.startsWith('page error'))).toEqual([]);
  expect(game.problems.join('\n')).toContain('Platform "yandex" is not available');
});
