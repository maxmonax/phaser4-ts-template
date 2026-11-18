import { expect, test, type Page } from '@playwright/test';
import { openGame } from './game.ts';

/** The size of the canvas in game pixels. */
function canvasSize(page: Page): Promise<number[]> {
  return page
    .locator('canvas')
    .evaluate((canvas: HTMLCanvasElement) => [canvas.width, canvas.height]);
}

// The safe area 1440×1080 is always on screen whole, and the canvas is exactly the visible
// area: it fills the window, and its size in game pixels follows the window shape.
const WINDOWS = [
  { name: '16:9', width: 1280, height: 720, canvas: [1920, 1080] },
  { name: '4:3, the safe area only', width: 960, height: 720, canvas: [1440, 1080] },
  { name: '20:9, the full area', width: 1600, height: 720, canvas: [2400, 1080] },
  { name: '21:9, wider than the full area', width: 1680, height: 720, canvas: [2520, 1080] },
  { name: 'a square window', width: 800, height: 800, canvas: [1440, 1440] },
  { name: 'a narrow desktop window', width: 390, height: 844, canvas: [1440, 3116] },
];

for (const window of WINDOWS) {
  test(`${window.name}: the canvas is the visible area`, async ({ page }) => {
    await page.setViewportSize({ width: window.width, height: window.height });
    const game = await openGame(page, 'web');
    await game.loaded();

    await expect(page.locator('canvas')).toBeVisible();
    expect(await canvasSize(page)).toEqual(window.canvas);
    expect(await page.locator('canvas').boundingBox()).toEqual({
      x: 0,
      y: 0,
      width: window.width,
      height: window.height,
    });
    expect(game.problems).toEqual([]);
  });
}

test.describe('a phone', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  test('held upright, loads behind the rotate overlay; rotated, shows the game', async ({
    page,
  }) => {
    const game = await openGame(page, 'web');
    // The game loads while the player is asked to rotate the phone.
    await game.loaded();

    await expect(page.locator('.rotate-image-container')).toBeVisible();
    await expect(page.locator('canvas')).toBeHidden();

    await page.setViewportSize({ width: 844, height: 390 });

    await expect(page.locator('.rotate-image-container')).toBeHidden();
    await expect(page.locator('canvas')).toBeVisible();
    // 1080 game pixels high, as wide as the 844×390 screen allows.
    await expect.poll(() => canvasSize(page)).toEqual([2337, 1080]);
    expect(game.problems).toEqual([]);
  });
});
