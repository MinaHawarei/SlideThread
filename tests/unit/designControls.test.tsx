import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { DesignInspector } from '../../src/ui/editor/DesignInspector';
import { ChangeFormatDialog } from '../../src/ui/editor/ChangeFormatDialog';
import { useProjectStore } from '../../src/store/projectStore';
import { useSettingsStore } from '../../src/store/settingsStore';
import { getDemoProjectEn } from '../../src/store/seedProjects';

describe('Design Controls & Format Relayout (Spec §7, §4.3, Task P3-7)', () => {
  beforeEach(() => {
    const demo = getDemoProjectEn();
    useProjectStore.getState().setProject(demo);
    useSettingsStore.getState().resetSettings();
  });

  it('renders all design controls: template picker, free color picker, presets, theme, direction, and change format button', () => {
    render(<DesignInspector />);

    expect(screen.getByTestId('design-inspector')).toBeInTheDocument();
    expect(screen.getByTestId('design-template-tech-mesh')).toBeInTheDocument();
    expect(screen.getByTestId('design-template-clean-minimal')).toBeInTheDocument();
    expect(screen.getByTestId('design-template-bold-marketing')).toBeInTheDocument();
    expect(screen.getByTestId('design-template-soft-gradient')).toBeInTheDocument();
    expect(screen.getByTestId('design-template-heritage-geometric')).toBeInTheDocument();

    expect(screen.getByTestId('design-color-picker')).toBeInTheDocument();
    expect(screen.getByTestId('design-preset-35D0E6')).toBeInTheDocument();

    expect(screen.getByTestId('design-theme-dark')).toBeInTheDocument();
    expect(screen.getByTestId('design-theme-light')).toBeInTheDocument();

    expect(screen.getByTestId('design-dir-auto')).toBeInTheDocument();
    expect(screen.getByTestId('design-dir-ltr')).toBeInTheDocument();
    expect(screen.getByTestId('design-dir-rtl')).toBeInTheDocument();

    expect(screen.getByTestId('design-change-format-btn')).toBeInTheDocument();
  });

  it('switches templates without losing any slide content', () => {
    render(<DesignInspector />);

    const initialSlides = JSON.stringify(useProjectStore.getState().project.slides);

    // Switch to Clean
    fireEvent.click(screen.getByTestId('design-template-clean-minimal'));
    expect(useProjectStore.getState().project.templateId).toBe('clean-minimal');

    // Switch to Bold
    fireEvent.click(screen.getByTestId('design-template-bold-marketing'));
    expect(useProjectStore.getState().project.templateId).toBe('bold-marketing');

    // Switch back to Network
    fireEvent.click(screen.getByTestId('design-template-tech-mesh'));
    expect(useProjectStore.getState().project.templateId).toBe('tech-mesh');

    // Slides content unchanged
    expect(JSON.stringify(useProjectStore.getState().project.slides)).toBe(initialSlides);
  });

  it('updates primary color using free color picker and preset chips', () => {
    render(<DesignInspector />);

    // Free color picker
    const picker = screen.getByTestId('design-color-picker');
    fireEvent.change(picker, { target: { value: '#ff5722' } });
    expect(useProjectStore.getState().project.primaryColor).toBe('#ff5722');

    // Preset chip (Emerald #10B981)
    const emeraldChip = screen.getByTestId('design-preset-10B981');
    fireEvent.click(emeraldChip);
    expect(useProjectStore.getState().project.primaryColor).toBe('#10B981');
  });

  it('switches theme between dark and light', () => {
    render(<DesignInspector />);

    // Switch to light
    fireEvent.click(screen.getByTestId('design-theme-light'));
    expect(useProjectStore.getState().project.theme).toBe('light');

    // Switch to dark
    fireEvent.click(screen.getByTestId('design-theme-dark'));
    expect(useProjectStore.getState().project.theme).toBe('dark');
  });

  it('switches text direction between auto, ltr, and rtl', () => {
    render(<DesignInspector />);

    // Switch to RTL
    fireEvent.click(screen.getByTestId('design-dir-rtl'));
    expect(useProjectStore.getState().project.textDir).toBe('rtl');

    // Switch to LTR
    fireEvent.click(screen.getByTestId('design-dir-ltr'));
    expect(useProjectStore.getState().project.textDir).toBe('ltr');

    // Switch to Auto
    fireEvent.click(screen.getByTestId('design-dir-auto'));
    expect(useProjectStore.getState().project.textDir).toBe('auto');
  });

  it('opens and closes ChangeFormatDialog from DesignInspector', () => {
    render(<DesignInspector />);

    expect(screen.queryByTestId('change-format-dialog')).not.toBeInTheDocument();

    // Click Change Format button
    fireEvent.click(screen.getByTestId('design-change-format-btn'));
    expect(screen.getByTestId('change-format-dialog')).toBeInTheDocument();

    // Click Cancel
    fireEvent.click(screen.getByTestId('cancel-change-format-btn'));
    expect(screen.queryByTestId('change-format-dialog')).not.toBeInTheDocument();
  });

  it('changes format to 1:1 square losslessly via ChangeFormatDialog', () => {
    const initialSlideCount = useProjectStore.getState().project.slides.length;
    const initialCoverTitle = useProjectStore.getState().project.slides[0]?.fields.title;

    render(<ChangeFormatDialog isOpen={true} onClose={() => {}} />);

    // Pick 1:1
    const squareOption = screen.getByTestId('change-format-option-r_1_1');
    fireEvent.click(squareOption);

    // Apply
    fireEvent.click(screen.getByTestId('apply-change-format-btn'));

    expect(useProjectStore.getState().project.formatId).toBe('r_1_1');
    // Ensure all slides and content preserved
    expect(useProjectStore.getState().project.slides.length).toBe(initialSlideCount);
    expect(useProjectStore.getState().project.slides[0]?.fields.title).toBe(initialCoverTitle);
  });

  it('changes format to 16:9 with orientation toggle', () => {
    render(<ChangeFormatDialog isOpen={true} onClose={() => {}} />);

    // Pick 16:9
    fireEvent.click(screen.getByTestId('change-format-option-r_16_9'));

    // Landscape orientation button appears
    expect(screen.getByTestId('change-orientation-landscape')).toBeInTheDocument();
    expect(screen.getByTestId('change-orientation-portrait')).toBeInTheDocument();

    // Select Landscape
    fireEvent.click(screen.getByTestId('change-orientation-landscape'));

    // Apply
    fireEvent.click(screen.getByTestId('apply-change-format-btn'));

    expect(useProjectStore.getState().project.formatId).toBe('r_16_9');
    expect(useProjectStore.getState().project.orientation).toBe('landscape');
  });

  it('closes dialog on Escape key and on backdrop click', () => {
    const handleClose = () => {};
    const { rerender } = render(<ChangeFormatDialog isOpen={true} onClose={handleClose} />);

    // Escape key
    fireEvent.keyDown(window, { key: 'Escape' });

    // Backdrop click
    rerender(<ChangeFormatDialog isOpen={true} onClose={handleClose} />);
    fireEvent.click(screen.getByTestId('change-format-dialog-backdrop'));
  });

  it('verifies Gate G3 condition: switching format/orientation/template/color/theme never loses content', () => {
    const originalProject = useProjectStore.getState().project;
    const originalSlideContents = originalProject.slides.map((s) => ({
      id: s.id,
      type: s.type,
      fields: { ...s.fields },
    }));

    // Perform rapid full-matrix mutations
    act(() => {
      // 1. Change format to 16:9 landscape
      useProjectStore.getState().updateProjectMeta({ formatId: 'r_16_9', orientation: 'landscape' });
      // 2. Change template to bold
      useProjectStore.getState().updateProjectMeta({ templateId: 'bold' });
      // 3. Change color to rose
      useProjectStore.getState().updateProjectMeta({ primaryColor: '#F43F5E' });
      // 4. Change theme to light
      useProjectStore.getState().updateProjectMeta({ theme: 'light' });
      // 5. Change direction to rtl
      useProjectStore.getState().updateProjectMeta({ textDir: 'rtl' });
      // 6. Change format to 9:16 story
      useProjectStore.getState().updateProjectMeta({ formatId: 'r_9_16', orientation: 'portrait' });
      // 7. Change template to clean
      useProjectStore.getState().updateProjectMeta({ templateId: 'clean' });
      // 8. Change format back to 4:5
      useProjectStore.getState().updateProjectMeta({ formatId: 'r_4_5' });
    });

    const currentProject = useProjectStore.getState().project;
    expect(currentProject.slides.length).toBe(originalSlideContents.length);

    currentProject.slides.forEach((slide, idx) => {
      const orig = originalSlideContents[idx]!;
      expect(slide.id).toBe(orig.id);
      expect(slide.type).toBe(orig.type);
      expect(slide.fields).toEqual(orig.fields);
    });
  });
});
