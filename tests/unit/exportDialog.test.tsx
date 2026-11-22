import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExportDialog } from '../../src/ui/editor/ExportDialog';
import { useProjectStore } from '../../src/store/projectStore';

describe('ExportDialog UI Component (Spec §9 & Plan §4)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useProjectStore.getState().createProject({
      title: 'Full Stack Architecture',
      formatId: 'r_4_5',
      slides: [
        {
          id: 'slide_1',
          type: 'cover',
          fields: { title: 'Cover Slide', sub: 'Subtitle' },
        },
        {
          id: 'slide_2',
          type: 'explain',
          fields: { title: 'Concept One', body: '- Point 1\n- Point 2' },
        },
      ],
    });
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(<ExportDialog isOpen={false} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders modal dialog with format and range options when isOpen is true', () => {
    render(<ExportDialog isOpen={true} onClose={() => {}} />);
    expect(screen.getByTestId('export-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('export-format-png')).toBeInTheDocument();
    expect(screen.getByTestId('export-format-zip')).toBeInTheDocument();
    expect(screen.getByTestId('export-format-pdf')).toBeInTheDocument();
    expect(screen.getByTestId('export-range-all')).toBeInTheDocument();
    expect(screen.getByTestId('export-range-current')).toBeInTheDocument();
    expect(screen.getByTestId('export-start-btn')).toBeInTheDocument();
  });

  it('adjusts default range when switching formats', () => {
    render(<ExportDialog isOpen={true} onClose={() => {}} />);

    // Switch to single PNG
    fireEvent.click(screen.getByTestId('export-format-png'));
    const currentRadio = screen.getByDisplayValue('current') as HTMLInputElement;
    expect(currentRadio.checked).toBe(true);

    // Switch to ZIP
    fireEvent.click(screen.getByTestId('export-format-zip'));
    const allRadio = screen.getByDisplayValue('all') as HTMLInputElement;
    expect(allRadio.checked).toBe(true);
  });

  it('closes on cancel button click or Escape key', () => {
    const onClose = vi.fn();
    render(<ExportDialog isOpen={true} onClose={onClose} />);

    // Click cancel
    fireEvent.click(screen.getByTestId('export-cancel-btn'));
    expect(onClose).toHaveBeenCalledTimes(1);

    // Press Escape
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
