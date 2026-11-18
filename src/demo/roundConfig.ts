import type { RoundConfig } from './Round';

export const ROUND_SECONDS = 20;
/** Extra time for a rewarded ad, once per round. */
export const CONTINUE_SECONDS = 10;

export const ROUND_CONFIG: RoundConfig = {
  durationMs: ROUND_SECONDS * 1000,
  spawnDelayMs: [560, 300],
  orbLifeMs: [1500, 950],
};
