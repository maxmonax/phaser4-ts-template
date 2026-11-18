import { afterEach, describe, expect, it } from 'vitest';
import { Config } from '@/data/Config';
import { Viewport } from '@/scaling/Viewport';

// The template's areas: the full area 2400×1080, the safe area 1440×1080.
describe('Viewport', () => {
  afterEach(() => {
    Viewport.setScreenSize(Config.GW, Config.GH);
  });

  it('is the whole full area until the game reports its size', () => {
    expect(Viewport.screen).toEqual({ x: 0, y: 0, width: Config.GW, height: Config.GH });
    expect([Viewport.left, Viewport.right, Viewport.top, Viewport.bottom]).toEqual([
      0,
      Config.GW,
      0,
      Config.GH,
    ]);
  });

  it('16:9: the screen is centered in the full area', () => {
    Viewport.setScreenSize(1920, 1080);

    expect(Viewport.screen).toEqual({ x: 240, y: 0, width: 1920, height: 1080 });
    expect(Viewport.left).toBe(240);
    expect(Viewport.right).toBe(2160);
    expect(Viewport.width).toBe(1920);
    expect(Viewport.centerX).toBe(Config.GW_HALF);
  });

  it('4:3: only the safe area is on screen', () => {
    Viewport.setScreenSize(Config.GW_SAFE, Config.GH_SAFE);

    expect(Viewport.left).toBe((Config.GW - Config.GW_SAFE) / 2);
    expect(Viewport.width).toBe(Config.GW_SAFE);
    expect(Viewport.height).toBe(Config.GH_SAFE);
  });

  it('a screen wider than the full area: the layout stays within the full area', () => {
    Viewport.setScreenSize(2600, 1080);

    expect(Viewport.screen).toEqual({ x: -100, y: 0, width: 2600, height: 1080 });
    expect(Viewport.left).toBe(0);
    expect(Viewport.right).toBe(Config.GW);
  });

  it('a screen taller than the full area: the layout stays within the full area', () => {
    // A square window: the safe area 1440×1080 fits by width, the canvas grows down and up.
    Viewport.setScreenSize(1440, 1440);

    expect(Viewport.screen).toEqual({ x: 480, y: -180, width: 1440, height: 1440 });
    expect(Viewport.top).toBe(0);
    expect(Viewport.bottom).toBe(Config.GH);
    expect(Viewport.height).toBe(Config.GH);
  });

  it('knows the orientation of the screen', () => {
    Viewport.setScreenSize(1920, 1080);
    expect(Viewport.isPortrait).toBe(false);

    Viewport.setScreenSize(1440, 3120);
    expect(Viewport.isPortrait).toBe(true);
  });

  describe('place', () => {
    it('anchors to the left and top edges', () => {
      Viewport.setScreenSize(1920, 1080);
      const obj = { x: 0, y: 0 };

      Viewport.place(obj, { left: 90, top: 80 });

      expect(obj).toEqual({ x: 240 + 90, y: 80 });
    });

    it('anchors to the right and bottom edges', () => {
      Viewport.setScreenSize(1920, 1080);
      const obj = { x: 0, y: 0 };

      Viewport.place(obj, { right: 90, bottom: 80 });

      expect(obj).toEqual({ x: 2160 - 90, y: Config.GH - 80 });
    });

    it('anchors to the center with an offset', () => {
      const obj = { x: 0, y: 0 };

      Viewport.place(obj, { centerX: -200, centerY: 50 });

      expect(obj).toEqual({ x: Config.GW_HALF - 200, y: Config.GH_HALF + 50 });
    });

    it('leaves an axis without an anchor as is', () => {
      const obj = { x: 5, y: 7 };

      Viewport.place(obj, { top: 100 });

      expect(obj).toEqual({ x: 5, y: 100 });
    });

    it('follows the screen size', () => {
      const obj = { x: 0, y: 0 };

      Viewport.setScreenSize(Config.GW, Config.GH);
      Viewport.place(obj, { left: 90 });
      expect(obj.x).toBe(90);

      Viewport.setScreenSize(Config.GW_SAFE, Config.GH_SAFE);
      Viewport.place(obj, { left: 90 });
      expect(obj.x).toBe((Config.GW - Config.GW_SAFE) / 2 + 90);
    });
  });
});
