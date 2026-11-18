import * as Phaser from 'phaser';
import { EventBus } from '../events/EventBus';
import { FrontEvent } from '../events/FrontEvent';
import { Lang, LocaleKey } from '../locale/LocaleKeys';
import { LocaleMng, t } from '../locale/LocaleMng';
import type { CenterCameraPlugin } from '../scaling/CenterCameraPlugin';
import { Viewport, type Anchor } from '../scaling/Viewport';
import { tweenAsync, wait } from '../utils/sceneAsync';

type LangCallback = (lang: Lang) => void;
type Point = { x: number; y: number };

/**
 * Base class for game scenes: window resize and language change subscriptions
 * and anchors to the edges of the visible area. All of them are removed
 * automatically when the scene shuts down.
 */
export abstract class BaseScene extends Phaser.Scene {
  /** Keeps the camera on the middle of the full area, see `CenterCameraPlugin`. */
  declare readonly centerCamera: CenterCameraPlugin;

  private _resizeCbs: Array<() => void> = [];
  /** Original callbacks mapped to the bound ones that are registered in LocaleMng. */
  private _langCbs = new Map<LangCallback, LangCallback>();
  private _anchors = new Map<Point, Anchor>();
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

  /**
   * Keeps `obj` at a fixed distance from the edges of the visible area:
   * the position is set now and again on every window resize.
   *
   * ```ts
   * this.anchor(this._btnBack, { left: 90, top: 80 });
   * ```
   * @returns `obj`
   */
  protected anchor<T extends Point>(obj: T, anchor: Anchor): T {
    this._anchors.set(obj, anchor);
    Viewport.place(obj, anchor);
    this.registerResize(this.applyAnchors);
    return obj;
  }

  /** Stops moving `obj` on resize. Call it for an object destroyed before the scene ends. */
  protected unanchor(obj: Point): void {
    this._anchors.delete(obj);
  }

  private applyAnchors(): void {
    for (const [obj, anchor] of this._anchors) Viewport.place(obj, anchor);
  }

  /** `await this.wait(500)`: scene time, see `wait()` in `utils/sceneAsync`. */
  protected wait(ms: number): Promise<void> {
    return wait(this, ms);
  }

  /** `await this.tween({ targets, alpha: 0, duration: 200 })`, see `tweenAsync()`. */
  protected tween(config: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> {
    return tweenAsync(this, config);
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
      this._anchors.clear();
    });
  }
}
