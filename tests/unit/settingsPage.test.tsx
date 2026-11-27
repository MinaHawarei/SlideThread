import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrandSettingsSchema } from '../../src/core/schema';
import { SettingsPage } from '../../src/ui/settings/SettingsPage';
import { useSettingsStore, DEFAULT_BRAND_SETTINGS } from '../../src/store/settingsStore';
import { useRecentStore } from '../../src/store/recentStore';
import {
  exportAllUserData,
  importAllUserData,
  clearAllAppData,
} from '../../src/core/dataBackup';
import { createDefaultSlide } from '../../src/store/projectStore';
import { CURRENT_SCHEMA_VERSION, type Project } from '../../src/core/schema';

describe('Settings Page Component (Spec §5.5)', () => {
  beforeEach(() => {
    useSettingsStore.getState().resetSettings();
    useRecentStore.setState({ recents: [], projects: {} });
  });

  it('renders all settings cards and title', () => {
    render(<SettingsPage />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Make it yours');
    expect(screen.getByTestId('settings-profile-section')).toBeInTheDocument();
    expect(screen.getByTestId('settings-socials-section')).toBeInTheDocument();
    expect(screen.getByTestId('settings-language-section')).toBeInTheDocument();
    expect(screen.getByTestId('settings-data-section')).toBeInTheDocument();
  });

  it('updates display name and handle in settings store', () => {
    render(<SettingsPage />);

    const nameInput = screen.getByTestId('settings-display-name-input') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Alex Morgan' } });
    expect(useSettingsStore.getState().settings.displayName).toBe('Alex Morgan');

    const handleInput = screen.getByTestId('settings-handle-input') as HTMLInputElement;
    fireEvent.change(handleInput, { target: { value: '@alexmorgan' } });
    expect(useSettingsStore.getState().settings.handle).toBe('@alexmorgan');
  });

  it('switches an account on with its own handle, and off again', () => {
    render(<SettingsPage />);

    fireEvent.click(screen.getByTestId('settings-social-chip-x'));
    fireEvent.click(screen.getByTestId('settings-social-chip-github'));
    fireEvent.change(screen.getByTestId('settings-social-handle-x'), { target: { value: 'alex_m' } });
    fireEvent.change(screen.getByTestId('settings-social-handle-github'), { target: { value: 'alexm' } });

    const socials = useSettingsStore.getState().settings.socials;
    expect(socials.find((s) => s.platform === 'x')?.handle).toBe('alex_m');
    expect(socials.find((s) => s.platform === 'github')?.handle).toBe('alexm');

    fireEvent.click(screen.getByTestId('settings-remove-social-x'));
    expect(useSettingsStore.getState().settings.socials.some((s) => s.platform === 'x')).toBe(false);
    expect(useSettingsStore.getState().settings.socials.some((s) => s.platform === 'github')).toBe(true);
  });

  it('has no design defaults, counter and signature defaults, or live preview', () => {
    render(<SettingsPage />);
    for (const id of ['settings-defaults-section', 'settings-default-template-select', 'settings-counter-toggle', 'settings-signature-toggle', 'settings-live-preview']) {
      expect(screen.queryByTestId(id)).not.toBeInTheDocument();
    }
    expect(screen.getByTestId('settings-profile-section')).toBeInTheDocument();
    expect(screen.getByTestId('settings-socials-section')).toBeInTheDocument();
    expect(screen.getByTestId('settings-language-section')).toBeInTheDocument();
    expect(screen.getByTestId('settings-data-section')).toBeInTheDocument();
  });

  it('changes the app theme from Appearance (mobile) and from the desktop nav icon', () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByTestId('settings-app-theme-dark'));
    expect(useSettingsStore.getState().settings.appTheme).toBe('dark');
    fireEvent.click(screen.getByTestId('nav-theme-toggle'));
    expect(useSettingsStore.getState().settings.appTheme).toBe('light');
  });

  it('drops old stored design defaults when loading settings', () => {
    const parsed = BrandSettingsSchema.parse({
      displayName: 'A', handle: '@a', showSignature: true, showSocials: false, socials: [], language: 'en',
      defaultTemplateId: 'tech-mesh', defaultPrimaryColor: '#123456', defaultTheme: 'light',
      defaultCounter: { show: true }, defaultSignature: { show: true },
    });
    expect(parsed).not.toHaveProperty('defaultTemplateId');
    expect(parsed).not.toHaveProperty('defaultPrimaryColor');
    expect(parsed).not.toHaveProperty('defaultTheme');
    expect(parsed).not.toHaveProperty('defaultCounter');
    expect(parsed).not.toHaveProperty('defaultSignature');
  });
});

describe('Data Management: Export, Import & Clear All Data (Spec §5.5)', () => {
  beforeEach(() => {
    useSettingsStore.getState().resetSettings();
    useRecentStore.setState({ recents: [], projects: {} });
  });

  it('exportAllUserData exports settings and projects accurately as JSON', () => {
    useSettingsStore.getState().setDisplayName('Export Test User');
    useSettingsStore.getState().setHandle('@exporttest');

    const sampleProject: Project = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      id: 'proj_sample_1',
      title: 'Sample Test Project',
      platform: 'linkedin',
      contentType: 'carousel',
      formatId: 'r_4_5',
      orientation: 'portrait',
      templateId: 'bold-marketing',
      primaryColor: '#0284c7',
      theme: 'dark',
      textDir: 'ltr',
      slides: [createDefaultSlide('cover', 0)],
      counter: {
        show: true,
        anchor: 'br',
        style: 'number',
        format: 'nn/nn',
        hideOnFirst: false,
        hideOnLast: false,
      },
      signature: {
        show: true,
        anchor: 'bc',
        arrangement: 'inline',
        size: 'md',
        photoShape: 'circle',
        showHandle: true,
        showSocials: false,
      },
      pattern: { enabled: false, intensity: 1 },
      createdAt: 1000,
      updatedAt: 2000,
    };

    useRecentStore.getState().saveProject(sampleProject);

    const exportedJson = exportAllUserData();
    const parsed = JSON.parse(exportedJson);

    expect(parsed.schemaVersion).toBe(2);
    expect(parsed.settings.displayName).toBe('Export Test User');
    expect(parsed.settings.handle).toBe('@exporttest');
    expect(parsed.projects['proj_sample_1']).toBeDefined();
    expect(parsed.projects['proj_sample_1'].title).toBe('Sample Test Project');
    expect(parsed.recents).toHaveLength(1);
  });

  it('importAllUserData restores settings, projects, and recents from backup JSON', () => {
    const backupData = {
      schemaVersion: 2,
      exportedAt: Date.now(),
      settings: {
        ...DEFAULT_BRAND_SETTINGS,
        displayName: 'Imported User',
        handle: '@imported',
        language: 'ar' as const,
      },
      projects: {
        proj_imported_1: {
          id: 'proj_imported_1',
          title: 'Imported Project 1',
          platform: 'instagram',
          contentType: 'carousel',
          formatId: 'r_1_1',
          orientation: 'portrait',
          templateId: 'tech-mesh',
          primaryColor: '#ea580c',
          theme: 'light',
          textDir: 'rtl',
          slides: [createDefaultSlide('cover', 0)],
          createdAt: 5000,
          updatedAt: 6000,
        },
      },
      recents: [
        {
          id: 'proj_imported_1',
          title: 'Imported Project 1',
          platform: 'instagram' as const,
          contentType: 'carousel' as const,
          formatId: 'r_1_1',
          slideCount: 1,
          templateId: 'tech-mesh',
          updatedAt: 6000,
        },
      ],
    };

    const success = importAllUserData(JSON.stringify(backupData));
    expect(success).toBe(true);

    expect(useSettingsStore.getState().settings.displayName).toBe('Imported User');
    expect(useSettingsStore.getState().settings.handle).toBe('@imported');
    expect(useSettingsStore.getState().settings.language).toBe('ar');

    const project = useRecentStore.getState().getProject('proj_imported_1');
    expect(project).toBeDefined();
    expect(project?.title).toBe('Imported Project 1');
    expect(useRecentStore.getState().recents).toHaveLength(1);
  });

  it('clearAllAppData clears all data and resets settings to defaults', async () => {
    useSettingsStore.getState().setDisplayName('Temporary User');
    useRecentStore.getState().saveProject({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      id: 'temp_proj',
      title: 'Temporary Project',
      platform: 'linkedin',
      contentType: 'post',
      formatId: 'r_4_5',
      orientation: 'portrait',
      templateId: 'clean-minimal',
      primaryColor: '#0284c7',
      theme: 'dark',
      textDir: 'ltr',
      slides: [createDefaultSlide('cover', 0)],
      counter: { show: false, anchor: 'br', style: 'number', format: 'nn/nn', hideOnFirst: false, hideOnLast: false },
      signature: { show: true, anchor: 'bc', arrangement: 'inline', size: 'md', photoShape: 'circle', showHandle: true, showSocials: false },
      pattern: { enabled: false, intensity: 1 },
      createdAt: 100,
      updatedAt: 200,
    });

    await clearAllAppData();

    expect(useSettingsStore.getState().settings.displayName).toBe(DEFAULT_BRAND_SETTINGS.displayName);
    expect(useRecentStore.getState().recents).toEqual([]);
    expect(useRecentStore.getState().projects).toEqual({});
  });

  it('exportAllUserData/importAllUserData round-trips active UI language and preserves language when omitted', async () => {
    const { useI18nStore } = await import('../../src/i18n');
    useI18nStore.getState().setLocale('ar');
    useSettingsStore.setState({
      settings: { ...DEFAULT_BRAND_SETTINGS, language: 'en' },
    });

    const exported = JSON.parse(exportAllUserData());
    expect(exported.settings.language).toBe('ar');

    useI18nStore.getState().setLocale('en');
    expect(importAllUserData(JSON.stringify(exported))).toBe(true);
    expect(useI18nStore.getState().locale).toBe('ar');

    // Old backup without settings.language must not clobber current locale
    const legacyBackup = {
      schemaVersion: 1,
      settings: { displayName: 'Legacy User' },
      projects: {},
    };
    expect(importAllUserData(JSON.stringify(legacyBackup))).toBe(true);
    expect(useI18nStore.getState().locale).toBe('ar');
    useI18nStore.getState().setLocale('en');
  });

  it('importAllUserData rejects meaningless JSON without partial state mutation', () => {
    useSettingsStore.getState().setDisplayName('Keep Me');
    expect(importAllUserData(JSON.stringify({ hello: 'world' }))).toBe(false);
    expect(importAllUserData(JSON.stringify({ schemaVersion: 99, settings: {} }))).toBe(false);
    expect(importAllUserData(JSON.stringify({ schemaVersion: 2 }))).toBe(false);
    expect(importAllUserData(JSON.stringify([1, 2, 3]))).toBe(false);
    expect(useSettingsStore.getState().settings.displayName).toBe('Keep Me');
  });
});

describe('backup import never silently deletes saved projects', () => {
  const emptyBackup = JSON.stringify({ schemaVersion: 2, exportedAt: 1, settings: {}, projects: {}, recents: [] });
  const seed = () =>
    useRecentStore.setState({
      projects: { p1: { id: 'p1', slides: [] } as unknown as Project },
      recents: [],
    });

  it('refuses an empty-project backup without confirmation and keeps projects', () => {
    seed();
    expect(importAllUserData(emptyBackup)).toBe(false);
    expect(Object.keys(useRecentStore.getState().projects)).toEqual(['p1']);
  });

  it('keeps projects when the user declines', () => {
    seed();
    const confirmOverwrite = vi.fn(() => false);
    expect(importAllUserData(emptyBackup, { confirmOverwrite })).toBe(false);
    expect(confirmOverwrite).toHaveBeenCalledWith({ existingProjects: 1, removedProjects: 1, incomingProjects: 0 });
    expect(Object.keys(useRecentStore.getState().projects)).toEqual(['p1']);
  });

  it('applies the backup after explicit confirmation', () => {
    seed();
    expect(importAllUserData(emptyBackup, { confirmOverwrite: () => true })).toBe(true);
    expect(useRecentStore.getState().projects).toEqual({});
  });

  it('imports without a prompt when nothing would be removed', () => {
    useRecentStore.setState({ projects: {}, recents: [] });
    const confirmOverwrite = vi.fn(() => false);
    expect(importAllUserData(emptyBackup, { confirmOverwrite })).toBe(true);
    expect(confirmOverwrite).not.toHaveBeenCalled();
  });
});
