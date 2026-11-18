import * as Phaser from 'phaser';
import { Config } from '@/data/Config';
import { t } from '@/locale/LocaleMng';
import { MyContainer } from './basic/MyContainer';

const STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: Config.FONT.MAIN,
  color: '#dddddd',
  align: 'center',
};

/**
 * "Ad in 3… 2… 1…" countdown before an interstitial. Optional: use it where the
 * game decides when an ad is shown (a platform with `interstitialCooldownMs > 0`).
 * On platforms that pace ads themselves the ad may not follow the countdown.
 *
 * ```ts
 * if (AdMng.canShowInterstitial()) {
 *   await this.adShower.countdown(3);
 *   await AdMng.showInterstitial();
 * }
 * ```
 */
export class AdShower extends MyContainer {
  protected _className = 'AdShower';
  private _title: Phaser.GameObjects.Text;
  private _counter: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x = Config.GW_HALF, y = Config.GH_HALF) {
    super(scene, x, y);

    this._title = new Phaser.GameObjects.Text(scene, 0, -70, '', { ...STYLE, fontSize: '70px' });
    this._title.setOrigin(0.5);
    this.add(this._title);

    this._counter = new Phaser.GameObjects.Text(scene, 0, 60, '', { ...STYLE, fontSize: '120px' });
    this._counter.setOrigin(0.5);
    this.add(this._counter);

    this.visible = false;
  }

  /**
   * Shows the countdown and resolves when it reaches zero. Runs on the scene clock:
   * it stops while the scene or the game is paused, and never resolves if the scene
   * shuts down before the end.
   */
  countdown(seconds = 3): Promise<void> {
    return new Promise((resolve) => {
      let left = Math.max(1, Math.round(seconds));
      this._title.setText(t('ad_soon'));
      this._counter.setText(String(left));
      this.visible = true;

      this.scene.time.addEvent({
        delay: 1000,
        repeat: left - 1,
        callback: () => {
          left--;
          if (left > 0) {
            this._counter.setText(String(left));
            return;
          }
          this.visible = false;
          resolve();
        },
      });
    });
  }
}
