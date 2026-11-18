import { beforeEach, describe, expect, it, vi } from 'vitest';

const showInterstitial = vi.fn(async () => {});
vi.mock('@/ads/AdMng', () => ({ AdMng: { showInterstitial } }));

describe('roundBreak', () => {
  let roundBreak: () => Promise<void>;
  let skipNextRoundBreak: () => void;

  beforeEach(async () => {
    // The module counts the rounds of a session: every test starts a new session.
    vi.resetModules();
    showInterstitial.mockClear();
    ({ roundBreak, skipNextRoundBreak } = await import('@/demo/roundBreak'));
  });

  it('shows no ad before the first round', async () => {
    await roundBreak();

    expect(showInterstitial).not.toHaveBeenCalled();
  });

  it('shows an ad before every next round', async () => {
    await roundBreak();
    await roundBreak();
    await roundBreak();

    expect(showInterstitial).toHaveBeenCalledTimes(2);
  });

  it('skips one break after a rewarded ad', async () => {
    await roundBreak();
    skipNextRoundBreak();

    await roundBreak();
    expect(showInterstitial).not.toHaveBeenCalled();

    await roundBreak();
    expect(showInterstitial).toHaveBeenCalledTimes(1);
  });

  it('a skip before the first round does not move to the second one', async () => {
    skipNextRoundBreak();
    await roundBreak();

    await roundBreak();

    expect(showInterstitial).toHaveBeenCalledTimes(1);
  });
});
