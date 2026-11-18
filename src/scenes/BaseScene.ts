import * as Phaser from 'phaser';
import { EventBus } from '../events/EventBus';
import { FrontEvent } from '../events/FrontEvent';
import { Lang, LocaleKey } from '../locale/LocaleKeys';
import { LocaleMng, t } from '../locale/LocaleMng';

type LangCallback = (lang: Lang) => void;

/**
 * Base class for game scenes: window resize and language change subscriptions
 * that are removed automatically when the scene shuts down.
 */
export abstract class BaseScene extends Phaser.Scene {
  private _resizeCbs: Array<() => void> = [];
  /** Original callbacks mapped to the bound ones that are registered in LocaleMng. */
  private _langCbs = new Map<LangCallback, LangCallback>();
  private _cleanupBound = false;

  /** Calls `cb` (bound to the scene) on every window resize. Can be called several times. */
  protected registerResize(cb: () => void): void {
    if (this._resizeCbs.includes(cb)) return;
    this._resizeCbs.push(cb);
    EventBus.on(FrontEvent.WINDOW_RESIZE, cb, this);
    this.bindCleanup();
  }

  /** Removes one resize callback, or all of them when called without arguments. */
  protected unregisterResize(cb?: () => void): void {
    const cbs = cb ? this._resizeCbs.filter((item) => item === cb) : this._resizeCbs;
    for (const item of cbs) EventBus.off(FrontEvent.WINDOW_RESIZE, item, this);
    this._resizeCbs = this._resizeCbs.filter((item) => !cbs.includes(item));
  }

  /** Calls `cb` (bound to the scene) on every language change. Can be called several times. */
  protected registerLangChange(cb: LangCallback): void {
    if (this._langCbs.has(cb)) return;
    const bound = cb.bind(this);
    this._langCbs.set(cb, bound);
    LocaleMng.getInstance().onLangChange(bound);
    this.bindCleanup();
  }

  /** Removes one language callback, or all of them when called without arguments. */
  protected unregisterLangChange(cb?: LangCallback): void {
    const cbs = cb ? [cb] : Array.from(this._langCbs.keys());
    for (const item of cbs) {
      const bound = this._langCbs.get(item);
      if (!bound) continue;
      LocaleMng.getInstance().offLangChange(bound);
      this._langCbs.delete(item);
    }
  }

  /** Shorthand for `t()` available in any scene without extra import. */
  protected t(key: LocaleKey, params?: Record<string, string | number>): string {
    return t(key, params);
  }

  // A scene object is reused when the scene is started again,
  // so the subscriptions are removed on every shutdown.
  private bindCleanup(): void {
    if (this._cleanupBound) return;
    this._cleanupBound = true;
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this._cleanupBound = false;
      this.unregisterResize();
      this.unregisterLangChange();
    });
  }
}
