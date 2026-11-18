import * as Phaser from 'phaser';
import { Config } from '@/data/Config';
import { MyContainer } from '@/gui/basic/MyContainer';
import { Theme } from '@/gui/Theme';
import { MyMath } from '@/utils/MyMath';
import { MyUtils } from '@/utils/MyUtils';
import { Orb, ORB_SIZE, OrbEvent } from './Orb';
import type { Round } from './Round';

/** Orbs appear inside the safe zone, so they are reachable at any window width. */
const AREA = new Phaser.Geom.Rectangle(
  Config.GW_HALF - Config.GW_SAFE / 2 + 130,
  270,
  Config.GW_SAFE - 260,
  Config.GH - 270 - 130
);
const MIN_DISTANCE = ORB_SIZE * 1.15;
const PLACE_ATTEMPTS = 12;

/**
 * The play field of the demo round: spawns orbs while it is running.
 * It works on the scene clock: pausing the scene pauses the field.
 */
export class OrbField extends MyContainer {
  protected _className = 'OrbField';
  private _orbs = new Set<Orb>();
  private _spawnTimer?: Phaser.Time.TimerEvent;

  constructor(
    scene: Phaser.Scene,
    private readonly round: Round,
    private readonly onPop: (orb: Orb) => void
  ) {
    super(scene, 0, 0);
  }

  get isRunning(): boolean {
    return this._spawnTimer !== undefined;
  }

  /** Starts spawning orbs. Does nothing if the field is already running. */
  start(): void {
    if (this.isRunning) return;
    this.scheduleSpawn(300);
  }

  /** Stops spawning and removes the orbs that are on screen. */
  stop(): void {
    this._spawnTimer?.remove();
    this._spawnTimer = undefined;
    for (const orb of [...this._orbs]) orb.vanish();
  }

  private scheduleSpawn(delayMs: number): void {
    this._spawnTimer = this.scene.time.delayedCall(delayMs, () => {
      this.spawn();
      this.scheduleSpawn(this.round.spawnDelayMs);
    });
  }

  private spawn(): void {
    const pos = this.findPlace();
    if (!pos) return;

    const color = MyUtils.getRandomValueFromArray([...Theme.color.palette]);
    const orb = new Orb(this.scene, pos.x, pos.y, color, this.round.orbLifeMs);
    orb.once(OrbEvent.Pop, this.onPop);
    orb.once(OrbEvent.Gone, () => this._orbs.delete(orb));
    this._orbs.add(orb);
    this.add(orb);
  }

  /** A random point that is not too close to the orbs on screen. */
  private findPlace(): { x: number; y: number } | null {
    for (let i = 0; i < PLACE_ATTEMPTS; i++) {
      const x = MyMath.randomInRange(AREA.left, AREA.right);
      const y = MyMath.randomInRange(AREA.top, AREA.bottom);
      const isFree = [...this._orbs].every(
        (orb) => MyMath.getVec2Length(x, y, orb.x, orb.y) >= MIN_DISTANCE
      );
      if (isFree) return { x, y };
    }
    return null;
  }
}
