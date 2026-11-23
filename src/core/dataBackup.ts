import type { BrandSettings, Project } from './schema';
import { useSettingsStore, DEFAULT_BRAND_SETTINGS } from '../store/settingsStore';
import { useRecentStore, type RecentProjectItem } from '../store/recentStore';
import { useI18nStore } from '../i18n';
import { clearAllUserData } from './storage';
import { migrate } from './migrate';

export interface AllUserDataBackup {
  schemaVersion: number;
  exportedAt: number;
  settings: BrandSettings;
  projects: Record<string, Project>;
  recents: RecentProjectItem[];
}

/**
 * Serializes all user data (profile settings, project defaults, all saved projects, recents)
 * into a JSON string for full data backup (Spec §5.5).
 */
export function exportAllUserData(): string {
  const settings = useSettingsStore.getState().settings;
  const recentState = useRecentStore.getState();
  const backup: AllUserDataBackup = {
    schemaVersion: 2,
    exportedAt: Date.now(),
    settings,
    projects: recentState.projects || {},
    recents: recentState.recents || [],
  };
  return JSON.stringify(backup, null, 2);
}

/**
 * Triggers client-side download of all user data as a JSON backup file.
 */
export function downloadAllUserData(): void {
  const json = exportAllUserData();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const dateStr = new Date().toISOString().slice(0, 10);
  const a = document.createElement('a');
  a.href = url;
  a.download = `slidethread-backup-${dateStr}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

/**
 * Parses and restores all user data from a backup JSON string.
 * Validates and migrates projects if needed, restores settings and UI language.
 */
export function importAllUserData(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString) as Partial<AllUserDataBackup>;
    if (!parsed || typeof parsed !== 'object') {
      return false;
    }

    if (parsed.settings && typeof parsed.settings === 'object') {
      useSettingsStore.setState({ settings: { ...DEFAULT_BRAND_SETTINGS, ...parsed.settings } });
      if (parsed.settings.language) {
        useI18nStore.getState().setLocale(parsed.settings.language);
      }
    }

    if (parsed.projects && typeof parsed.projects === 'object') {
      const migratedProjects: Record<string, Project> = {};
      for (const [id, proj] of Object.entries(parsed.projects)) {
        try {
          const validated = migrate(proj);
          migratedProjects[id] = validated;
        } catch {
          migratedProjects[id] = proj;
        }
      }
      useRecentStore.setState({
        projects: migratedProjects,
        recents: parsed.recents || [],
      });
    }

    return true;
  } catch (err) {
    console.warn('[DataBackup] Failed to import backup:', err);
    return false;
  }
}

/**
 * Clears all user data from localStorage and IndexedDB, and resets all stores to defaults.
 */
export async function clearAllAppData(): Promise<void> {
  await clearAllUserData();
  useSettingsStore.getState().resetSettings();
  useRecentStore.setState({ recents: [], projects: {} });
}
