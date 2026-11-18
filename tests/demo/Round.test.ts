import { beforeEach, describe, expect, it } from 'vitest';
import { Round, type RoundConfig } from '@/demo/Round';

const CONFIG: RoundConfig = {
  durationMs: 10_000,
  spawnDelayMs: [600, 200],
  orbLifeMs: [1500, 500],
};

describe('Round', () => {
  let round: Round;

  beforeEach(() => {
    round = new Round(CONFIG);
  });

  it('starts with the full time and no score', () => {
    expect(round.timeLeftMs).toBe(10_000);
    expect(round.secondsLeft).toBe(10);
    expect(round.score).toBe(0);
    expect(round.isOver).toBe(false);
    expect(round.extended).toBe(false);
  });

  it('counts the time down and stops at zero', () => {
    round.tick(4000);
    expect(round.timeLeftMs).toBe(6000);

    round.tick(7000);
    expect(round.timeLeftMs).toBe(0);
    expect(round.isOver).toBe(true);
  });

  it('shows a started second as a whole one', () => {
    round.tick(1);
    expect(round.secondsLeft).toBe(10);

    round.tick(9998);
    expect(round.secondsLeft).toBe(1);

    round.tick(1);
    expect(round.secondsLeft).toBe(0);
  });

  it('counts points only while the round is on', () => {
    round.addScore();
    round.addScore(3);
    expect(round.score).toBe(4);

    round.tick(10_000);
    round.addScore();
    expect(round.score).toBe(4);
  });

  it('gets harder towards the end', () => {
    expect(round.spawnDelayMs).toBe(600);
    expect(round.orbLifeMs).toBe(1500);

    round.tick(5000);
    expect(round.spawnDelayMs).toBe(400);
    expect(round.orbLifeMs).toBe(1000);

    round.tick(5000);
    expect(round.spawnDelayMs).toBe(200);
    expect(round.orbLifeMs).toBe(500);
  });

  it('extend() brings a finished round back and keeps the score', () => {
    round.addScore(5);
    round.tick(10_000);

    round.extend(3000);

    expect(round.isOver).toBe(false);
    expect(round.timeLeftMs).toBe(3000);
    expect(round.extended).toBe(true);
    expect(round.score).toBe(5);
    // The extra time is played at the final difficulty.
    round.tick(1000);
    expect(round.progress).toBe(1);
    expect(round.spawnDelayMs).toBe(200);
  });

  it('reset() starts a new round', () => {
    round.addScore(5);
    round.tick(10_000);
    round.extend(3000);

    round.reset();

    expect(round.timeLeftMs).toBe(10_000);
    expect(round.score).toBe(0);
    expect(round.extended).toBe(false);
    expect(round.progress).toBe(0);
  });
});
