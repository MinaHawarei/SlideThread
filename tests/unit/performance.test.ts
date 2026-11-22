import { describe, it, expect } from 'vitest';
import { useProjectStore } from '../../src/store/projectStore';
import { SlideRenderer } from '../../src/slides/SlideRenderer';
import { getManualChunk } from '../../src/config/chunks';

describe('Performance Pass (Spec §12 & Task P4-6)', () => {
  it('SlideRenderer is memoized with React.memo', () => {
    expect(SlideRenderer).toBeDefined();
    expect((SlideRenderer as unknown as { $$typeof: symbol }).$$typeof).toBe(Symbol.for('react.memo'));
    expect(SlideRenderer.displayName).toBe('SlideRenderer');
  });

  it('handles rapid keystroke updates with negligible state latency (< 1ms per update)', () => {
    const store = useProjectStore.getState();
    const project = store.createProject({
      title: 'Performance Benchmark Project',
    });

    const activeSlide = project.slides[0]!;
    const iterations = 100;
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      store.updateSlideFields(activeSlide.id, {
        title: `Keystroke update ${i}`,
        body: `Keystroke body stream ${i}`,
      });
    }

    const elapsed = performance.now() - start;
    const avgPerUpdate = elapsed / iterations;

    expect(avgPerUpdate).toBeLessThan(1.0); // Less than 1 millisecond per keystroke
    const updatedSlide = useProjectStore.getState().project.slides[0]!;
    expect(updatedSlide.fields.title).toBe(`Keystroke update ${iterations - 1}`);
  });

  it('configures intelligent Rollup code-splitting chunks', () => {
    expect(getManualChunk('node_modules/jspdf/dist/jspdf.es.js')).toBe('vendor-export');
    expect(getManualChunk('node_modules/jszip/dist/jszip.js')).toBe('vendor-export');
    expect(getManualChunk('node_modules/html-to-image/es/index.js')).toBe('vendor-export');
    expect(getManualChunk('node_modules/react/index.js')).toBe('vendor-react');
    expect(getManualChunk('node_modules/react-dom/index.js')).toBe('vendor-react');
    expect(getManualChunk('node_modules/zustand/esm/index.mjs')).toBe('vendor-core');
    expect(getManualChunk('node_modules/zod/v4/index.js')).toBe('vendor-core');
    expect(getManualChunk('node_modules/idb-keyval/dist/index.js')).toBe('vendor-core');
    expect(getManualChunk('src/App.tsx')).toBeUndefined();
  });
});
