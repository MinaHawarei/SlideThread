import { plainTextFieldsToRichText } from '../../src/core/schema';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useCreateDialogStore } from '../../src/store/createDialogStore';
import { StartScreen } from '../../src/ui/start/StartScreen';
import { useProjectStore } from '../../src/store/projectStore';
import { useRecentStore } from '../../src/store/recentStore';
import { useSettingsStore } from '../../src/store/settingsStore';
import { useI18nStore } from '../../src/i18n';
import type { Project } from '../../src/core/schema';
import { CURRENT_SCHEMA_VERSION } from '../../src/core/schema';

describe('StartScreen component', () => {
  beforeEach(() => {
    // Reset stores
    useI18nStore.getState().setLocale('en');
    useSettingsStore.getState().resetSettings();
    useRecentStore.getState().clearRecents();
    useProjectStore.getState().createProject({
      title: 'Current Active Project',
      slides: [
        {
          id: 'test_slide_1',
          type: 'cover',
          fields: plainTextFieldsToRichText({ title: 'Test Title' }),
        },
      ],
    });
  });

  it('renders start screen with title, guided path, direct path, and import cards', () => {
    render(<StartScreen />);

    expect(screen.getByTestId('start-app-title')).toHaveTextContent('SlideThread');
    expect(screen.getByTestId('hero-card-stack')).toBeInTheDocument();
    expect(screen.getByTestId('quick-platform-linkedin')).toBeInTheDocument();
    expect(screen.getByTestId('quick-platform-instagram')).toBeInTheDocument();
    expect(screen.getByTestId('quick-platform-story')).toBeInTheDocument();
    expect(screen.getByTestId('quick-platform-post')).toBeInTheDocument();
    expect(screen.getByTestId('start-wizard-card')).toBeInTheDocument();
    expect(screen.getByTestId('start-import-card')).toBeInTheDocument();
    expect(screen.getByTestId('demo-projects-container')).toBeInTheDocument();
  });

  it('opens the create dialog from the New project button, blank mode', () => {
    useCreateDialogStore.setState({ open: false, request: {} });
    render(<StartScreen />);
    fireEvent.click(screen.getByTestId('start-wizard-btn'));
    expect(useCreateDialogStore.getState().open).toBe(true);
    expect(useCreateDialogStore.getState().request.templateId).toBeUndefined();
  });

  it('opens the create dialog from the hero button', () => {
    useCreateDialogStore.setState({ open: false, request: {} });
    render(<StartScreen />);
    fireEvent.click(screen.getByTestId('hero-start-btn'));
    expect(useCreateDialogStore.getState().open).toBe(true);
  });

  it('opens the create dialog with the platform preset when a quick tile is clicked', () => {
    useCreateDialogStore.setState({ open: false, request: {} });
    render(<StartScreen />);
    fireEvent.click(screen.getByTestId('quick-platform-story'));
    expect(useCreateDialogStore.getState().open).toBe(true);
    expect(useCreateDialogStore.getState().request).toMatchObject({ platform: 'instagram', formatId: 'r_9_16', contentType: 'story' });
  });

  it('no longer has the Pick Dimensions modal or the wizard', () => {
    render(<StartScreen />);
    expect(screen.queryByTestId('start-direct-card')).not.toBeInTheDocument();
    expect(screen.queryByTestId('direct-dimensions-modal')).not.toBeInTheDocument();
  });

  it('shows resume banner when active project has slides and calls onOpenProject on click', () => {
    const handleOpenProject = vi.fn();
    render(<StartScreen onOpenProject={handleOpenProject} />);

    expect(screen.getByTestId('resume-banner')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('resume-project-btn'));
    expect(handleOpenProject).toHaveBeenCalledTimes(1);
  });

  it('shows empty state when no recent projects exist', () => {
    useRecentStore.getState().clearRecents();
    render(<StartScreen />);

    expect(screen.getByTestId('recent-empty')).toBeInTheDocument();
  });

  it('renders recent projects list, opens, duplicates, and deletes recent items', () => {
    const testProject: Project = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      id: 'recent_proj_1',
      title: 'Recent Project Alpha',
      platform: 'linkedin',
      contentType: 'carousel',
      formatId: 'r_4_5',
      orientation: 'portrait',
      templateId: 'tech-mesh',
      primaryColor: '#35D0E6',
      theme: 'dark',
      textDir: 'ltr',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      slides: [
        {
          id: 'slide_r1',
          type: 'cover',
          fields: plainTextFieldsToRichText({ title: 'Slide Alpha' }),
        },
        {
          id: 'slide_r2',
          type: 'explain',
          fields: plainTextFieldsToRichText({ title: 'Slide Beta' }),
        },
      ],
    };

    useRecentStore.getState().saveProject(testProject);

    const handleOpenProject = vi.fn();
    render(<StartScreen onOpenProject={handleOpenProject} />);

    expect(screen.getByTestId('recent-item-recent_proj_1')).toBeInTheDocument();
    expect(screen.getByText('Recent Project Alpha')).toBeInTheDocument();

    // 1. Open recent
    fireEvent.click(screen.getByTestId('recent-open-recent_proj_1'));
    expect(handleOpenProject).toHaveBeenCalledWith(expect.objectContaining({ id: 'recent_proj_1' }));

    // 2. Duplicate recent
    fireEvent.click(screen.getByTestId('recent-dup-recent_proj_1'));
    expect(useRecentStore.getState().recents.length).toBe(2);

    // 3. Delete recent
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    fireEvent.click(screen.getByTestId('recent-del-recent_proj_1'));
    expect(useRecentStore.getState().getProject('recent_proj_1')).toBeUndefined();
  });

  it('loads English demo project on clicking English demo card', () => {
    const handleOpenProject = vi.fn();
    render(<StartScreen onOpenProject={handleOpenProject} />);

    fireEvent.click(screen.getByTestId('demo-en-btn'));
    expect(handleOpenProject).toHaveBeenCalledTimes(1);
    const proj = handleOpenProject.mock.calls[0]![0] as Project;
    expect(proj.title).toBe('Modern Frontend Architecture');
    expect(proj.slides.length).toBe(9);
    expect(proj.textDir).toBe('ltr');
  });

  it('loads Arabic demo project on clicking Arabic demo card', () => {
    const handleOpenProject = vi.fn();
    render(<StartScreen onOpenProject={handleOpenProject} />);

    fireEvent.click(screen.getByTestId('demo-ar-btn'));
    expect(handleOpenProject).toHaveBeenCalledTimes(1);
    const proj = handleOpenProject.mock.calls[0]![0] as Project;
    expect(proj.title).toBe('أنظمة التصميم والواجهات الحديثة');
    expect(proj.slides.length).toBe(9);
    expect(proj.textDir).toBe('rtl');
  });

  it('handles project import correctly for valid JSON file', async () => {
    const handleOpenProject = vi.fn();
    render(<StartScreen onOpenProject={handleOpenProject} />);

    const validProject: Project = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      id: 'imported_proj_123',
      title: 'Imported Project',
      platform: 'instagram',
      contentType: 'post',
      formatId: 'r_1_1',
      orientation: 'portrait',
      templateId: 'clean-minimal',
      primaryColor: '#FF5500',
      theme: 'light',
      textDir: 'ltr',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      slides: [
        {
          id: 'imported_slide_1',
          type: 'cover',
          fields: plainTextFieldsToRichText({ title: 'Imported Cover' }),
        },
      ],
    };

    const file = new File([JSON.stringify(validProject)], 'project.json', {
      type: 'application/json',
    });

    const input = screen.getByTestId('start-file-input') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(handleOpenProject).toHaveBeenCalledTimes(1);
    });
    expect(useProjectStore.getState().project.id).toBe('imported_proj_123');
  });

  it('displays error banner when importing malformed file', async () => {
    render(<StartScreen />);

    const badFile = new File(['not-valid-json{[[['], 'corrupt.json', {
      type: 'application/json',
    });

    const input = screen.getByTestId('start-file-input') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [badFile] } });

    await waitFor(() => {
      expect(screen.getByTestId('import-error-msg')).toBeInTheDocument();
    });
    expect(screen.getByTestId('import-error-msg')).toHaveTextContent(/not valid JSON/i);
  });

  it('updates language when locale changes', () => {
    render(<StartScreen />);

    expect(screen.getByTestId('start-wizard-btn')).toHaveTextContent('New project');

    // Switch to Arabic via store
    act(() => {
      useI18nStore.getState().setLocale('ar');
    });

    expect(screen.getByTestId('start-wizard-btn')).toHaveTextContent('مشروع جديد');
  });
});
