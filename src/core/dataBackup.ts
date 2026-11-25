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
  const activeLanguage = useI18nStore.getState().locale;
  const settings = {
    ...useSettingsStore.getState().settings,
    language: activeLanguage,
  };
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

const SUPPORTED_BACKUP_VERSIONS = new Set([1, 2]);

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Parses and restores all user data from a backup JSON string.
 * Validates and migrates projects if needed, restores settings and UI language.
 */
export function importAllUserData(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString) as Partial<AllUserDataBackup>;
    if (!isPlainRecord(parsed)) {
      return false;
    }

    if (typeof parsed.schemaVersion !== 'number' || !SUPPORTED_BACKUP_VERSIONS.has(parsed.schemaVersion)) {
      return false;
    }

    const hasSettings = parsed.settings !== undefined;
    const hasProjects = parsed.projects !== undefined;
    if (!hasSettings && !hasProjects) {
      return false;
    }
    if (hasSettings && !isPlainRecord(parsed.settings)) {
      return false;
    }
    if (hasProjects && !isPlainRecord(parsed.projects)) {
      return false;
    }
    if (parsed.recents !== undefined && !Array.isArray(parsed.recents)) {
      return false;
    }

    let nextProjects: Record<string, Project> | undefined;
    if (hasProjects && isPlainRecord(parsed.projects)) {
      const migratedProjects: Record<string, Project> = {};
      for (const [id, proj] of Object.entries(parsed.projects)) {
        if (!isPlainRecord(proj) || !Array.isArray(proj.slides)) {
          return false;
        }
        try {
          migratedProjects[id] = migrate(proj);
        } catch {
          migratedProjects[id] = proj as unknown as Project;
        }
      }
      nextProjects = migratedProjects;
    }

    if (hasSettings && isPlainRecord(parsed.settings)) {
      const currentLocale = useI18nStore.getState().locale;
      const importedLang =
        parsed.settings.language === 'en' || parsed.settings.language === 'ar'
          ? parsed.settings.language
          : undefined;
      useSettingsStore.setState({
        settings: {
          ...DEFAULT_BRAND_SETTINGS,
          ...(parsed.settings as Partial<BrandSettings>),
          language: importedLang ?? currentLocale,
        },
      });
      if (importedLang) {
        useI18nStore.getState().setLocale(importedLang);
      }
    }

    if (nextProjects !== undefined) {
      useRecentStore.setState({
        projects: nextProjects,
        recents: Array.isArray(parsed.recents) ? parsed.recents : [],
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
