import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChangeFormatDialog } from '../../src/ui/editor/ChangeFormatDialog';
import { useProjectStore } from '../../src/store/projectStore';
import type { Project } from '../../src/core/schema';

const testProject: Project = {
  id: 'format-test-proj',
  title: 'Format Test Project',
  schemaVersion: 2,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  platform: 'instagram',
  formatId: 'r_4_5',
  orientation: 'portrait',
  theme: 'dark',
  primaryColor: '#0ea5e9',
  templateId: 'tech-mesh',
  contentType: 'carousel',
  textDir: 'ltr',
  pattern: { enabled: true, intensity: 0.5 },
  counter: {
    show: true,
    anchor: 'tr',
    style: 'number',
    format: 'nn/nn',
    hideOnFirst: false,
    hideOnLast: false,
  },
  signature: {
    show: true,
    anchor: 'bl',
    arrangement: 'inline',
    size: 'sm',
    photoShape: 'circle',
    showHandle: true,
    showSocials: false,
  },
  slides: [
    {
      id: 'slide-1',
      type: 'cover',
      fields: { title: { type: 'doc', blocks: [{ type: 'p', runs: [{ text: 'Slide 1' }] }] } },
      overrides: {
        square: {
          title: { dx: 10, dy: 15, scale: 1.2 },
        },
      },
    },
  ],
};

describe('ChangeFormatDialog & Per-Class Relayout (R7-3)', () => {
  beforeEach(() => {
    useProjectStore.setState({
      project: JSON.parse(JSON.stringify(testProject)),
      activeSlideId: 'slide-1',
    });
  });

  it('renders dialog with format options and per-class overrides notice', () => {
    const onClose = vi.fn();
    render(<ChangeFormatDialog isOpen={true} onClose={onClose} />);

    expect(screen.getByTestId('change-format-dialog')).toBeInTheDocument();
    expect(screen.getByText(/Each format aspect ratio maintains its own layout adjustments/i)).toBeInTheDocument();
  });

  it('shows reset layout checkbox when target format has overrides', () => {
    const onClose = vi.fn();
    render(<ChangeFormatDialog isOpen={true} onClose={onClose} />);

    // Select square format (r_1_1) which has overrides in slide-1
    const squareOption = screen.getByTestId('change-format-option-r_1_1');
    fireEvent.click(squareOption);

    const checkbox = screen.getByTestId('reset-layout-checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
    expect(screen.getByText(/This format has custom layout adjustments/i)).toBeInTheDocument();
  });

  it('resets layout overrides when reset layout checkbox is checked on apply', () => {
    const onClose = vi.fn();
    render(<ChangeFormatDialog isOpen={true} onClose={onClose} />);

    // Select square format (r_1_1)
    const squareOption = screen.getByTestId('change-format-option-r_1_1');
    fireEvent.click(squareOption);

    // Check reset layout
    const checkbox = screen.getByTestId('reset-layout-checkbox');
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    // Click apply
    const applyBtn = screen.getByTestId('apply-change-format-btn');
    fireEvent.click(applyBtn);

    expect(onClose).toHaveBeenCalled();
    const updatedProject = useProjectStore.getState().project;
    expect(updatedProject.formatId).toBe('r_1_1');
    // Overrides for square aspect should be cleared
    expect(updatedProject.slides[0]?.overrides?.square).toBeUndefined();
  });

  it('preserves layout overrides when reset layout checkbox is unchecked', () => {
    const onClose = vi.fn();
    render(<ChangeFormatDialog isOpen={true} onClose={onClose} />);

    // Select square format (r_1_1)
    const squareOption = screen.getByTestId('change-format-option-r_1_1');
    fireEvent.click(squareOption);

    // Apply without checking reset
    const applyBtn = screen.getByTestId('apply-change-format-btn');
    fireEvent.click(applyBtn);

    const updatedProject = useProjectStore.getState().project;
    expect(updatedProject.formatId).toBe('r_1_1');
    expect(updatedProject.slides[0]?.overrides?.square?.title).toBeDefined();
    expect(updatedProject.slides[0]?.overrides?.square?.title?.dx).toBe(10);
  });

  it('switches orientation for 16:9 format without content loss', () => {
    const onClose = vi.fn();
    render(<ChangeFormatDialog isOpen={true} onClose={onClose} />);

    // Select 16:9 format
    const r16Option = screen.getByTestId('change-format-option-r_16_9');
    fireEvent.click(r16Option);

    // Toggle to landscape
    const landscapeBtn = screen.getByTestId('change-orientation-landscape');
    fireEvent.click(landscapeBtn);

    const applyBtn = screen.getByTestId('apply-change-format-btn');
    fireEvent.click(applyBtn);

    const updatedProject = useProjectStore.getState().project;
    expect(updatedProject.formatId).toBe('r_16_9');
    expect(updatedProject.orientation).toBe('landscape');
    // Slide text content preserved
    expect(updatedProject.slides[0]?.fields.title).toBeDefined();
  });
});
