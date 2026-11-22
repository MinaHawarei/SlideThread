import type { StateStorage } from 'zustand/middleware';
import { clearAllAssets } from './assetStore';

export const STORAGE_KEYS = {
  SETTINGS: 'app:settings:v1',
  PROJECTS: 'app:projects:v1',
  CURRENT_PROJECT: 'app:current-project:v1',
} as const;

export interface StorageQuotaState {
  isExceeded: boolean;
  message: string | null;
}

let quotaState: StorageQuotaState = {
  isExceeded: false,
  message: null,
};

type QuotaListener = (state: StorageQuotaState) => void;
const quotaListeners = new Set<QuotaListener>();

export function getStorageQuotaState(): StorageQuotaState {
  return quotaState;
}

export function subscribeQuotaState(listener: QuotaListener): () => void {
  quotaListeners.add(listener);
  return () => quotaListeners.delete(listener);
}

export function setQuotaState(isExceeded: boolean, message: string | null = null): void {
  quotaState = { isExceeded, message };
  quotaListeners.forEach((listener) => {
    try {
      listener(quotaState);
    } catch (e) {
      console.error('Error in quota listener:', e);
    }
  });
}

/**
 * Checks whether an exception is a browser quota exceeded error.
 */
export function isQuotaExceededError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const error = err as { name?: string; code?: number };
  return (
    error.name === 'QuotaExceededError' ||
    error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    error.code === 22 ||
    error.code === 1014
  );
}

/**
 * Creates a safe Zustand StateStorage wrapper with graceful QuotaExceeded trapping.
 */
export function createSafeStorage(): StateStorage {
  return {
    getItem: (name: string): string | null => {
      if (typeof window === 'undefined' || !window.localStorage) {
        return null;
      }
      try {
        return window.localStorage.getItem(name);
      } catch (err) {
        console.warn(`[SlideThread Storage] Failed to read "${name}":`, err);
        return null;
      }
    },

    setItem: (name: string, value: string): void => {
      if (typeof window === 'undefined' || !window.localStorage) {
        return;
      }
      try {
        window.localStorage.setItem(name, value);
        if (quotaState.isExceeded) {
          setQuotaState(false, null);
        }
      } catch (err: unknown) {
        if (isQuotaExceededError(err)) {
          console.warn(`[SlideThread Storage] Storage quota reached writing "${name}". Preserving state in memory.`);
          setQuotaState(
            true,
            'Browser storage quota reached. Your work is safe in memory. Export your project to JSON or delete older projects to free space.'
          );
        } else {
          console.error(`[SlideThread Storage] Storage write error for "${name}":`, err);
        }
      }
    },

    removeItem: (name: string): void => {
      if (typeof window === 'undefined' || !window.localStorage) {
        return;
      }
      try {
        window.localStorage.removeItem(name);
      } catch (err) {
        console.warn(`[SlideThread Storage] Failed to remove "${name}":`, err);
      }
    },
  };
}

/**
 * Clears all user data from localStorage and IndexedDB (Spec §8.2).
 */
export async function clearAllUserData(): Promise<void> {
  // 1. Clear IndexedDB media assets
  try {
    await clearAllAssets();
  } catch (err) {
    console.warn('[SlideThread Storage] Error clearing IndexedDB assets:', err);
  }

  // 2. Remove all app keys from localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && (key.startsWith('app:') || key.startsWith('slidethread:'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => window.localStorage.removeItem(k));
    } catch (err) {
      console.warn('[SlideThread Storage] Error clearing localStorage:', err);
    }
  }

  // 3. Reset quota state
  setQuotaState(false, null);
}
