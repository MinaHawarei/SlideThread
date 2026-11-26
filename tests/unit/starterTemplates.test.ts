import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { generatePalette, getContrastRatio } from '../../src/core/palette';
import { getLayoutArchetype } from '../../src/templates/layouts/registry';
import { loadStarterTemplate, STARTER_TEMPLATE_IDS } from '../../src/templates/starters';
import { resolveTemplatePalette } from '../../src/templates/schema';
import { SlideRenderer } from '../../src/slides/SlideRenderer';
import { SAMPLE_SLIDES } from '../../src/slides/sampleSlides';

describe('built-in template manifests', () => {
  it('lazy loads all validated templates with local categories, complete layouts, and usable palettes', async () => {
    const templates = await Promise.all(STARTER_TEMPLATE_IDS.map((id) => loadStarterTemplate(id)));
    expect(templates.map((template) => template.id)).toEqual(STARTER_TEMPLATE_IDS);

    for (const template of templates) {
      expect(template.name.en).toBeTruthy();
      expect(template.name.ar).toBeTruthy();
      expect(template.license).toBe('MIT');
      expect(template.layouts).toHaveProperty('cover');
      expect(template.layouts).toHaveProperty('cta');
      for (const [slideType, layoutId] of Object.entries(template.layouts)) {
        expect(getLayoutArchetype(layoutId)?.slideType).toBe(slideType);
      }

      for (const mode of ['dark', 'light'] as const) {
        const palette = resolveTemplatePalette(template, mode, '#A14DCC');
        expect(getContrastRatio(palette.ink, palette.bg)).toBeGreaterThanOrEqual(7);
        expect(getContrastRatio(palette.mute, palette.bg)).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('uses the required categories and pattern capabilities', async () => {
    const templates = await Promise.all(STARTER_TEMPLATE_IDS.map((id) => loadStarterTemplate(id)));
    const byId = new Map(templates.map((template) => [template.id, template]));
    expect(byId.get('tech-mesh')?.name).toEqual({ en: 'Weave', ar: 'نسيج' });
    expect(byId.get('tech-mesh')?.decor?.background?.id).toBe('mesh');
    expect(byId.get('clean-minimal')?.categories).toEqual(['personal-brand', 'general']);
    expect(byId.get('clean-minimal')?.decor?.background?.id).toBe('none');
    expect(byId.get('clean-minimal')?.counter?.defaultStyle).toBe('bar');
    expect(byId.get('bold-marketing')?.categories).toEqual(['marketing']);
    expect(byId.get('bold-marketing')?.colorFlexible).toBe(true);
    expect(byId.get('soft-gradient')?.decor?.background?.id).toBe('blobs');
    expect(byId.get('heritage-geometric')?.decor?.background?.id).toBe('geometric');
    expect(byId.get('heritage-geometric')?.colorFlexible).toBe(false);
  });

  it('keeps Bold campaign surfaces fixed while allowing its accent to follow the creator color', async () => {
    const bold = await loadStarterTemplate('bold-marketing');
    const coral = resolveTemplatePalette(bold, 'dark', '#E25252');
    const teal = resolveTemplatePalette(bold, 'dark', '#008A9A');
    expect(coral.bg).toBe(teal.bg);
    expect(coral.ink).toBe(teal.ink);
    expect(coral.acc).not.toBe(teal.acc);

    const rendered = render(React.createElement(SlideRenderer, {
      slide: SAMPLE_SLIDES.cover_en!,
      palette: generatePalette('#E25252', 'dark'),
      aspectClass: 'portrait',
      templateId: 'bold-marketing',
      themeMode: 'dark',
    }));
    await waitFor(() => expect(rendered.container.querySelector('.template-bold')).not.toBeNull());
    const canvas = rendered.container.querySelector('.slide-canvas') as HTMLElement;
    expect(canvas.style.getPropertyValue('--bg')).toBe(coral.bg);
    expect(canvas.style.getPropertyValue('--acc')).toBe(coral.acc);
  });

  it('keeps each committed preview within the 40 KB v1 asset budget', async () => {
    for (const id of STARTER_TEMPLATE_IDS) {
      const previewPath = resolve(process.cwd(), `src/templates/starters/${id}/preview.webp`);
      const preview = await readFile(previewPath);
      expect(preview.byteLength, `${id} preview is at most 40 KB`).toBeLessThanOrEqual(40 * 1024);
    }
  });
});
