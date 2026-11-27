import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  richTextToTiptapJSON,
  tiptapJSONToRichText,
  createDoc,
  createParagraph,
  createRun,
  parsePlainTextToRichText,
} from '../../src/core/richText';
import type { RichText } from '../../src/core/schema';
import { RichTextEditor } from '../../src/ui/editor/RichTextEditor';
import { useProjectStore } from '../../src/store/projectStore';
import { undo, redo, clear as clearHistory } from '../../src/store/history';

describe('RichText Tiptap Adapters (R4-2, §5.3)', () => {
  it('converts RichText model to Tiptap JSON with marks, alignments, and directions', () => {
    const doc: RichText = {
      type: 'doc',
      blocks: [
        {
          type: 'p',
          align: 'center',
          dir: 'rtl',
          runs: [
            {
              text: 'عنوان عربي',
              marks: {
                bold: true,
                underline: true,
                highlight: '#fef08a',
                color: '#0891b2',
                size: 150,
                font: 'ibm-plex-sans-arabic',
              },
            },
          ],
        },
      ],
    };

    const json = richTextToTiptapJSON(doc);
    expect(json.type).toBe('doc');
    expect(json.content?.[0]?.type).toBe('paragraph');
    expect(json.content?.[0]?.attrs?.textAlign).toBe('center');
    expect(json.content?.[0]?.attrs?.dir).toBe('rtl');

    const textNode = json.content?.[0]?.content?.[0];
    expect(textNode?.type).toBe('text');
    expect(textNode?.text).toBe('عنوان عربي');

    const marks = textNode?.marks;
    expect(marks?.some((m) => m.type === 'bold')).toBe(true);
    expect(marks?.some((m) => m.type === 'underline')).toBe(true);
    expect(marks?.some((m) => m.type === 'highlight' && m.attrs?.color === '#fef08a')).toBe(true);
    expect(
      marks?.some(
        (m) =>
          m.type === 'textStyle' &&
          m.attrs?.color === '#0891b2' &&
          m.attrs?.fontSize === '150%'
      )
    ).toBe(true);
  });

  it('converts Tiptap JSON back to RichText model preserving marks and alignment', () => {
    const tiptapJSON = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { textAlign: 'right', dir: 'rtl' },
          content: [
            {
              type: 'text',
              text: 'فقرة معدلة',
              marks: [
                { type: 'bold' },
                { type: 'underline' },
                { type: 'highlight', attrs: { color: '#fef08a' } },
                {
                  type: 'textStyle',
                  attrs: {
                    color: '#e11d48',
                    fontSize: '125%',
                    fontFamily: 'JetBrains Mono',
                  },
                },
              ],
            },
          ],
        },
      ],
    };

    const doc = tiptapJSONToRichText(tiptapJSON);
    expect(doc.type).toBe('doc');
    expect(doc.blocks.length).toBe(1);
    expect(doc.blocks[0]!.align).toBe('right');
    expect(doc.blocks[0]!.dir).toBe('rtl');

    const run = doc.blocks[0]!.runs[0]!;
    expect(run.text).toBe('فقرة معدلة');
    expect(run.marks?.bold).toBe(true);
    expect(run.marks?.underline).toBe(true);
    expect(run.marks?.highlight).toBe('#fef08a');
    expect(run.marks?.color).toBe('#e11d48');
    expect(run.marks?.size).toBe(125);
    expect(run.marks?.font).toBe('jetbrains-mono');
  });

  it('handles empty documents cleanly', () => {
    const emptyDoc = tiptapJSONToRichText({ type: 'doc', content: [] });
    expect(emptyDoc.type).toBe('doc');
    expect(emptyDoc.blocks.length).toBe(1);
    expect(emptyDoc.blocks[0]!.runs[0]!.text).toBe('');
  });
});

describe('RichTextEditor Component (R4-2, §5.3)', () => {
  const initialDoc = parsePlainTextToRichText('Testing Rich Text');

  it('renders the embedded (Element Properties panel) toolbar with all required controls (font, size, color, bold, underline, highlight, align, dir)', () => {
    const onChange = vi.fn();
    render(<RichTextEditor content={initialDoc} onChange={onChange} embedded />);

    expect(screen.getByTestId('rich-text-floating-toolbar')).toBeTruthy();
    expect(screen.getByTestId('toolbar-font-family')).toBeTruthy();
    expect(screen.getByTestId('toolbar-font-size')).toBeTruthy();
    expect(screen.getByTestId('toolbar-color-picker')).toBeTruthy();
    expect(screen.getByTestId('toolbar-bold')).toBeTruthy();
    expect(screen.getByTestId('toolbar-underline')).toBeTruthy();
    expect(screen.getByTestId('toolbar-highlight')).toBeTruthy();
    expect(screen.getByTestId('toolbar-bullet-list')).toBeTruthy();
    expect(screen.getByTestId('toolbar-ordered-list')).toBeTruthy();
    expect(screen.getByTestId('toolbar-align-left')).toBeTruthy();
    expect(screen.getByTestId('toolbar-align-center')).toBeTruthy();
    expect(screen.getByTestId('toolbar-align-right')).toBeTruthy();
    expect(screen.getByTestId('toolbar-dir-ltr')).toBeTruthy();
    expect(screen.getByTestId('toolbar-dir-rtl')).toBeTruthy();
  });

  it('shows no toolbar for the inline canvas editor, on desktop or touch layouts: formatting lives in the Element Properties panel', () => {
    const { unmount } = render(<RichTextEditor content={initialDoc} onChange={vi.fn()} touchLayout={true} onDone={vi.fn()} />);
    expect(screen.queryByTestId('rich-text-floating-toolbar')).toBeNull();
    expect(document.querySelector('[data-rich-text-toolbar="true"]')).toBeNull();
    expect(screen.getByTestId('rich-text-contenteditable')).toBeTruthy();
    unmount();
    render(<RichTextEditor content={initialDoc} onChange={vi.fn()} onDone={vi.fn()} />);
    expect(screen.queryByTestId('rich-text-floating-toolbar')).toBeNull();
    expect(screen.queryByTestId('toolbar-bold')).toBeNull();
  });

  it('invokes onDone callback when Escape is pressed', () => {
    const onDone = vi.fn();
    render(<RichTextEditor content={initialDoc} onChange={vi.fn()} onDone={onDone} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});

describe('Undo / Redo Integration for Rich Text (R4-2, §5.3)', () => {
  beforeEach(() => {
    clearHistory();
    useProjectStore.getState().createProject({ title: 'Undo Test' });
  });

  it('integrates rich text updates with project history and undo/redo', () => {
    const store = useProjectStore.getState();
    const slide = store.project.slides[0]!;
    const originalTitle = slide.fields.title!;

    // Step 1: Update slide title with rich text
    const modifiedDoc: RichText = createDoc([
      createParagraph([
        createRun('New Bold Title', { bold: true, color: '#0891b2' }),
      ]),
    ]);

    store.updateSlideFields(slide.id, { title: modifiedDoc });

    const currentSlide = useProjectStore.getState().project.slides[0]!;
    expect(currentSlide.fields.title).toEqual(modifiedDoc);

    // Step 2: Undo restores original title
    const undone = undo();
    expect(undone).toBe(true);

    const revertedSlide = useProjectStore.getState().project.slides[0]!;
    expect(revertedSlide.fields.title).toEqual(originalTitle);

    // Step 3: Redo reapplies modified rich text
    const redone = redo();
    expect(redone).toBe(true);

    const reAppliedSlide = useProjectStore.getState().project.slides[0]!;
    expect(reAppliedSlide.fields.title).toEqual(modifiedDoc);
  });
});
