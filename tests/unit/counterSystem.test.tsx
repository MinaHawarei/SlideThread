import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SlideCounter } from '../../src/slides/SlideCounter';
import { formatSlideCounterValue } from '../../src/slides/counterUtils';
import { SlideRenderer } from '../../src/slides/SlideRenderer';
import { DesignInspector } from '../../src/ui/editor/DesignInspector';
import { useProjectStore } from '../../src/store/projectStore';
import { useSettingsStore, DEFAULT_BRAND_SETTINGS } from '../../src/store/settingsStore';
import { generatePalette } from '../../src/core/palette';
import {
  DEFAULT_COUNTER_CONFIG,
  DEFAULT_SIGNATURE_CONFIG,
  type CounterConfig,
  type Anchor,
  type Slide,
  plainTextFieldsToRichText,
} from '../../src/core/schema';

describe('Counter System (Spec §5.4 & Revision Plan §3.6)', () => {
  const mockPalette = generatePalette('#0A84FF', 'dark');

  describe('formatSlideCounterValue', () => {
    it('formats as nn/nn with 2-digit padding', () => {
      expect(formatSlideCounterValue(0, 5, 'nn/nn')).toBe('01/05');
      expect(formatSlideCounterValue(4, 5, 'nn/nn')).toBe('05/05');
      expect(formatSlideCounterValue(9, 12, 'nn/nn')).toBe('10/12');
    });

    it('formats as n (simple integer)', () => {
      expect(formatSlideCounterValue(0, 5, 'n')).toBe('1');
      expect(formatSlideCounterValue(3, 5, 'n')).toBe('4');
    });

    it('formats as n/nn (ratio)', () => {
      expect(formatSlideCounterValue(0, 5, 'n/nn')).toBe('1 / 5');
      expect(formatSlideCounterValue(2, 10, 'n/nn')).toBe('3 / 10');
    });
  });

  describe('SlideCounter Component Rendering', () => {
    it('renders null when counterConfig.show is false', () => {
      const config: CounterConfig = { ...DEFAULT_COUNTER_CONFIG, show: false };
      const { container } = render(
        <SlideCounter counterConfig={config} slideIndex={1} totalSlides={5} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders null when totalSlides <= 1', () => {
      const { container } = render(
        <SlideCounter counterConfig={DEFAULT_COUNTER_CONFIG} slideIndex={0} totalSlides={1} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('respects hideOnFirst: hides on index 0, renders on index 1', () => {
      const config: CounterConfig = { ...DEFAULT_COUNTER_CONFIG, hideOnFirst: true };
      const { rerender, container } = render(
        <SlideCounter counterConfig={config} slideIndex={0} totalSlides={4} />
      );
      expect(container.firstChild).toBeNull();

      rerender(<SlideCounter counterConfig={config} slideIndex={1} totalSlides={4} />);
      expect(screen.getByTestId('slide-counter')).toBeInTheDocument();
      expect(screen.getByTestId('slide-counter')).toHaveTextContent('02/04');
    });

    it('respects hideOnLast: hides on index totalSlides - 1, renders on index 0', () => {
      const config: CounterConfig = { ...DEFAULT_COUNTER_CONFIG, hideOnLast: true };
      const { rerender, container } = render(
        <SlideCounter counterConfig={config} slideIndex={3} totalSlides={4} />
      );
      expect(container.firstChild).toBeNull();

      rerender(<SlideCounter counterConfig={config} slideIndex={2} totalSlides={4} />);
      expect(screen.getByTestId('slide-counter')).toBeInTheDocument();
      expect(screen.getByTestId('slide-counter')).toHaveTextContent('03/04');
    });

    describe('6 Physical Anchors', () => {
      const anchors: Anchor[] = ['tl', 'tc', 'tr', 'bl', 'bc', 'br'];

      anchors.forEach((anchor) => {
        it(`renders at anchor "${anchor}" with correct physical coordinates`, () => {
          const config: CounterConfig = { ...DEFAULT_COUNTER_CONFIG, anchor };
          render(
            <SlideCounter
              counterConfig={config}
              slideIndex={1}
              totalSlides={5}
              isSignatureVisible={false}
            />
          );

          const el = screen.getByTestId('slide-counter').closest('.slide-counter-container');
          expect(el).toBeInTheDocument();
          expect(el).toHaveAttribute('data-anchor', anchor);

          const style = (el as HTMLElement).style;
          if (anchor.startsWith('t')) {
            expect(style.top).toBe('40px');
          } else {
            expect(style.bottom).toBe('40px');
          }

          if (anchor.endsWith('l')) {
            expect(style.left).toBe('48px');
          } else if (anchor.endsWith('r')) {
            expect(style.right).toBe('48px');
          } else {
            expect(style.left).toBe('50%');
          }
        });
      });
    });

    describe('3 Styles: number, bar, dots', () => {
      it('renders number style with format variants', () => {
        render(
          <SlideCounter
            counterConfig={{ ...DEFAULT_COUNTER_CONFIG, style: 'number', format: 'n/nn' }}
            slideIndex={2}
            totalSlides={6}
          />
        );
        const counter = screen.getByTestId('slide-counter');
        expect(counter).toHaveAttribute('data-style', 'number');
        expect(counter).toHaveTextContent('3 / 6');
        expect(counter).toHaveAttribute('dir', 'ltr');
      });

      it('renders bar style with progressbar semantics and fill percentage', () => {
        render(
          <SlideCounter
            counterConfig={{ ...DEFAULT_COUNTER_CONFIG, style: 'bar' }}
            slideIndex={1}
            totalSlides={4}
          />
        );
        const bar = screen.getByTestId('slide-counter');
        expect(bar).toHaveAttribute('data-style', 'bar');
        expect(bar).toHaveAttribute('role', 'progressbar');
        expect(bar).toHaveAttribute('aria-valuenow', '2');
        expect(bar).toHaveAttribute('aria-valuemax', '4');

        const fill = bar.querySelector('.slide-counter-bar-fill');
        expect(fill).toBeInTheDocument();
        // 2 of 4 = 50%
        expect((fill as HTMLElement).style.width).toBe('50%');
      });

      it('renders dots style with correct active dot index', () => {
        render(
          <SlideCounter
            counterConfig={{ ...DEFAULT_COUNTER_CONFIG, style: 'dots' }}
            slideIndex={2}
            totalSlides={5}
          />
        );
        const dotsContainer = screen.getByTestId('slide-counter');
        expect(dotsContainer).toHaveAttribute('data-style', 'dots');
        const dots = dotsContainer.querySelectorAll('.slide-counter-dot');
        expect(dots).toHaveLength(5);
        expect(dots[2]).toHaveClass('slide-counter-dot-active');
        expect(dots[0]).not.toHaveClass('slide-counter-dot-active');
      });
    });

    describe('Collision Handling (§5.4)', () => {
      it('offsets counter when signature shares the same anchor', () => {
        render(
          <SlideCounter
            counterConfig={{ ...DEFAULT_COUNTER_CONFIG, anchor: 'br' }}
            slideIndex={0}
            totalSlides={4}
            signatureAnchor="br"
            isSignatureVisible={true}
          />
        );

        const container = screen.getByTestId('slide-counter').closest('.slide-counter-container');
        expect(container).toHaveAttribute('data-collision', 'true');
        expect((container as HTMLElement).style.bottom).toBe('124px');
      });

      it('does not offset when signature is hidden or uses a different anchor', () => {
        const { rerender } = render(
          <SlideCounter
            counterConfig={{ ...DEFAULT_COUNTER_CONFIG, anchor: 'br' }}
            slideIndex={0}
            totalSlides={4}
            signatureAnchor="bl"
            isSignatureVisible={true}
          />
        );

        let container = screen.getByTestId('slide-counter').closest('.slide-counter-container');
        expect(container).not.toHaveAttribute('data-collision');
        expect((container as HTMLElement).style.bottom).toBe('40px');

        rerender(
          <SlideCounter
            counterConfig={{ ...DEFAULT_COUNTER_CONFIG, anchor: 'br' }}
            slideIndex={0}
            totalSlides={4}
            signatureAnchor="br"
            isSignatureVisible={false}
          />
        );
        container = screen.getByTestId('slide-counter').closest('.slide-counter-container');
        expect(container).not.toHaveAttribute('data-collision');
        expect((container as HTMLElement).style.bottom).toBe('40px');
      });
    });

    describe('RTL Behavior', () => {
      it('enforces physical LTR for numbers and anchors regardless of textDir', () => {
        render(
          <SlideCounter
            counterConfig={{ ...DEFAULT_COUNTER_CONFIG, anchor: 'tr', style: 'number' }}
            slideIndex={0}
            totalSlides={5}
            textDir="rtl"
          />
        );

        const container = screen.getByTestId('slide-counter').closest('.slide-counter-container');
        expect(container).toHaveAttribute('dir', 'ltr');
        expect((container as HTMLElement).style.right).toBe('48px');

        const numberBadge = screen.getByTestId('slide-counter');
        expect(numberBadge).toHaveAttribute('dir', 'ltr');
      });
    });
  });

  describe('DesignInspector Controls Integration', () => {
    beforeEach(() => {
      useProjectStore.getState().createProject({
        templateId: 'tech-mesh',
        counter: { ...DEFAULT_COUNTER_CONFIG, show: true, anchor: 'br', style: 'number' },
        signature: { ...DEFAULT_SIGNATURE_CONFIG, show: true, anchor: 'br' },
      });
      useSettingsStore.getState().updateSettings({
        ...DEFAULT_BRAND_SETTINGS,
        showSignature: true,
      });
    });

    it('toggles counter visibility via counter-toggle', () => {
      render(<DesignInspector />);
      const toggle = screen.getByTestId('counter-toggle') as HTMLInputElement;
      expect(toggle.checked).toBe(true);

      fireEvent.click(toggle);
      expect(useProjectStore.getState().project.counter?.show).toBe(false);

      fireEvent.click(toggle);
      expect(useProjectStore.getState().project.counter?.show).toBe(true);
    });

    it('changes anchor when clicking anchor buttons', () => {
      render(<DesignInspector />);
      const anchorTlBtn = screen.getByTestId('counter-anchor-tl');
      fireEvent.click(anchorTlBtn);
      expect(useProjectStore.getState().project.counter?.anchor).toBe('tl');

      const anchorBcBtn = screen.getByTestId('counter-anchor-bc');
      fireEvent.click(anchorBcBtn);
      expect(useProjectStore.getState().project.counter?.anchor).toBe('bc');
    });

    it('changes style and format', () => {
      render(<DesignInspector />);
      const dotsBtn = screen.getByTestId('counter-style-dots');
      fireEvent.click(dotsBtn);
      expect(useProjectStore.getState().project.counter?.style).toBe('dots');

      const numberBtn = screen.getByTestId('counter-style-number');
      fireEvent.click(numberBtn);
      expect(useProjectStore.getState().project.counter?.style).toBe('number');

      const formatBtn = screen.getByTestId('counter-format-n/nn');
      fireEvent.click(formatBtn);
      expect(useProjectStore.getState().project.counter?.format).toBe('n/nn');
    });

    it('toggles hideOnFirst and hideOnLast', () => {
      render(<DesignInspector />);
      const hideFirst = screen.getByTestId('counter-hide-first') as HTMLInputElement;
      expect(hideFirst.checked).toBe(false);
      fireEvent.click(hideFirst);
      expect(useProjectStore.getState().project.counter?.hideOnFirst).toBe(true);

      const hideLast = screen.getByTestId('counter-hide-last') as HTMLInputElement;
      expect(hideLast.checked).toBe(false);
      fireEvent.click(hideLast);
      expect(useProjectStore.getState().project.counter?.hideOnLast).toBe(true);
    });

    it('shows collision warning when counter and signature share the same anchor', () => {
      render(<DesignInspector />);
      // Both are 'br'
      expect(screen.getByTestId('counter-collision-warning')).toBeInTheDocument();

      // Shift counter to 'tl'
      fireEvent.click(screen.getByTestId('counter-anchor-tl'));
      expect(screen.queryByTestId('counter-collision-warning')).not.toBeInTheDocument();
    });

    it('restricts style options based on template declared counter styles', () => {
      // clean-minimal only allows 'bar'
      useProjectStore.getState().updateProjectMeta({ templateId: 'clean-minimal' });
      render(<DesignInspector />);

      expect(screen.getByTestId('counter-style-bar')).toBeInTheDocument();
      expect(screen.queryByTestId('counter-style-number')).not.toBeInTheDocument();
      expect(screen.queryByTestId('counter-style-dots')).not.toBeInTheDocument();
      // Auto-fallback: style reset to 'bar'
      expect(useProjectStore.getState().project.counter?.style).toBe('bar');
    });
  });

  describe('SlideRenderer with Counter Integration', () => {
    it('renders SlideCounter inside SlideRenderer and suppresses double counter in SignatureBar', async () => {
      const slide: Slide = {
        id: 's_test_1',
        type: 'explain',
        fields: plainTextFieldsToRichText({ title: 'Explain title', body: 'Explain body' }),
      };

      render(
        <SlideRenderer
          slide={slide}
          palette={mockPalette}
          aspectClass="square"
          brand={{ ...DEFAULT_BRAND_SETTINGS, showSignature: true }}
          slideIndex={1}
          totalSlides={5}
          counterConfig={{
            ...DEFAULT_COUNTER_CONFIG,
            show: true,
            anchor: 'tr',
            style: 'number',
            format: 'nn/nn',
          }}
        />
      );

      // Only 1 slide-counter element in the DOM
      const counters = await screen.findAllByTestId('slide-counter');
      expect(counters).toHaveLength(1);
      expect(counters[0]).toHaveTextContent('02/05');
      const container = counters[0]?.closest('.slide-counter-container');
      expect(container).toHaveAttribute('data-anchor', 'tr');
    });
  });
});
