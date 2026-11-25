import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ScoreSync } from '@/platform/ScoreSync';

function fakeBoard(onPlatform: number | null) {
  return {
    read: vi.fn(async () => onPlatform),
    write: vi.fn(async (_score: number) => true),
  };
}

describe('ScoreSync', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('writes a result higher than the one on the platform', async () => {
    const board = fakeBoard(3);

    await new ScoreSync(board).report(5);

    expect(board.write.mock.calls).toEqual([[5]]);
  });

  it('never lowers the result on the platform', async () => {
    const board = fakeBoard(9);
    const sync = new ScoreSync(board);

    await sync.report(5);

    expect(board.write).not.toHaveBeenCalled();
  });

  it('reads the platform once and writes only new records', async () => {
    const board = fakeBoard(0);
    const sync = new ScoreSync(board, 0);

    await sync.report(5);
    await sync.report(5);
    await sync.report(4);
    await sync.report(7);

    expect(board.read).toHaveBeenCalledTimes(1);
    expect(board.write.mock.calls).toEqual([[5], [7]]);
  });

  it('ignores scores that are not positive whole numbers', async () => {
    const board = fakeBoard(0);

    await new ScoreSync(board).report(-1);
    await new ScoreSync(board).report(2.5);

    expect(board.read).not.toHaveBeenCalled();
  });

  it('writes nothing for a guest, and tries again with the next report', async () => {
    const board = fakeBoard(null);
    const sync = new ScoreSync(board);

    await sync.report(5);
    expect(board.write).not.toHaveBeenCalled();

    board.read.mockResolvedValue(0);
    await sync.report(2);
    expect(board.write.mock.calls).toEqual([[5]]);
  });

  it('keeps writes apart and sends only the last of the results that came meanwhile', async () => {
    const board = fakeBoard(0);
    const sync = new ScoreSync(board, 1000);

    await sync.report(1);
    const pending = sync.report(2);
    void sync.report(3);
    await vi.advanceTimersByTimeAsync(999);
    expect(board.write.mock.calls).toEqual([[1]]);

    await vi.advanceTimersByTimeAsync(1);
    await pending;
    expect(board.write.mock.calls).toEqual([[1], [3]]);
  });

  it('keeps a failure to itself and tries again next time', async () => {
    const board = fakeBoard(0);
    board.write.mockRejectedValueOnce(new Error('no such leaderboard'));
    const sync = new ScoreSync(board, 0);

    await expect(sync.report(5)).resolves.toBeUndefined();
    await sync.report(5);

    expect(board.write.mock.calls).toEqual([[5], [5]]);
  });
});
