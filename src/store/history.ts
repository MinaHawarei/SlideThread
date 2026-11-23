import { create } from 'zustand';

type ChannelRestore = (value: unknown) => void;
type HistorySnapshot = Record<string, unknown>;
interface HistoryEntry {
  before: HistorySnapshot;
  after: HistorySnapshot;
  key?: string;
  timestamp: number;
}
interface HistoryChannel {
  value: unknown;
  restore: ChannelRestore;
}

export const HISTORY_LIMIT = 100;
export const HISTORY_COALESCE_WINDOW_MS = 750;

export interface HistoryState {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => boolean;
  redo: () => boolean;
  clear: () => void;
}

const channels = new Map<string, HistoryChannel>();
let past: HistoryEntry[] = [];
let future: HistoryEntry[] = [];
let lastKey: string | undefined;
let lastTimestamp = 0;

export const useHistoryStore = create<HistoryState>(() => ({
  canUndo: false,
  canRedo: false,
  undo,
  redo,
  clear,
}));

function snapshot(): HistorySnapshot {
  return Object.fromEntries([...channels].map(([key, channel]) => [key, channel.value]));
}

function publish(): void {
  useHistoryStore.setState({ canUndo: past.length > 0, canRedo: future.length > 0 });
}

function applySnapshot(value: HistorySnapshot): void {
  for (const [key, channel] of channels) {
    if (!Object.hasOwn(value, key)) continue;
    channel.value = value[key];
    channel.restore(value[key]);
  }
}

export function registerHistoryChannel(
  key: string,
  initialValue: unknown,
  restore: ChannelRestore
): void {
  channels.set(key, { value: initialValue, restore });
}

/** Record an immutable state change. Repeated changes with the same key coalesce within 750 ms. */
export function recordHistoryChange(
  channelKey: string,
  beforeValue: unknown,
  afterValue: unknown,
  coalesceKey?: string,
  timestamp = Date.now()
): void {
  const channel = channels.get(channelKey);
  if (!channel || beforeValue === afterValue) return;

  const before = snapshot();
  before[channelKey] = beforeValue;
  channel.value = afterValue;
  const after = snapshot();
  const canCoalesce =
    coalesceKey !== undefined &&
    coalesceKey === lastKey &&
    timestamp - lastTimestamp <= HISTORY_COALESCE_WINDOW_MS &&
    past.length > 0;

  if (canCoalesce) {
    const previous = past[past.length - 1]!;
    past[past.length - 1] = { ...previous, after, timestamp };
  } else {
    past.push({ before, after, key: coalesceKey, timestamp });
    if (past.length > HISTORY_LIMIT) past = past.slice(-HISTORY_LIMIT);
  }
  future = [];
  lastKey = coalesceKey;
  lastTimestamp = timestamp;
  publish();
}

export function undo(): boolean {
  const entry = past.pop();
  if (!entry) return false;
  future.push(entry);
  applySnapshot(entry.before);
  lastKey = undefined;
  publish();
  return true;
}

export function redo(): boolean {
  const entry = future.pop();
  if (!entry) return false;
  past.push(entry);
  applySnapshot(entry.after);
  lastKey = undefined;
  publish();
  return true;
}

export function clear(): void {
  past = [];
  future = [];
  lastKey = undefined;
  lastTimestamp = 0;
  publish();
}

export function getHistoryDepth(): { undo: number; redo: number } {
  return { undo: past.length, redo: future.length };
}
