import { AdMng } from '@/ads/AdMng';

let roundsStarted = 0;
let skipNext = false;

/**
 * The ad break between rounds. Call it before every round starts: it shows
 * an interstitial before every round except the first one of the session.
 * That is what Poki asks for, and a natural break on the other portals.
 */
export async function roundBreak(): Promise<void> {
  const isFirst = roundsStarted++ === 0;
  const skip = skipNext;
  skipNext = false;
  if (isFirst || skip) return;
  await AdMng.showInterstitial();
}

/**
 * The player has just watched a rewarded ad: the next break goes without
 * an interstitial (CrazyGames: between two rounds show one of them, not both).
 */
export function skipNextRoundBreak(): void {
  skipNext = true;
}
