import { describe, expect, it } from 'vitest';
import {
  clear,
  getHistoryDepth,
  HISTORY_LIMIT,
  recordHistoryChange,
  registerHistoryChannel,
  redo,
  undo,
  useHistoryStore,
} from '../../src/store/history';

describe('bounded coalescing history', () => {
  it('coalesces rapid updates with the same key into one undo step', () => {
    clear();
    let restored = 'A';
    registerHistoryChannel('coalesce-test', restored, (value) => {
      restored = value as string;
    });

    recordHistoryChange('coalesce-test', 'A', 'AB', 'title', 1000);
    recordHistoryChange('coalesce-test', 'AB', 'ABC', 'title', 1400);

    expect(getHistoryDepth()).toEqual({ undo: 1, redo: 0 });
    expect(undo()).toBe(true);
    expect(restored).toBe('A');
    expect(redo()).toBe(true);
    expect(restored).toBe('ABC');
  });

  it('starts a new entry after the coalescing window or when the key changes', () => {
    clear();
    registerHistoryChannel('window-test', 0, () => undefined);
    recordHistoryChange('window-test', 0, 1, 'drag', 1000);
    recordHistoryChange('window-test', 1, 2, 'drag', 1800);
    recordHistoryChange('window-test', 2, 3, 'typing', 1850);
    expect(getHistoryDepth().undo).toBe(3);
  });

  it('keeps at most 100 undo steps and clears redo after a new change', () => {
    clear();
    let restored = 0;
    registerHistoryChannel('limit-test', restored, (value) => {
      restored = value as number;
    });
    for (let value = 1; value <= HISTORY_LIMIT + 10; value += 1) {
      recordHistoryChange('limit-test', value - 1, value, undefined, value * 1000);
    }
    expect(getHistoryDepth().undo).toBe(HISTORY_LIMIT);
    for (let index = 0; index < HISTORY_LIMIT; index += 1) undo();
    expect(restored).toBe(10);
    expect(redo()).toBe(true);
    recordHistoryChange('limit-test', restored, 12, undefined, 999999);
    expect(useHistoryStore.getState().canRedo).toBe(false);
  });
});
