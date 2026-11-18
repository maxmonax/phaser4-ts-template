import { KeyValueSaveStorage } from '../../save/KeyValueSaveStorage';
import { delay } from '../../utils/async';
import { LogMng } from '../../utils/LogMng';
import type { IPlatform } from '../IPlatform';

/** How long a simulated ad "plays" in a dev build. */
const SIMULATED_AD_MS = 1000;

/**
 * No portal: own site, itch.io, local development. Also the fallback
 * when a portal SDK fails to load (then without ads).
 *
 * Language comes from the browser, the state is kept in `localStorage`.
 * In dev builds ads are simulated: a pause and a log message.
 */
export class WebPlatform implements IPlatform {
  readonly id = 'web';
  readonly interstitialCooldownMs = 0;

  constructor(readonly hasAds: boolean = import.meta.env.DEV) {}

  async init(): Promise<void> {}

  getLang(): string | null {
    return null;
  }

  async createStorage(saveKey: string): Promise<KeyValueSaveStorage> {
    return KeyValueSaveStorage.local(saveKey);
  }

  loadingFinished(): void {
    LogMng.debug('platform: loading finished');
  }

  gameplayStart(): void {
    LogMng.debug('platform: gameplay start');
  }

  gameplayStop(): void {
    LogMng.debug('platform: gameplay stop');
  }

  async showInterstitial(): Promise<void> {
    if (!this.hasAds) return;
    LogMng.debug('platform: interstitial (simulated)');
    await delay(SIMULATED_AD_MS);
  }

  async showRewarded(): Promise<boolean> {
    if (!this.hasAds) return false;
    LogMng.debug('platform: rewarded ad (simulated)');
    await delay(SIMULATED_AD_MS);
    return true;
  }
}
