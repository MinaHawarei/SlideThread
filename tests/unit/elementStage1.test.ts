import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ExtraElementSchema } from '../../src/core/schema';
import { resizeElementGeometryFromHandle, type ResizeHandle } from '../../src/core/elementModel';
import { buildExtraImageFilter } from '../../src/core/extraStyles';
import { ExtrasRenderer } from '../../src/slides/ExtrasRenderer';

const legacy = { id: 'legacy', kind: 'image' as const, x: 0.1, y: 0.2, w: 0.3, h: 0.2, rotation: 0, z: 0, locked: false };

describe('Stage 1 extra fields', () => {
  it('keeps legacy extras valid and accepts bounded options', () => {
    expect(ExtraElementSchema.parse(legacy)).toEqual(legacy);
    expect(ExtraElementSchema.safeParse({ ...legacy, cornerRadius: 12, strokeWidth: 4, strokeColor: '#123456', strokeStyle: 'dashed', filters: { grayscale: 50 } }).success).toBe(true);
    expect(ExtraElementSchema.safeParse({ ...legacy, filters: { blur: 21 } }).success).toBe(false);
  });

  it('builds image filters in fixed order and omits absent defaults', () => {
    expect(buildExtraImageFilter(undefined)).toBeUndefined();
    expect(buildExtraImageFilter({ brightness: 80, grayscale: 20 })).toBe('brightness(80%) contrast(100%) saturate(100%) grayscale(20%) blur(0px)');
  });

  it('renders legacy rectangle radius unchanged and arrow stroke without scaling', () => {
    const rectangle = { ...legacy, kind: 'shape' as const, shape: 'rectangle' as const, x: 0, y: 0, w: 0.2, h: 0.2 };
    expect(renderToStaticMarkup(React.createElement(ExtrasRenderer, { extras: [rectangle] }))).toContain('border-radius:var(--card-radius, 8px)');
    expect(renderToStaticMarkup(React.createElement(ExtrasRenderer, { extras: [{ ...rectangle, cornerRadius: 12 }] }))).toContain('border-radius:12px');
    const arrow = renderToStaticMarkup(React.createElement(ExtrasRenderer, { extras: [{ ...rectangle, shape: 'arrow', strokeColor: '#ff0000', strokeWidth: 3 }] }));
    expect(arrow).toContain('vector-effect="non-scaling-stroke"');
  });

  it('resizes using pixel axes for all handles and keeps schema-valid geometry', () => {
    const handles: ResizeHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
    for (const handle of handles) {
      const dx = handle.includes('w') ? -25 : handle.includes('e') ? 25 : 0;
      const dy = handle.includes('n') ? -20 : handle.includes('s') ? 20 : 0;
      const result = resizeElementGeometryFromHandle({ x: 0.25, y: 0.25, w: 0.3, h: 0.3, rotation: 0 }, dx, dy, 1200, 600, handle, false);
      expect(result.x).toBeGreaterThanOrEqual(0);
      expect(result.y).toBeGreaterThanOrEqual(0);
      expect(result.x + result.w).toBeLessThanOrEqual(1);
      expect(result.y + result.h).toBeLessThanOrEqual(1);
    }
  });

  it('ignores non-finite drag input', () => {
    const g = { x: 0.1, y: 0.2, w: 0.3, h: 0.4, rotation: 30 };
    expect(resizeElementGeometryFromHandle(g, Number.NaN, 2, 1080, 1920, 'se', false)).toEqual(g);
  });
});
