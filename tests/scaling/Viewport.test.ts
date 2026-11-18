import { afterEach, describe, expect, it } from 'vitest';
import { Config } from '@/data/Config';
import { Params } from '@/data/Params';
import { Viewport } from '@/scaling/Viewport';

describe('Viewport', () => {
  afterEach(() => {
    Params.gameWidth = 0;
  });

  it('is the whole game area until the window size is known', () => {
    expect(Viewport.width).toBe(Config.GW);
    expect(Viewport.left).toBe(0);
    expect(Viewport.right).toBe(Config.GW);
  });

  it('is centered in the game area', () => {
    Params.gameWidth = 1920;

    expect(Viewport.width).toBe(1920);
    expect(Viewport.left).toBe((Config.GW - 1920) / 2);
    expect(Viewport.right).toBe((Config.GW + 1920) / 2);
    expect(Viewport.centerX).toBe(Config.GW_HALF);
  });

  it('always has the full height', () => {
    Params.gameWidth = Config.GW_SAFE;

    expect(Viewport.top).toBe(0);
    expect(Viewport.bottom).toBe(Config.GH);
    expect(Viewport.height).toBe(Config.GH);
    expect(Viewport.centerY).toBe(Config.GH_HALF);
  });

  describe('place', () => {
    it('anchors to the left and top edges', () => {
      Params.gameWidth = 1920;
      const obj = { x: 0, y: 0 };

      Viewport.place(obj, { left: 90, top: 80 });

      expect(obj).toEqual({ x: Viewport.left + 90, y: 80 });
    });

    it('anchors to the right and bottom edges', () => {
      Params.gameWidth = 1920;
      const obj = { x: 0, y: 0 };

      Viewport.place(obj, { right: 90, bottom: 80 });

      expect(obj).toEqual({ x: Viewport.right - 90, y: Config.GH - 80 });
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

    it('follows the window size', () => {
      const obj = { x: 0, y: 0 };

      Params.gameWidth = Config.GW;
      Viewport.place(obj, { left: 90 });
      expect(obj.x).toBe(90);

      Params.gameWidth = Config.GW_SAFE;
      Viewport.place(obj, { left: 90 });
      expect(obj.x).toBe((Config.GW - Config.GW_SAFE) / 2 + 90);
    });
  });
});
