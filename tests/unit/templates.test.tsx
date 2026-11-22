import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { getTemplate, getAllTemplates, TEMPLATES } from '../../src/templates';
import { NetworkBackground } from '../../src/templates/NetworkBackground';
import { SlideRenderer } from '../../src/slides/SlideRenderer';
import { generatePalette } from '../../src/core/palette';
import type { Slide } from '../../src/core/schema';

describe('Template System Registry & Network Template (Spec §7, §7.1)', () => {
  it('registers Network, Clean, and Bold templates', () => {
    expect(TEMPLATES.network).toBeDefined();
    expect(TEMPLATES.clean).toBeDefined();
    expect(TEMPLATES.bold).toBeDefined();

    const all = getAllTemplates();
    expect(all.length).toBe(3);
    expect(all.map((t) => t.id)).toEqual(['network', 'clean', 'bold']);
  });

  it('getTemplate returns requested template or falls back to network', () => {
    expect(getTemplate('network').id).toBe('network');
    expect(getTemplate('clean').id).toBe('clean');
    expect(getTemplate('bold').id).toBe('bold');
    // @ts-expect-error test fallback
    expect(getTemplate('unknown').id).toBe('network');
  });

  it('Network template has required typography and token configurations', () => {
    const network = getTemplate('network');
    expect(network.fonts.display).toContain('IBM Plex Sans');
    expect(network.fonts.mono).toContain('JetBrains Mono');
    expect(network.typeScale.h1).toBe(112);
    expect(network.typeScale.h2).toBe(76);
    expect(network.typeScale.body).toBe(44);
    expect(network.radius.card).toBe(24);
    expect(network.radius.chip).toBe(9999);
  });

  it('NetworkBackground renders SVG with continuous viewBox for given slide index', () => {
    const palette = generatePalette('#35D0E6', 'dark');

    // Slide 1 of 5 (index = 1, width = 1080)
    render(
      <NetworkBackground
        index={1}
        count={5}
        width={1080}
        height={1350}
        tokens={palette}
      />
    );

    const svg = screen.getByTestId('network-bg-svg');
    expect(svg).toBeInTheDocument();
    // viewBox for slide index 1 should start at x = 1080
    expect(svg).toHaveAttribute('viewBox', '1080 0 1080 1350');
    expect(svg).toHaveAttribute('data-slide-index', '1');
    expect(svg).toHaveAttribute('data-slide-count', '5');

    // Verify SVG contains lines and nodes
    const lines = svg.querySelectorAll('line');
    const accentNodes = svg.querySelectorAll('.network-accent-node');
    const regularNodes = svg.querySelectorAll('.network-regular-node');

    expect(lines.length).toBeGreaterThan(0);
    expect(accentNodes.length).toBeGreaterThan(0);
    expect(regularNodes.length).toBeGreaterThan(0);
  });

  it('SlideRenderer integrates Network template background', () => {
    const palette = generatePalette('#0A84FF', 'dark');
    const slide: Slide = {
      id: 's_templ_test',
      type: 'explain',
      fields: { title: 'Template Integration Test', body: 'Testing template background.' },
    };

    render(
      <SlideRenderer
        slide={slide}
        palette={palette}
        aspectClass="portrait"
        slideIndex={2}
        totalSlides={6}
        templateId="network"
      />
    );

    const bgSvg = screen.getByTestId('network-bg-svg');
    expect(bgSvg).toBeInTheDocument();
    // Slide index 2 in 1080x1350 has viewBox starting at 2160
    expect(bgSvg).toHaveAttribute('viewBox', '2160 0 1080 1350');
  });
});
