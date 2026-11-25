import type { ISaveStorage } from '../../save/ISaveStorage';
import { KeyValueSaveStorage } from '../../save/KeyValueSaveStorage';
import { LogMng } from '../../utils/LogMng';
import type { IPlatform, LevelAction } from '../IPlatform';
import type { PokiSDKApi } from './poki-sdk';

/**
 * Poki: https://developers.poki.com/guide/sdk-html5
 *
 * - Poki decides itself whether a commercial break shows an ad, so the game keeps no interval
 *   of its own and signals every natural break.
 * - A commercial break is expected before every `gameplayStart()` except the first
 *   (the demo shows an interstitial before every round but the first one).
 * - The sound is off from the request on: the SDK callback for the start of an ad is not
 *   always called, and Poki wants audio and input off for the whole break.
 * - `PokiSDK.init()` rejects with an ad blocker on. The game goes on with the SDK, which
 *   still takes the events, but without ads.
 * - Level attempts go to Poki statistics: `measure('level', level, action)`.
 * - Saves stay in `localStorage`: for logged-in players Poki syncs it to the cloud
 *   on its own (keys starting with `poki_ignore` are skipped).
 */
export class PokiPlatform implements IPlatform {
  readonly id = 'poki';
  readonly interstitialIntervalMs = 0;

  private sdk: PokiSDKApi | null = null;
  private adsBlocked = false;

  get hasAds(): boolean {
    return !this.adsBlocked;
  }

  async init(): Promise<void> {
    const sdk = globalThis.PokiSDK;
    if (!sdk) throw new Error('Poki SDK is not loaded');
    try {
      await sdk.init();
    } catch (e) {
      LogMng.warn('Poki: the SDK init failed (an ad blocker?), the game goes on without ads', e);
      this.adsBlocked = true;
    }
    this.sdk = sdk;
  }

  getLangs(): readonly string[] {
    const lang = this.getSdk().getLanguage();
    return lang ? [lang] : [];
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

  levelEvent(level: string, action: LevelAction): void {
    this.getSdk().measure('level', level, action);
  }

  showInterstitial(started: () => void): Promise<void> {
    const sdk = this.getSdk();
    started();
    return sdk.commercialBreak();
  }

  showRewarded(started: () => void): Promise<boolean> {
    const sdk = this.getSdk();
    started();
    return sdk.rewardedBreak();
  }

  private getSdk(): PokiSDKApi {
    if (!this.sdk) throw new Error('PokiPlatform: init() has not completed');
    return this.sdk;
  }
}
