import { vi } from 'vitest';
import type { IPlatform, PlatformHost } from '@/platform/IPlatform';
import type { ISaveStorage } from '@/save/ISaveStorage';

/** Test double of a platform adapter: every method is a spy. */
export class FakePlatform implements IPlatform {
  readonly id = 'web';
  hasAds = true;
  interstitialCooldownMs = 0;
  host: PlatformHost | null = null;

  init = vi.fn(async (host: PlatformHost) => {
    this.host = host;
  });
  getLang = vi.fn((): string | null => 'ru');
  createStorage = vi.fn(async (): Promise<ISaveStorage> => ({
    load: async () => null,
    save: async () => {},
  }));
  loadingFinished = vi.fn();
  gameplayStart = vi.fn();
  gameplayStop = vi.fn();
  showInterstitial = vi.fn(async () => {});
  showRewarded = vi.fn(async () => true);
}

export const noopHost: PlatformHost = { setPaused: () => {}, setMuted: () => {} };
