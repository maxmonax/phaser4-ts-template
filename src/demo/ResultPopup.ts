import * as Phaser from 'phaser';
import { AdMng } from '@/ads/AdMng';
import type { MyTextButton } from '@/gui/basic/MyTextButton';
import { textButton } from '@/gui/buttons';
import { Popup } from '@/gui/popup/Popup';
import { cssColor, Theme } from '@/gui/Theme';
import { t } from '@/locale/LocaleMng';
import { skipNextRoundBreak } from './roundBreak';

export type ResultData = {
  score: number;
  best: number;
  isRecord: boolean;
  /** Offer extra time for a rewarded ad. */
  canContinue: boolean;
  continueSeconds: number;
};

/** `continue`: the player watched a rewarded ad, the round goes on. */
export type ResultAnswer = 'continue' | 'again' | 'menu';

const BUTTON_WIDTH = 560;
const BUTTON_STEP = 150;

/** The end of a demo round: the score, the record and what to do next. */
export class ResultPopup extends Popup<ResultAnswer> {
  protected _className = 'ResultPopup';
  private _score: Phaser.GameObjects.Text;
  private _record: Phaser.GameObjects.Text;
  private _btnContinue?: MyTextButton;
  private _btnAgain: MyTextButton;
  private _btnMenu: MyTextButton;

  constructor(
    scene: Phaser.Scene,
    private readonly info: ResultData
  ) {
    super(scene, 860, info.canContinue ? 940 : 790);
    const top = -this.panelHeight / 2;

    this._score = new Phaser.GameObjects.Text(scene, 0, top + 245, '', {
      ...Theme.text.title,
      color: cssColor(Theme.color.accent),
    }).setOrigin(0.5);
    this._record = new Phaser.GameObjects.Text(scene, 0, top + 350, '', Theme.text.body);
    this._record.setOrigin(0.5);
    if (info.isRecord) this._record.setColor(cssColor(Theme.skin.reward.fill));
    this.content.add([this._score, this._record]);

    let y = top + 490;
    if (info.canContinue) {
      this._btnContinue = textButton(scene, '', this.onContinueClick, this, {
        width: BUTTON_WIDTH,
        skin: Theme.skin.reward,
        icon: 'icons/video',
      });
      this.content.add(this._btnContinue.setPosition(0, y));
      y += BUTTON_STEP;
    }
    this._btnAgain = textButton(scene, '', () => this.close('again'), this, {
      width: BUTTON_WIDTH,
      skin: Theme.skin.primary,
      icon: 'icons/restart',
    });
    this._btnMenu = textButton(scene, '', () => this.close('menu'), this, {
      width: BUTTON_WIDTH,
      icon: 'icons/home',
    });
    this.content.add([
      this._btnAgain.setPosition(0, y),
      this._btnMenu.setPosition(0, y + BUTTON_STEP),
    ]);

    this.updateTexts();
  }

  protected updateTexts(): void {
    const { score, best, isRecord, continueSeconds } = this.info;
    this.setTitle(t('demo_result_title'));
    this._score.setText(t('demo_result_score', { count: score }));
    this._record.setText(isRecord ? t('demo_result_record') : t('demo_best', { count: best }));
    this._btnContinue?.setText(t('demo_btn_continue', { seconds: continueSeconds }));
    this._btnAgain.setText(t('demo_btn_again'));
    this._btnMenu.setText(t('btn_menu'));
  }

  private async onContinueClick(): Promise<void> {
    if (!this._btnContinue) return;
    this._btnContinue.disabled = true;
    if (await AdMng.showRewarded()) {
      skipNextRoundBreak();
      this.close('continue');
    } else {
      this._btnContinue.disabled = false;
    }
  }
}
