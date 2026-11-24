import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OnboardingModal } from '../../src/ui/common/OnboardingModal';
import { ShortcutsOverlay } from '../../src/ui/common/ShortcutsOverlay';
import { EmptyIllustration } from '../../src/ui/common/EmptyIllustration';

describe('R8-6 Onboarding, Shortcuts, and Empty States', () => {
  it('renders OnboardingModal with steps, allows navigating and skipping', () => {
    const handleClose = vi.fn();
    const handleComplete = vi.fn();

    const { rerender } = render(
      <OnboardingModal isOpen={true} onClose={handleClose} onComplete={handleComplete} />
    );

    expect(screen.getByTestId('onboarding-modal')).toBeInTheDocument();
    expect(screen.getByTestId('onboarding-next-btn')).toBeInTheDocument();
    expect(screen.getByTestId('onboarding-skip-btn')).toBeInTheDocument();

    // Advance through steps
    fireEvent.click(screen.getByTestId('onboarding-next-btn'));
    fireEvent.click(screen.getByTestId('onboarding-next-btn'));
    fireEvent.click(screen.getByTestId('onboarding-next-btn'));

    // Step 4 is last -> click gets started
    fireEvent.click(screen.getByTestId('onboarding-next-btn'));
    expect(handleComplete).toHaveBeenCalled();
    expect(handleClose).toHaveBeenCalled();

    // Rerender closed
    rerender(<OnboardingModal isOpen={false} onClose={handleClose} onComplete={handleComplete} />);
    expect(screen.queryByTestId('onboarding-modal')).not.toBeInTheDocument();
  });

  it('renders ShortcutsOverlay with categorized keybindings and handles close', () => {
    const handleClose = vi.fn();
    render(<ShortcutsOverlay isOpen={true} onClose={handleClose} />);

    expect(screen.getByTestId('shortcuts-overlay')).toBeInTheDocument();
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('shortcuts-close-btn'));
    expect(handleClose).toHaveBeenCalled();
  });

  it('renders EmptyIllustration with different variants', () => {
    const { container: c1 } = render(<EmptyIllustration variant="empty" />);
    expect(c1.querySelector('svg')).toBeInTheDocument();

    const { container: c2 } = render(<EmptyIllustration variant="search" />);
    expect(c2.querySelector('svg')).toBeInTheDocument();

    const { container: c3 } = render(<EmptyIllustration variant="error" />);
    expect(c3.querySelector('svg')).toBeInTheDocument();
  });
});
