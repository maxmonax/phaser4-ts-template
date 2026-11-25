import { vi } from 'vitest';
import type { IPlatform, LevelAction, PlatformHost } from '@/platform/IPlatform';
import type { ISaveStorage } from '@/save/ISaveStorage';

/**
 * Test double of a platform adapter: every method is a spy. By default an ad starts at once
 * and ends on the next microtask.
 */
export class FakePlatform implements IPlatform {
  readonly id = 'web';
  hasAds = true;
  interstitialIntervalMs?: number = 0;
  pauseStopsGameplay?: boolean;
  host: PlatformHost | null = null;

  init = vi.fn(async (host: PlatformHost) => {
    this.host = host;
  });
  getLangs = vi.fn((): readonly string[] => ['ru']);
  getMaxAspect = vi.fn((): number | null => null);
  createStorage = vi.fn(async (): Promise<ISaveStorage> => ({
    load: async () => null,
    save: async () => {},
  }));
  loadingFinished = vi.fn();
  gameplayStart = vi.fn();
  gameplayStop = vi.fn();
  levelEvent = vi.fn((_level: string, _action: LevelAction) => {});
  showInterstitial = vi.fn(async (started: () => void) => {
    started();
  });
  showRewarded = vi.fn(async (started: () => void) => {
    started();
    return true;
  });
}

export const noMute = (): void => {};
