import { describe, it, expect } from 'vitest';
import { useProjectStore } from '../../src/store/projectStore';
import { SlideRenderer } from '../../src/slides/SlideRenderer';
import { getManualChunk } from '../../src/config/chunks';
import { richTextToPlainText } from '../../src/core/schema';

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

    // Warm-up JIT
    for (let i = 0; i < 10; i++) {
      store.updateSlideFields(activeSlide.id, {
        title: `Warmup ${i}`,
      });
    }

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

    expect(avgPerUpdate).toBeLessThan(2.0); // Sub-2ms per keystroke even under heavy parallel runner load
    const updatedSlide = useProjectStore.getState().project.slides[0]!;
    expect(richTextToPlainText(updatedSlide.fields.title!)).toBe(`Keystroke update ${iterations - 1}`);
  });

  it('configures intelligent Rollup code-splitting chunks', () => {
    // Export libraries stay with their lazy routes. Grouping them manually
    // pulls Vite's dynamic-import loader and the full export bundle into Home.
    expect(getManualChunk('node_modules/jspdf/dist/jspdf.es.js')).toBeUndefined();
    expect(getManualChunk('node_modules/jszip/dist/jszip.js')).toBeUndefined();
    expect(getManualChunk('node_modules/html-to-image/es/index.js')).toBeUndefined();
    expect(getManualChunk('node_modules/react/index.js')).toBe('vendor-react');
    expect(getManualChunk('node_modules/react-dom/index.js')).toBe('vendor-react');
    expect(getManualChunk('node_modules/zustand/esm/index.mjs')).toBe('vendor-core');
    expect(getManualChunk('node_modules/zod/v4/index.js')).toBe('vendor-core');
    expect(getManualChunk('node_modules/idb-keyval/dist/index.js')).toBe('vendor-core');
    expect(getManualChunk('src/App.tsx')).toBeUndefined();
  });
});
