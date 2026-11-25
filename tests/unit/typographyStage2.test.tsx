import { render, waitFor } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TextStyleOverrideSchema, ExtraElementSchema } from '../../src/core/schema';
import { textStyleToCss } from '../../src/core/textStyle';
import { FONT_REGISTRY } from '../../src/fonts/registry';
import { ExtrasRenderer } from '../../src/slides/ExtrasRenderer';
import { SlideRenderer } from '../../src/slides/SlideRenderer';
import { createDefaultProject } from '../../src/store/projectStore';
import { generatePalette } from '../../src/core/palette';
import { loadTemplateProjectSnapshot } from '../../src/templates/projectSnapshot';

describe('Stage 2 typography', () => {
  it('validates bounded typography values and rejects unsupported face styles', () => {
    expect(TextStyleOverrideSchema.safeParse({ font: 'ibm-plex-serif', size: 42, weight: 600, italic: true, letterSpacing: 0.2, lineHeight: 1.3, color: '#aabbcc' }).success).toBe(true);
    expect(TextStyleOverrideSchema.safeParse({ font: 'anton', italic: true }).success).toBe(false);
    expect(TextStyleOverrideSchema.safeParse({ size: 241 }).success).toBe(false);
    expect(TextStyleOverrideSchema.safeParse({ font: 'ibm-plex-serif', color: 'url(x)' }).success).toBe(false);
    expect(ExtraElementSchema.safeParse({ id: 'x', kind: 'shape', x: 0, y: 0, w: 0.4, h: 0.2, rotation: 0, z: 0, locked: false, textStyle: { size: 20 } }).success).toBe(false);
  });

  it('maps only validated style fields and leaves reset as inherited CSS', () => {
    expect(textStyleToCss(undefined)).toEqual({});
    expect(textStyleToCss({ font: 'ibm-plex-serif', weight: 600, italic: true, size: 44, letterSpacing: 0.3, lineHeight: 1.4, color: '#123456' })).toMatchObject({ fontFamily: 'IBM Plex Serif', fontWeight: 600, fontStyle: 'italic', fontSize: '44px', letterSpacing: '0.3px', lineHeight: 1.4, color: '#123456' });
    expect(FONT_REGISTRY.anton.styles).toEqual(['normal']);
  });

  it('keeps run marks as independent inline overrides inside styled text extras', () => {
    const html = renderToStaticMarkup(<ExtrasRenderer extras={[{
      id: 'copy', kind: 'text', x: 0, y: 0, w: 0.5, h: 0.3, rotation: 0, z: 0, locked: false,
      textStyle: { font: 'ibm-plex-serif', weight: 600, size: 44, color: '#123456' },
      text: { type: 'doc', blocks: [{ type: 'p', runs: [{ text: 'Hello', marks: { color: '#ff0000', bold: true } }] }] },
    }]} />);
    expect(html).toContain('font-family:IBM Plex Serif');
    expect(html).toContain('font-weight:600');
    expect(html).toContain('color:#123456');
    expect(html).toContain('color:#ff0000');
    expect(html).toContain('min-width:0');
  });

  it('applies template slot style overrides to the real text node and restores inheritance when removed', async () => {
    const project = createDefaultProject({ templateId: 'tech-mesh' });
    const original = project.slides[0]!;
    const snapshot = await loadTemplateProjectSnapshot('tech-mesh', project.primaryColor);
    const styled = { ...original, overrides: { ...original.overrides, portrait: { ...(original.overrides?.portrait ?? {}), title: { dx: 0, dy: 0, scale: 1, textStyle: { font: 'ibm-plex-serif' as const, size: 50, weight: 600 as const, italic: true, color: '#123456' } } } } };
    const props = { slide: styled, palette: generatePalette(project.primaryColor, project.theme), aspectClass: 'portrait' as const, textDir: 'ltr' as const, templateSnapshot: snapshot, templateId: 'tech-mesh' };
    const view = render(<SlideRenderer {...props} />);
    const title = await waitFor(() => {
      const node = view.container.querySelector<HTMLElement>('.slide-title-h1, .slide-title-h2');
      if (!node || node.style.fontFamily !== 'IBM Plex Serif') throw new Error('slot typography not yet applied');
      return node;
    });
    expect(title.style.fontSize).toBe('50px');
    expect(title.style.fontWeight).toBe('600');
    expect(title.style.fontStyle).toBe('italic');
    expect(title.style.color).toBe('rgb(18, 52, 86)');
    view.rerender(<SlideRenderer {...props} slide={{ ...original, overrides: { ...original.overrides, portrait: { ...(original.overrides?.portrait ?? {}) } } }} />);
    await waitFor(() => expect(title.style.fontFamily).toBe(''));
    expect(title.style.fontSize).toBe('');
  });
});
