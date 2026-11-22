import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PasteSlidesDialog } from '../../src/ui/editor/PasteSlidesDialog';
import { useProjectStore } from '../../src/store/projectStore';

describe('PasteSlidesDialog UI Component (Spec §8.3 & Plan §4)', () => {
  beforeEach(() => {
    useProjectStore.getState().createProject({
      title: 'Test Project',
      slides: [
        {
          id: 'initial_slide_1',
          type: 'cover',
          fields: { title: 'Initial Slide' },
        },
      ],
    });
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(<PasteSlidesDialog isOpen={false} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders modal dialog and textarea when isOpen is true', () => {
    render(<PasteSlidesDialog isOpen={true} onClose={() => {}} />);
    expect(screen.getByTestId('paste-slides-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('paste-textarea')).toBeInTheDocument();
    expect(screen.getByTestId('paste-empty-preview')).toBeInTheDocument();
    expect(screen.getByTestId('paste-apply-btn')).toBeDisabled();
  });

  it('dynamically parses text and renders preview items', () => {
    render(<PasteSlidesDialog isOpen={true} onClose={() => {}} />);
    const textarea = screen.getByTestId('paste-textarea');

    fireEvent.change(textarea, {
      target: {
        value: `Slide One Title\nFirst slide subtitle\n---\nSlide Two Title\n- Bullet A\n- Bullet B`,
      },
    });

    expect(screen.getByTestId('paste-preview-list')).toBeInTheDocument();
    expect(screen.getByTestId('paste-candidate-0')).toBeInTheDocument();
    expect(screen.getByTestId('paste-candidate-1')).toBeInTheDocument();

    const applyBtn = screen.getByTestId('paste-apply-btn');
    expect(applyBtn).not.toBeDisabled();
    expect(applyBtn.textContent).toContain('2');
  });

  it('allows overriding slide type from dropdown selector', () => {
    render(<PasteSlidesDialog isOpen={true} onClose={() => {}} />);
    const textarea = screen.getByTestId('paste-textarea');

    fireEvent.change(textarea, {
      target: {
        value: `Slide One\nSubtitle\n---\nSlide Two\nText`,
      },
    });

    const select0 = screen.getByTestId('paste-type-select-0') as HTMLSelectElement;
    expect(select0.value).toBe('cover');

    // Change to code
    fireEvent.change(select0, { target: { value: 'code' } });
    expect(select0.value).toBe('code');
  });

  it('appends slides to existing project when mode is append', () => {
    const onClose = vi.fn();
    render(<PasteSlidesDialog isOpen={true} onClose={onClose} />);
    const textarea = screen.getByTestId('paste-textarea');

    fireEvent.change(textarea, {
      target: {
        value: `New Slide 1\nDetails\n---\nNew Slide 2\nDetails`,
      },
    });

    // Default mode is append
    const applyBtn = screen.getByTestId('paste-apply-btn');
    fireEvent.click(applyBtn);

    const slides = useProjectStore.getState().project.slides;
    // Initial 1 slide + 2 appended slides = 3 slides
    expect(slides.length).toBe(3);
    expect(slides[0]?.fields.title).toBe('Initial Slide');
    expect(slides[1]?.fields.title).toBe('New Slide 1');
    expect(slides[2]?.fields.title).toBe('New Slide 2');
    expect(onClose).toHaveBeenCalled();
  });

  it('replaces all slides in project when mode is replace', () => {
    const onClose = vi.fn();
    render(<PasteSlidesDialog isOpen={true} onClose={onClose} />);
    const textarea = screen.getByTestId('paste-textarea');

    fireEvent.change(textarea, {
      target: {
        value: `Replaced Slide 1\nDetails\n---\nReplaced Slide 2\nDetails`,
      },
    });

    // Switch mode to replace
    const replaceRadio = screen.getByDisplayValue('replace');
    fireEvent.click(replaceRadio);

    const applyBtn = screen.getByTestId('paste-apply-btn');
    fireEvent.click(applyBtn);

    const slides = useProjectStore.getState().project.slides;
    // Exactly 2 replaced slides
    expect(slides.length).toBe(2);
    expect(slides[0]?.fields.title).toBe('Replaced Slide 1');
    expect(slides[1]?.fields.title).toBe('Replaced Slide 2');
    expect(onClose).toHaveBeenCalled();
  });

  it('closes on escape key or cancel button', () => {
    const onClose = vi.fn();
    render(<PasteSlidesDialog isOpen={true} onClose={onClose} />);

    // Cancel button
    fireEvent.click(screen.getByTestId('paste-cancel-btn'));
    expect(onClose).toHaveBeenCalledTimes(1);

    // Escape key
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
