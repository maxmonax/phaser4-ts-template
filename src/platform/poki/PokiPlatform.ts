import type { ISaveStorage } from '../../save/ISaveStorage';
import { KeyValueSaveStorage } from '../../save/KeyValueSaveStorage';
import type { IPlatform } from '../IPlatform';
import type { PokiSDKApi } from './poki-sdk';

/**
 * Poki: https://developers.poki.com/guide/sdk-html5
 *
 * - Poki decides itself whether a commercial break shows an ad.
 * - A commercial break is expected before every `gameplayStart()` except the first
 *   (the demo shows an interstitial before every round but the first one).
 * - The game is paused before the ad is requested: the SDK callback for the start
 *   of an ad is not guaranteed to be called.
 * - Saves stay in `localStorage`: for logged-in players Poki syncs it to the cloud
 *   on its own (keys starting with `poki_ignore` are skipped).
 */
export class PokiPlatform implements IPlatform {
  readonly id = 'poki';
  readonly hasAds = true;
  readonly interstitialCooldownMs = 0;

  private sdk: PokiSDKApi | null = null;

  async init(): Promise<void> {
    const sdk = globalThis.PokiSDK;
    if (!sdk) throw new Error('Poki SDK is not loaded');
    await sdk.init();
    this.sdk = sdk;
  }

  getLang(): string | null {
    return this.getSdk().getLanguage() || null;
  }

  async createStorage(saveKey: string): Promise<ISaveStorage> {
    return KeyValueSaveStorage.local(saveKey);
  }

  loadingFinished(): void {
    this.getSdk().gameLoadingFinished();
  }

  gameplayStart(): void {
    this.getSdk().gameplayStart();
  }

  gameplayStop(): void {
    this.getSdk().gameplayStop();
  }

  showInterstitial(): Promise<void> {
    return this.getSdk().commercialBreak();
  }

  showRewarded(): Promise<boolean> {
    return this.getSdk().rewardedBreak();
  }

  private getSdk(): PokiSDKApi {
    if (!this.sdk) throw new Error('PokiPlatform: init() has not completed');
    return this.sdk;
  }
}
