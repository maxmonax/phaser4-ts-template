import * as Phaser from 'phaser';
import { Config } from '@/data/Config';
import { EventBus } from '@/events/EventBus';
import { FrontEvent } from '@/events/FrontEvent';
import { Curtain } from '@/gui/Curtain';
import { Theme } from '@/gui/Theme';
import { Viewport } from '@/scaling/Viewport';
import { SceneNames } from './SceneNames';

export type TransitionOptions = {
  duration?: number;
  color?: number;
  alpha?: number;
  ease?: string | ((v: number) => number);
  stopCurrent?: boolean;
  targetData?: object;
};

type TransitionData = TransitionOptions & {
  fromSceneKey?: string;
  targetSceneKey: string;
};

export class TransitionScene extends Phaser.Scene {
  private static readonly DEFAULT_DURATION = 300;
  private static readonly DEFAULT_COLOR = Theme.color.dark;
  private static readonly DEFAULT_ALPHA = 1;

  private static _isTransitioning = false;

  private _curtain!: Curtain;

  constructor() {
    super(SceneNames.TransitionScene);
  }

  static change(
    scene: Phaser.Scene,
    targetSceneKey: string,
    options: TransitionOptions = {}
  ): void {
    if (TransitionScene._isTransitioning) return;
    TransitionScene._isTransitioning = true;

    scene.scene.launch(SceneNames.TransitionScene, {
      ...options,
      fromSceneKey: scene.scene.key,
      targetSceneKey,
    } satisfies TransitionData);
    scene.scene.bringToTop(SceneNames.TransitionScene);
  }

  public create(data: TransitionData): void {
    // Whatever interrupts the transition, the next one must not stay blocked.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      TransitionScene._isTransitioning = false;
    });

    const duration = data.duration ?? TransitionScene.DEFAULT_DURATION;
    const alpha = data.alpha ?? TransitionScene.DEFAULT_ALPHA;

    // The whole screen, which can be larger than the full area; it is centered on the full area.
    this._curtain = new Curtain({
      scene: this,
      x: Config.GW_HALF,
      y: Config.GH_HALF,
      w: Viewport.screen.width,
      h: Viewport.screen.height,
      color: data.color ?? TransitionScene.DEFAULT_COLOR,
    });
    this.add.existing(this._curtain);
    const fitCurtain = () => this._curtain.resize(Viewport.screen.width, Viewport.screen.height);
    EventBus.on(FrontEvent.WINDOW_RESIZE, fitCurtain);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EventBus.off(FrontEvent.WINDOW_RESIZE, fitCurtain);
    });

    this._curtain.showCurtain({
      alpha,
      dur: duration,
      ease: data.ease,
      cb: () => {
        this.startTargetScene(data);
        this.hideCurtain(data);
      },
    });
  }

  private startTargetScene(data: TransitionData): void {
    if (data.stopCurrent ?? true) {
      if (data.fromSceneKey && data.fromSceneKey !== data.targetSceneKey) {
        this.scene.stop(data.fromSceneKey);
      }
    }

    this.scene.launch(data.targetSceneKey, data.targetData);
    this.scene.bringToTop(SceneNames.TransitionScene);
  }

  private hideCurtain(data: TransitionData): void {
    this._curtain.hideCurtain(
      data.duration ?? TransitionScene.DEFAULT_DURATION,
      () => {
        TransitionScene._isTransitioning = false;
        this.scene.stop();
      },
      undefined,
      data.ease
    );
  }
}
