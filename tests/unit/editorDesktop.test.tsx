import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditorDesktop } from '../../src/ui/editor/EditorDesktop';
import { useProjectStore } from '../../src/store/projectStore';
import { useSettingsStore } from '../../src/store/settingsStore';
import { useI18nStore } from '../../src/i18n';
import type { Project } from '../../src/core/schema';
import { CURRENT_SCHEMA_VERSION } from '../../src/core/schema';

describe('EditorDesktop component (Task P3-5)', () => {
  const initialProject: Project = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    id: 'test_editor_proj',
    title: 'Architectural Decisions',
    platform: 'linkedin',
    contentType: 'carousel',
    formatId: 'r_4_5',
    orientation: 'portrait',
    templateId: 'network',
    primaryColor: '#35D0E6',
    theme: 'dark',
    textDir: 'ltr',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    slides: [
      {
        id: 'slide_1',
        type: 'cover',
        fields: {
          tag: 'TECH',
          title: 'Decoupled Systems',
          sub: 'Designing without server runtime',
          rule: 'npm install',
        },
      },
      {
        id: 'slide_2',
        type: 'explain',
        fields: {
          title: 'Core Concept',
          body: '- Point 1: First point\n- Point 2: Second point',
        },
      },
    ],
  };

  beforeEach(() => {
    useI18nStore.getState().setLocale('en');
    useProjectStore.getState().setProject(initialProject);
  });

  it('renders top bar, left slide rail, center canvas, and right inspector', () => {
    render(<EditorDesktop />);

    expect(screen.getByTestId('editor-desktop')).toBeInTheDocument();
    expect(screen.getByTestId('editor-home-btn')).toBeInTheDocument();
    expect(screen.getByTestId('editor-project-title')).toHaveValue('Architectural Decisions');
    expect(screen.getByTestId('slide-rail')).toBeInTheDocument();
    expect(screen.getByTestId('main-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('inspector')).toBeInTheDocument();
  });

  it('allows editing project title in the top bar', () => {
    render(<EditorDesktop />);

    const titleInput = screen.getByTestId('editor-project-title');
    fireEvent.change(titleInput, { target: { value: 'New Renamed Title' } });

    expect(useProjectStore.getState().project.title).toBe('New Renamed Title');
  });

  it('calls onHome when the home button is clicked', () => {
    const handleHome = vi.fn();
    render(<EditorDesktop onHome={handleHome} />);

    fireEvent.click(screen.getByTestId('editor-home-btn'));
    expect(handleHome).toHaveBeenCalledTimes(1);
  });

  it('adds a new slide when Add Slide button in rail is clicked', () => {
    render(<EditorDesktop />);

    expect(screen.getByTestId('rail-slide-slide_1')).toBeInTheDocument();
    expect(screen.getByTestId('rail-slide-slide_2')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('rail-add-slide-btn'));

    expect(useProjectStore.getState().project.slides.length).toBe(3);
  });

  it('duplicates a slide from the slide rail', () => {
    render(<EditorDesktop />);

    fireEvent.click(screen.getByTestId('rail-duplicate-slide_1'));

    const slides = useProjectStore.getState().project.slides;
    expect(slides.length).toBe(3);
    expect(slides[1]!.type).toBe('cover');
    expect(slides[1]!.fields.title).toBe('Decoupled Systems');
  });

  it('deletes a slide from the slide rail', () => {
    render(<EditorDesktop />);

    fireEvent.click(screen.getByTestId('rail-delete-slide_2'));

    const slides = useProjectStore.getState().project.slides;
    expect(slides.length).toBe(1);
    expect(slides[0]!.id).toBe('slide_1');
  });

  it('reorders slides using accessible Move Up / Move Down buttons', () => {
    render(<EditorDesktop />);

    // slide_2 move up
    fireEvent.click(screen.getByTestId('rail-move-up-slide_2'));

    const slides = useProjectStore.getState().project.slides;
    expect(slides[0]!.id).toBe('slide_2');
    expect(slides[1]!.id).toBe('slide_1');
  });

  it('hides Add Slide button when content type is single-slide post (Spec §4.4)', () => {
    useProjectStore.getState().setProject({
      ...initialProject,
      contentType: 'post',
      slides: [initialProject.slides[0]!],
    });

    render(<EditorDesktop />);

    expect(screen.queryByTestId('rail-add-slide-btn')).not.toBeInTheDocument();
    expect(screen.queryByTestId('rail-duplicate-slide_1')).not.toBeInTheDocument();
  });

  it('navigates between slides using canvas Next / Previous buttons', () => {
    render(<EditorDesktop />);

    expect(screen.getByTestId('canvas-counter-label')).toHaveTextContent(/Slide 1 of 2/i);

    fireEvent.click(screen.getByTestId('canvas-next-btn'));
    expect(screen.getByTestId('canvas-counter-label')).toHaveTextContent(/Slide 2 of 2/i);
    expect(useProjectStore.getState().activeSlideId).toBe('slide_2');

    fireEvent.click(screen.getByTestId('canvas-prev-btn'));
    expect(screen.getByTestId('canvas-counter-label')).toHaveTextContent(/Slide 1 of 2/i);
    expect(useProjectStore.getState().activeSlideId).toBe('slide_1');
  });

  it('switches inspector tabs between Slide, Design, and Brand', () => {
    render(<EditorDesktop />);

    // Default tab is Slide
    expect(screen.getByTestId('slide-inspector')).toBeInTheDocument();

    // Switch to Design tab
    fireEvent.click(screen.getByTestId('tab-design'));
    expect(screen.getByTestId('design-inspector')).toBeInTheDocument();
    expect(screen.queryByTestId('slide-inspector')).not.toBeInTheDocument();

    // Switch to Brand tab
    fireEvent.click(screen.getByTestId('tab-brand'));
    expect(screen.getByTestId('brand-inspector')).toBeInTheDocument();
    expect(screen.queryByTestId('design-inspector')).not.toBeInTheDocument();
  });

  it('edits slide fields and preserves compatible fields on slide type switch', () => {
    render(<EditorDesktop />);

    // Select slide 1 (cover)
    const titleField = screen.getByTestId('field-title');
    fireEvent.change(titleField, { target: { value: 'Updated Cover Title' } });

    expect(useProjectStore.getState().project.slides[0]!.fields.title).toBe('Updated Cover Title');

    // Switch type from cover to explain
    const typeSelect = screen.getByTestId('slide-type-select');
    fireEvent.change(typeSelect, { target: { value: 'explain' } });

    const active = useProjectStore.getState().project.slides[0]!;
    expect(active.type).toBe('explain');
    // Compatible field 'title' was preserved per Spec §10.2
    expect(active.fields.title).toBe('Updated Cover Title');
  });

  it('displays overflow warning on explain slide with long text and splits into two slides', () => {
    // Set slide 2 (explain) with long bullet list
    useProjectStore.getState().updateSlideFields('slide_2', {
      title: 'Long Topic',
      body: '- Point 1: Long point A\n- Point 2: Long point B\n- Point 3: Long point C\n- Point 4: Long point D\n- Point 5: Long point E',
    });
    useProjectStore.getState().setActiveSlideId('slide_2');

    render(<EditorDesktop />);

    // Check overflow warning is visible
    expect(screen.getByTestId('overflow-warning-box')).toBeInTheDocument();

    // Click split action
    fireEvent.click(screen.getByTestId('split-slide-btn'));

    // Project should now have 3 slides
    const slides = useProjectStore.getState().project.slides;
    expect(slides.length).toBe(3);
    expect(slides[1]!.fields.body).toContain('Point 1');
    expect(slides[2]!.fields.title).toBe('Long Topic (Cont.)');
    expect(slides[2]!.fields.body).toContain('Point 4');
  });

  it('updates template, color, and theme mode from Design Inspector', () => {
    render(<EditorDesktop />);

    // Switch to Design tab
    fireEvent.click(screen.getByTestId('tab-design'));

    // Switch template to bold
    fireEvent.click(screen.getByTestId('design-template-bold'));
    expect(useProjectStore.getState().project.templateId).toBe('bold');

    // Pick preset color
    fireEvent.click(screen.getByTestId('design-preset-F43F5E'));
    expect(useProjectStore.getState().project.primaryColor).toBe('#F43F5E');

    // Toggle theme to light
    fireEvent.click(screen.getByTestId('design-theme-light'));
    expect(useProjectStore.getState().project.theme).toBe('light');
  });

  it('updates display name, handle, and signature toggle in Brand Inspector', () => {
    render(<EditorDesktop />);

    // Switch to Brand tab
    fireEvent.click(screen.getByTestId('tab-brand'));

    // Update display name
    const nameInput = screen.getByTestId('brand-name-input');
    fireEvent.change(nameInput, { target: { value: 'Alex Dev' } });
    expect(useSettingsStore.getState().settings.displayName).toBe('Alex Dev');

    // Toggle signature
    const sigToggle = screen.getByTestId('brand-signature-toggle');
    fireEvent.click(sigToggle);
    expect(useSettingsStore.getState().settings.showSignature).toBe(false);
  });
});
