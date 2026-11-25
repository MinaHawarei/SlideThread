import { plainTextFieldsToRichText } from '../../src/core/schema';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
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
    expect(screen.getByTestId('hero-carousel')).toBeInTheDocument();
    expect(screen.getByTestId('quick-platform-linkedin')).toBeInTheDocument();
    expect(screen.getByTestId('quick-platform-instagram')).toBeInTheDocument();
    expect(screen.getByTestId('quick-platform-story')).toBeInTheDocument();
    expect(screen.getByTestId('quick-platform-post')).toBeInTheDocument();
    expect(screen.getByTestId('start-wizard-card')).toBeInTheDocument();
    expect(screen.getByTestId('start-direct-card')).toBeInTheDocument();
    expect(screen.getByTestId('start-import-card')).toBeInTheDocument();
    expect(screen.getByTestId('demo-projects-container')).toBeInTheDocument();
  });

  it('calls onStartWizard when guided path button is clicked', () => {
    const handleStartWizard = vi.fn();
    render(<StartScreen onStartWizard={handleStartWizard} />);

    fireEvent.click(screen.getByTestId('start-wizard-btn'));
    expect(handleStartWizard).toHaveBeenCalledTimes(1);
  });

  it('opens direct dimensions modal when Pick Dimensions is clicked', () => {
    render(<StartScreen />);

    expect(screen.queryByTestId('direct-dimensions-modal')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('start-direct-btn'));
    expect(screen.getByTestId('direct-dimensions-modal')).toBeInTheDocument();

    // Verify 4 direct format options exist
    expect(screen.getByTestId('direct-format-r_4_5')).toBeInTheDocument();
    expect(screen.getByTestId('direct-format-r_1_1')).toBeInTheDocument();
    expect(screen.getByTestId('direct-format-r_16_9')).toBeInTheDocument();
    expect(screen.getByTestId('direct-format-r_9_16')).toBeInTheDocument();

    // Close modal
    fireEvent.click(screen.getByTestId('close-direct-modal'));
    expect(screen.queryByTestId('direct-dimensions-modal')).not.toBeInTheDocument();
  });

  it('creates project with selected format and opens editor when format is picked', async () => {
    const handleOpenProject = vi.fn();
    render(<StartScreen onOpenProject={handleOpenProject} />);

    fireEvent.click(screen.getByTestId('start-direct-btn'));
    fireEvent.click(screen.getByTestId('direct-format-r_1_1'));

    await waitFor(() => expect(handleOpenProject).toHaveBeenCalledTimes(1), { timeout: 10000 });
    const createdProject = handleOpenProject.mock.calls[0]![0] as Project;
    expect(createdProject.formatId).toBe('r_1_1');
    expect(createdProject.orientation).toBe('portrait');
    expect(useProjectStore.getState().project.formatId).toBe('r_1_1');
  });

  it('creates project directly when a quick platform tile is clicked', async () => {
    const handleOpenProject = vi.fn();
    render(<StartScreen onOpenProject={handleOpenProject} />);

    // Click LinkedIn Carousel (4:5)
    fireEvent.click(screen.getByTestId('quick-platform-linkedin'));
    await waitFor(() => expect(handleOpenProject).toHaveBeenCalledTimes(1), { timeout: 10000 });
    const linkedinProj = handleOpenProject.mock.calls[0]![0] as Project;
    expect(linkedinProj.platform).toBe('linkedin');
    expect(linkedinProj.formatId).toBe('r_4_5');

    // Click Story (9:16)
    fireEvent.click(screen.getByTestId('quick-platform-story'));
    await waitFor(() => expect(handleOpenProject).toHaveBeenCalledTimes(2), { timeout: 10000 });
    const storyProj = handleOpenProject.mock.calls[1]![0] as Project;
    expect(storyProj.formatId).toBe('r_9_16');
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

    expect(screen.getByTestId('start-wizard-btn')).toHaveTextContent('Start with Wizard');

    // Switch to Arabic via store
    act(() => {
      useI18nStore.getState().setLocale('ar');
    });

    expect(screen.getByTestId('start-wizard-btn')).toHaveTextContent('البدء مع المعالج');
  });
});
