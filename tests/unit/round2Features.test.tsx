import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { useProjectStore, createDefaultProject } from '../../src/store/projectStore';
import { useSelectionStore } from '../../src/store/selectionStore';
import { EditorDesktop } from '../../src/ui/editor/EditorDesktop';
import { SlideRenderer } from '../../src/slides/SlideRenderer';
import { NETWORK_DARK_PALETTE } from '../../src/core/palette';
import { Footer } from '../../src/ui/common/Footer';
import { OWNER } from '../../src/config/site';

describe('Round 2 Fixes and Features', () => {
  beforeEach(() => {
    useProjectStore.getState().setProject(createDefaultProject());
    useSelectionStore.getState().selectElement(undefined);
  });

  describe('D0: Footer handle removed', () => {
    it('does not render @handle in footer', () => {
      render(<Footer />);
      expect(screen.getByTestId('app-footer')).toBeInTheDocument();
      expect(screen.getByTestId('footer-owner-link')).toHaveTextContent(OWNER.name);
      expect(screen.queryByText(`(${OWNER.handle})`)).not.toBeInTheDocument();
    });
  });

  describe('Properties panel migration', () => {
    it('opens properties panel on selection without redundant floating menu toggle', () => {
      render(<EditorDesktop />);
      const titleHit = screen.getByTestId('element-hit-title');
      fireEvent.click(titleHit);

      // Context toolbar and toggle are removed in favor of Properties panel
      expect(screen.queryByTestId('element-context-toolbar')).not.toBeInTheDocument();
      expect(screen.queryByTestId('element-menu-toggle')).not.toBeInTheDocument();

      // Properties panel is open in Inspector
      expect(screen.getByTestId('element-properties-panel')).toBeInTheDocument();
    });
  });

  describe('F1: Free text anywhere', () => {
    it('adds a free text extra element via Add Text button', () => {
      render(<EditorDesktop />);

      // Switch to Assets/Elements tab
      const elementsTab = screen.getByTestId('rail-tool-elements');
      fireEvent.click(elementsTab);

      const addTextBtn = screen.getByTestId('add-text-btn');
      expect(addTextBtn).toBeInTheDocument();
      fireEvent.click(addTextBtn);

      const slide = useProjectStore.getState().project.slides[0];
      const textExtra = slide?.extras?.find((e) => e.kind === 'text');
      expect(textExtra).toBeDefined();
      expect(textExtra?.kind).toBe('text');
    });
  });

  describe('F2: Opacity & rotation for all elements', () => {
    it('exposes opacity and rotation in properties panel for slot elements', () => {
      render(<EditorDesktop />);
      fireEvent.click(screen.getByTestId('element-hit-title'));

      const rotInput = screen.getByTestId('sidebar-rotation-input');
      expect(rotInput).toBeInTheDocument();
      act(() => fireEvent.change(rotInput, { target: { value: '45' } }));

      const opacityInput = screen.getByTestId('sidebar-opacity-input');
      expect(opacityInput).toBeInTheDocument();
      act(() => fireEvent.change(opacityInput, { target: { value: '80' } }));

      const override = useProjectStore.getState().project.slides[0]?.overrides?.portrait?.title;
      expect(override?.rotation).toBe(45);
      expect(override?.opacity).toBeCloseTo(0.8);
    });

    it('renders rotation and opacity on rendered slot DOM node', async () => {
      const slide = {
        ...useProjectStore.getState().project.slides[0]!,
        overrides: {
          portrait: {
            title: {
              dx: 0.1,
              dy: 0.1,
              scale: 1,
              rotation: 30,
              opacity: 0.75,
            },
          },
        },
      };

      const { container } = render(
        <SlideRenderer
          slide={slide}
          palette={NETWORK_DARK_PALETTE}
          aspectClass="portrait"
          dimensions={{ width: 1080, height: 1350 }}
        />
      );

      await waitFor(() => expect(container.querySelector('.slide-title-h1')).toBeTruthy());
      const titleNode = container.querySelector('.slide-title-h1') as HTMLElement;
      expect(titleNode).toBeTruthy();
      expect(titleNode.style.transform).toContain('rotate(30deg)');
      expect(titleNode.style.opacity).toBe('0.75');
    });
  });

  describe('F3: Background image / symbol', () => {
    it('renders custom slide background with mode and opacity', async () => {
      const slide = {
        ...useProjectStore.getState().project.slides[0]!,
        background: {
          symbolId: 'line-straight',
          symbolPack: 'shapes' as const,
          mode: 'repeat' as const,
          opacity: 0.5,
          tileSize: 80,
        },
      };

      const { container } = render(
        <SlideRenderer
          slide={slide}
          palette={NETWORK_DARK_PALETTE}
          aspectClass="portrait"
          dimensions={{ width: 1080, height: 1350 }}
        />
      );

      await waitFor(() => expect(container.querySelector('[data-testid="slide-custom-background"]')).toBeInTheDocument());
      const bgNode = container.querySelector('[data-testid="slide-custom-background"]') as HTMLElement;
      expect(bgNode).toBeInTheDocument();
      expect(bgNode.style.opacity).toBe('0.5');
      expect(bgNode.style.backgroundRepeat).toBe('repeat');
      expect(bgNode.style.backgroundSize).toBe('80px 80px');
    });
  });
});
