import { describe, it, expect, beforeEach } from 'vitest';
import { hasManualTextSize, createDoc, createParagraph, createRun, createListItem } from '../../src/core/richText';
import type { RichText } from '../../src/core/schema';
import { useProjectStore } from '../../src/store/projectStore';
import { undo, redo, clear as clearHistory } from '../../src/store/history';

describe('Manual Text Size Detection (R4-3, §5.3)', () => {
  it('detects manual size marks in runs', () => {
    const plainDoc: RichText = createDoc([
      createParagraph([createRun('Regular text without size')]),
    ]);
    expect(hasManualTextSize(plainDoc)).toBe(false);

    const manualSizeDoc: RichText = createDoc([
      createParagraph([
        createRun('Normal text '),
        createRun('Enlarged text', { size: 150 }),
      ]),
    ]);
    expect(hasManualTextSize(manualSizeDoc)).toBe(true);
  });

  it('handles null, undefined, and plain string fallbacks', () => {
    expect(hasManualTextSize(undefined)).toBe(false);
    expect(hasManualTextSize('plain string')).toBe(false);
  });
});

describe('RichText Split Slide Action (R4-3, §5.3)', () => {
  beforeEach(() => {
    clearHistory();
    useProjectStore.getState().createProject({ title: 'Split Test' });
  });

  it('splits rich text blocks across slides preserving all marks and styles', () => {
    const store = useProjectStore.getState();
    const slide = store.project.slides[0]!;

    const richBody: RichText = createDoc([
      createListItem([createRun('Item 1: Actionable point', { bold: true, color: '#0891b2' })]),
      createListItem([createRun('Item 2: Critical metric', { underline: true, size: 125 })]),
      createListItem([createRun('Item 3: Next phase step', { highlight: '#fef08a' })]),
      createListItem([createRun('Item 4: Final conclusion', { font: 'jetbrains-mono' })]),
    ]);

    store.updateSlideFields(slide.id, {
      title: createDoc([createParagraph([createRun('Original Headline')])]),
      body: richBody,
    });

    const initialCount = store.project.slides.length;

    // Execute split
    store.splitSlide(slide.id);

    const updatedSlides = useProjectStore.getState().project.slides;
    expect(updatedSlides.length).toBe(initialCount + 1);

    // Slide 1 should have first 2 items
    const slide1 = updatedSlides[0]!;
    expect(slide1.fields.body!.blocks.length).toBe(2);
    expect(slide1.fields.body!.blocks[0]!.runs[0]!.marks?.bold).toBe(true);
    expect(slide1.fields.body!.blocks[0]!.runs[0]!.marks?.color).toBe('#0891b2');
    expect(slide1.fields.body!.blocks[1]!.runs[0]!.marks?.size).toBe(125);

    // Slide 2 should be the new split slide with next 2 items
    const slide2 = updatedSlides[1]!;
    expect(slide2.fields.body!.blocks.length).toBe(2);
    expect(slide2.fields.body!.blocks[0]!.runs[0]!.marks?.highlight).toBe('#fef08a');
    expect(slide2.fields.body!.blocks[1]!.runs[0]!.marks?.font).toBe('jetbrains-mono');

    // Slide 2 title should have continuation suffix
    const slide2Title = slide2.fields.title!;
    const lastRun = slide2Title.blocks[0]!.runs.slice(-1)[0]!;
    expect(lastRun.text).toContain('(Cont.)');

    // Split slide is set as active
    expect(useProjectStore.getState().activeSlideId).toBe(slide2.id);

    // Undo restores original slide count
    undo();
    expect(useProjectStore.getState().project.slides.length).toBe(initialCount);
    expect(useProjectStore.getState().project.slides[0]!.fields.body!.blocks.length).toBe(4);

    // Redo restores split
    redo();
    expect(useProjectStore.getState().project.slides.length).toBe(initialCount + 1);
  });
});
