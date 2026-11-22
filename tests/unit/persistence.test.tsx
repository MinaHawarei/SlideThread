import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  STORAGE_KEYS,
  createSafeStorage,
  getStorageQuotaState,
  setQuotaState,
  clearAllUserData,
  isQuotaExceededError,
} from '../../src/core/storage';
import { StorageQuotaBanner } from '../../src/ui/common/StorageQuotaBanner';
import { useProjectStore } from '../../src/store/projectStore';
import { useRecentStore } from '../../src/store/recentStore';
import * as assetStore from '../../src/core/assetStore';

describe('Task P4-1: Persistence & Quota Resilience (Spec §8.1, §8.2)', () => {
  beforeEach(() => {
    localStorage.clear();
    setQuotaState(false, null);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    setQuotaState(false, null);
    vi.useRealTimers();
  });

  describe('Storage Keys and Versioning', () => {
    it('uses versioned storage keys matching Spec §8.1 and §8.2', () => {
      expect(STORAGE_KEYS.SETTINGS).toBe('app:settings:v1');
      expect(STORAGE_KEYS.PROJECTS).toBe('app:projects:v1');
      expect(STORAGE_KEYS.CURRENT_PROJECT).toBe('app:current-project:v1');
    });
  });

  describe('createSafeStorage & Quota Error Handling', () => {
    it('successfully reads and writes values to localStorage', () => {
      const storage = createSafeStorage();
      storage.setItem('test-key', JSON.stringify({ hello: 'world' }));
      expect(storage.getItem('test-key')).toBe(JSON.stringify({ hello: 'world' }));

      storage.removeItem('test-key');
      expect(storage.getItem('test-key')).toBeNull();
    });

    it('identifies QuotaExceededError DOMExceptions', () => {
      const quotaErr = new DOMException('The quota has been exceeded', 'QuotaExceededError');
      expect(isQuotaExceededError(quotaErr)).toBe(true);

      const standardErr = new Error('Regular error');
      expect(isQuotaExceededError(standardErr)).toBe(false);
    });

    it('gracefully traps QuotaExceededError without throwing and updates quotaState', () => {
      const storage = createSafeStorage();
      const quotaErr = new DOMException('Storage quota exceeded', 'QuotaExceededError');

      vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
        throw quotaErr;
      });

      // Does not throw
      expect(() => {
        storage.setItem('large-item', 'x'.repeat(1000));
      }).not.toThrow();

      expect(getStorageQuotaState().isExceeded).toBe(true);
      expect(getStorageQuotaState().message).toContain('quota');

      // Next successful write clears quota state
      storage.setItem('normal-item', 'test');
      expect(getStorageQuotaState().isExceeded).toBe(false);
    });
  });

  describe('StorageQuotaBanner Component', () => {
    it('renders alert when quota is exceeded and dismisses on close button click', () => {
      setQuotaState(true, 'Storage quota reached');

      render(<StorageQuotaBanner />);

      const banner = screen.getByTestId('storage-quota-banner');
      expect(banner).toBeInTheDocument();
      expect(banner).toHaveAttribute('role', 'alert');

      const dismissBtn = screen.getByTestId('storage-quota-dismiss');
      fireEvent.click(dismissBtn);

      expect(screen.queryByTestId('storage-quota-banner')).not.toBeInTheDocument();
      expect(getStorageQuotaState().isExceeded).toBe(false);
    });

    it('does not render when storage quota is not exceeded', () => {
      setQuotaState(false, null);
      render(<StorageQuotaBanner />);
      expect(screen.queryByTestId('storage-quota-banner')).not.toBeInTheDocument();
    });
  });

  describe('Autosave Pipeline (Debounced ~500ms)', () => {
    it('automatically syncs project updates to recent projects store after 500ms debounce', () => {
      vi.useFakeTimers();

      useRecentStore.getState().clearRecents();
      expect(useRecentStore.getState().recents).toHaveLength(0);

      const testTitle = 'Debounced Autosave Test Project';
      useProjectStore.getState().updateProjectMeta({ title: testTitle });

      // Before 500ms: not yet synced to recents
      vi.advanceTimersByTime(250);
      expect(useRecentStore.getState().recents.some((r) => r.title === testTitle)).toBe(false);

      // After 500ms: synced to recents
      vi.advanceTimersByTime(300);
      expect(useRecentStore.getState().recents.some((r) => r.title === testTitle)).toBe(true);
    });
  });

  describe('Clear All User Data (Spec §8.2)', () => {
    it('removes all localStorage app keys and triggers IndexedDB asset store clearing', async () => {
      const clearAssetsSpy = vi.spyOn(assetStore, 'clearAllAssets').mockResolvedValue();

      localStorage.setItem('app:settings:v1', 'settings-data');
      localStorage.setItem('app:projects:v1', 'projects-data');
      localStorage.setItem('app:current-project:v1', 'current-project-data');
      localStorage.setItem('unrelated-key', 'keep-me');

      await clearAllUserData();

      expect(localStorage.getItem('app:settings:v1')).toBeNull();
      expect(localStorage.getItem('app:projects:v1')).toBeNull();
      expect(localStorage.getItem('app:current-project:v1')).toBeNull();
      expect(localStorage.getItem('unrelated-key')).toBe('keep-me');

      expect(clearAssetsSpy).toHaveBeenCalledTimes(1);
    });
  });
});
