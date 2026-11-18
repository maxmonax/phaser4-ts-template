import * as Phaser from 'phaser';
import { AdMng } from '@/ads/AdMng';
import { AudioMng } from '@/audio/AudioMng';
import { AudioAlias } from '@/data/AudioData';
import { popBurst } from '@/demo/effects';
import { Hud } from '@/demo/Hud';
import type { Orb } from '@/demo/Orb';
import { OrbField } from '@/demo/OrbField';
import { ResultPopup } from '@/demo/ResultPopup';
import { Round } from '@/demo/Round';
import { roundBreak } from '@/demo/roundBreak';
import { CONTINUE_SECONDS, ROUND_CONFIG } from '@/demo/roundConfig';
import type { MyButton } from '@/gui/basic/MyButton';
import { iconButton } from '@/gui/buttons';
import { PausePopup } from '@/gui/popup/PausePopup';
import { PlatformMng } from '@/platform/PlatformMng';
import { SaveMng } from '@/save/SaveMng';
import { FSM } from '@/utils/states/FSM';
import { BaseScene } from './BaseScene';
import { PopupScene } from './PopupScene';
import { SceneNames } from './SceneNames';
import { TransitionScene } from './TransitionScene';

enum State {
  Play = 'Play',
  Pause = 'Pause',
  Result = 'Result',
}

/** The timer ticks aloud when this many seconds are left. */
const TICK_SECONDS = 3;

/**
 * Demo round: pop the orbs before the time is out. The game itself is in `src/demo`;
 * the scene shows how a round talks to the rest of the template:
 *
 * - the states of the round are an `FSM`: play → pause → play → result;
 * - the pause is a popup over the paused scene (`this.scene.pause()`);
 * - the portal knows when the player is in gameplay (`PlatformMng.gameplayStart/Stop`);
 * - ads at the breaks: an interstitial between rounds, a rewarded ad for extra time;
 * - the best score is saved with `SaveMng`.
 */
export class GameScene extends BaseScene {
  private _fsm!: FSM;
  private _round!: Round;
  private _field!: OrbField;
  private _hud!: Hud;
  private _btnPause!: MyButton;
  private _lastTick = 0;

  constructor() {
    super(SceneNames.GameScene);
  }

  public create(): void {
    this._round = new Round(ROUND_CONFIG);
    this._field = new OrbField(this, this._round, (orb) => this.onOrbPop(orb));
    this.add.existing(this._field);

    this._hud = new Hud(this);
    this.add.existing(this._hud);
    this.anchor(this._hud, { centerX: 0, top: 110 });

    this._btnPause = iconButton(this, 'icons/pause', this.onPauseClick, this);
    this.add.existing(this._btnPause);
    this.anchor(this._btnPause, { left: 110, top: 110 });

    this._fsm = new FSM();
    this._fsm.addState(State.Play, this, this.enterPlay, this.updatePlay, this.exitPlay);
    this._fsm.addState(State.Pause, this, this.enterPause);
    this._fsm.addState(State.Result, this, this.enterResult);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      PlatformMng.gameplayStop();
      this._fsm.free();
    });

    this.startRound();
  }

  update(_time: number, dtMs: number): void {
    this._fsm.update(dtMs);
  }

  private startRound(): void {
    this._round.reset();
    this._lastTick = 0;
    this.refreshHud();
    this._fsm.startState(State.Play);
  }

  private refreshHud(): void {
    this._hud.setTime(this._round.secondsLeft);
    this._hud.setScore(this._round.score);
  }

  // --- Play ----------------------------------------------------------------

  private enterPlay(): void {
    this._btnPause.disabled = false;
    this._field.start();
    PlatformMng.gameplayStart();
  }

  private updatePlay(dtMs: number): void {
    this._round.tick(dtMs);

    const seconds = this._round.secondsLeft;
    this._hud.setTime(seconds);
    if (seconds <= TICK_SECONDS && seconds > 0 && seconds !== this._lastTick) {
      this._lastTick = seconds;
      AudioMng.playSfx(AudioAlias.Tick);
    }

    if (this._round.isOver) this._fsm.startState(State.Result);
  }

  private exitPlay(): void {
    this._btnPause.disabled = true;
    PlatformMng.gameplayStop();
  }

  private onOrbPop(orb: Orb): void {
    this._round.addScore();
    this._hud.setScore(this._round.score);
    popBurst(this, this._field, orb.x, orb.y, orb.color, 1);
    AudioMng.playSfx(AudioAlias.Pop);
  }

  // --- Pause ---------------------------------------------------------------

  private onPauseClick(): void {
    this._fsm.startState(State.Pause);
  }

  private enterPause(): void {
    void this.runPause();
  }

  private async runPause(): Promise<void> {
    // Everything of this scene stops: update(), the timers of the field, the tweens.
    // The popup lives in its own scene and keeps working.
    this.scene.pause();
    const answer = await PopupScene.open(this, PausePopup);
    if (answer === 'menu') {
      // The scene stays frozen under the curtain.
      TransitionScene.change(this, SceneNames.MenuScene);
      return;
    }
    this.scene.resume();
    this._fsm.startState(State.Play);
  }

  // --- Result --------------------------------------------------------------

  private enterResult(): void {
    void this.runResult();
  }

  private async runResult(): Promise<void> {
    this._field.stop();

    const score = this._round.score;
    const isRecord = score > SaveMng.get('best');
    if (isRecord) SaveMng.set('best', score);

    AudioMng.duckMusic({ volume: 0.3, hold: 1200 });
    AudioMng.playSfx(AudioAlias.RoundEnd);

    const answer = await PopupScene.open(this, ResultPopup, {
      score,
      best: SaveMng.get('best'),
      isRecord,
      canContinue: !this._round.extended && AdMng.isAvailable(),
      continueSeconds: CONTINUE_SECONDS,
    });

    if (answer === 'continue') {
      this._round.extend(CONTINUE_SECONDS * 1000);
      this._fsm.startState(State.Play);
    } else if (answer === 'again') {
      await roundBreak();
      this.startRound();
    } else {
      TransitionScene.change(this, SceneNames.MenuScene);
    }
  }
}
