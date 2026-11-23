import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
    expect(screen.getByTestId('settings-defaults-section')).toBeInTheDocument();
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

  it('adds and removes social accounts', () => {
    render(<SettingsPage />);

    const handleInput = screen.getByTestId('settings-new-social-handle') as HTMLInputElement;
    const addBtn = screen.getByTestId('settings-add-social-btn');

    fireEvent.change(handleInput, { target: { value: 'alex_m' } });
    fireEvent.click(addBtn);

    const socials = useSettingsStore.getState().settings.socials;
    expect(socials.some((s) => s.platform === 'x' && s.handle === 'alex_m')).toBe(true);

    const removeBtn = screen.getByTestId('settings-remove-social-x');
    fireEvent.click(removeBtn);
    expect(useSettingsStore.getState().settings.socials.some((s) => s.platform === 'x')).toBe(false);
  });

  it('updates design defaults: template, theme, and color', () => {
    render(<SettingsPage />);

    const templateSelect = screen.getByTestId('settings-default-template-select') as HTMLSelectElement;
    fireEvent.change(templateSelect, { target: { value: 'clean-minimal' } });
    expect(useSettingsStore.getState().settings.defaultTemplateId).toBe('clean-minimal');

    const lightBtn = screen.getByTestId('settings-theme-light');
    fireEvent.click(lightBtn);
    expect(useSettingsStore.getState().settings.defaultTheme).toBe('light');

    const colorInput = screen.getByTestId('settings-default-color-input') as HTMLInputElement;
    fireEvent.change(colorInput, { target: { value: '#7c3aed' } });
    expect(useSettingsStore.getState().settings.defaultPrimaryColor).toBe('#7c3aed');
  });

  it('updates counter and signature defaults', () => {
    render(<SettingsPage />);

    const counterToggle = screen.getByTestId('settings-counter-toggle') as HTMLInputElement;
    fireEvent.click(counterToggle);
    expect(useSettingsStore.getState().settings.defaultCounter?.show).toBe(false);

    const sigToggle = screen.getByTestId('settings-signature-toggle') as HTMLInputElement;
    fireEvent.click(sigToggle);
    expect(useSettingsStore.getState().settings.defaultSignature?.show).toBe(false);
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
      templateId: 'bold',
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
          templateId: 'network',
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
          templateId: 'network',
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
      templateId: 'clean',
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
});
