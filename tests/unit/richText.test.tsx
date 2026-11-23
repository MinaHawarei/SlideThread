import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  parsePlainTextToRichText,
  serializeRichTextToPlainText,
  isArabicText,
  detectRunDirection,
  createRun,
  createParagraph,
  createListItem,
  createDoc,
} from '../../src/core/richText';
import { RichTextRenderer } from '../../src/slides/RichTextRenderer';
import type { RichText } from '../../src/core/schema';

describe('RichText Model & Migration (R4-1, §5.3)', () => {
  it('converts single-line plain string to a standard document', () => {
    const doc = parsePlainTextToRichText('Simple Title');
    expect(doc).toEqual({
      type: 'doc',
      blocks: [{ type: 'p', runs: [{ text: 'Simple Title' }] }],
    });
    expect(serializeRichTextToPlainText(doc)).toBe('Simple Title');
  });

  it('migrates multi-line strings into paragraphs and list items per Spec §8.3', () => {
    const input = [
      'Heading Paragraph',
      '- First bullet item',
      '* Second bullet item',
      '• Third bullet item',
      '1. First numbered step',
      '2. Second numbered step',
      'Closing paragraph',
    ].join('\n');

    const doc = parsePlainTextToRichText(input);
    expect(doc.blocks.length).toBe(7);
    expect(doc.blocks[0]).toEqual({ type: 'p', runs: [{ text: 'Heading Paragraph' }] });
    expect(doc.blocks[1]).toEqual({ type: 'li', ordered: false, runs: [{ text: 'First bullet item' }] });
    expect(doc.blocks[2]).toEqual({ type: 'li', ordered: false, runs: [{ text: 'Second bullet item' }] });
    expect(doc.blocks[3]).toEqual({ type: 'li', ordered: false, runs: [{ text: 'Third bullet item' }] });
    expect(doc.blocks[4]).toEqual({ type: 'li', ordered: true, runs: [{ text: 'First numbered step' }] });
    expect(doc.blocks[5]).toEqual({ type: 'li', ordered: true, runs: [{ text: 'Second numbered step' }] });
    expect(doc.blocks[6]).toEqual({ type: 'p', runs: [{ text: 'Closing paragraph' }] });

    const serialized = serializeRichTextToPlainText(doc);
    expect(serialized).toContain('Heading Paragraph');
    expect(serialized).toContain('- First bullet item');
    expect(serialized).toContain('1. First numbered step');
    expect(serialized).toContain('Closing paragraph');
  });

  it('handles empty strings and preserves empty lines', () => {
    const emptyDoc = parsePlainTextToRichText('');
    expect(emptyDoc.blocks.length).toBe(1);
    expect(emptyDoc.blocks[0]?.runs[0]?.text).toBe('');

    const multilineEmpty = parsePlainTextToRichText('First\n\nSecond');
    expect(multilineEmpty.blocks.length).toBe(3);
    expect(multilineEmpty.blocks[1]?.runs[0]?.text).toBe('');
  });
});

describe('Arabic and Mixed Bidi Detection (§5.3)', () => {
  it('detects pure Arabic text correctly', () => {
    expect(isArabicText('مرحبا بالعالم')).toBe(true);
    expect(detectRunDirection('مرحبا بالعالم')).toBe('rtl');
  });

  it('detects pure Latin text correctly', () => {
    expect(isArabicText('Hello World')).toBe(false);
    expect(detectRunDirection('Hello World')).toBe('ltr');
  });

  it('detects mixed bidi text containing Arabic words and Latin abbreviations', () => {
    const mixed = 'استخدام React مع Next.js في الويب';
    expect(isArabicText(mixed)).toBe(true);
    expect(detectRunDirection(mixed)).toBe('rtl');
  });

  it('detects numbers and symbols', () => {
    expect(detectRunDirection('12345')).toBe('auto');
    expect(detectRunDirection('✦ ★')).toBe('auto');
  });
});

describe('RichTextRenderer Component (§5.3)', () => {
  it('renders paragraphs and formatting marks (bold, underline, size, color, font)', () => {
    const doc: RichText = createDoc([
      createParagraph([
        createRun('Normal text '),
        createRun('Bold and colored', { bold: true, color: '#35D0E6' }),
        createRun(' Underlined', { underline: true }),
        createRun(' Highlighted', { highlight: '#ffff00', size: 120, font: 'ibm-plex-sans' }),
      ]),
    ]);

    const { container } = render(<RichTextRenderer content={doc} />);
    const runs = container.querySelectorAll('.rich-text-run');
    expect(runs.length).toBe(4);

    expect(runs[0]?.textContent).toBe('Normal text ');

    const boldRun = runs[1] as HTMLElement;
    expect(boldRun.style.fontWeight).toBe('700');
    expect(boldRun.style.color).toBe('rgb(53, 208, 230)');

    const underlineRun = runs[2] as HTMLElement;
    expect(underlineRun.style.textDecoration).toBe('underline');

    const highlightedRun = runs[3] as HTMLElement;
    expect(highlightedRun.style.backgroundColor).toBe('rgb(255, 255, 0)');
    expect(highlightedRun.style.fontSize).toBe('120%');
    expect(highlightedRun.style.fontFamily).toBe('IBM Plex Sans');
  });

  it('groups contiguous list items into ul and ol containers', () => {
    const doc: RichText = createDoc([
      createParagraph([createRun('Intro')]),
      createListItem([createRun('Bullet A')], false),
      createListItem([createRun('Bullet B')], false),
      createListItem([createRun('Step 1')], true),
      createListItem([createRun('Step 2')], true),
    ]);

    const { container } = render(<RichTextRenderer content={doc} />);
    const uls = container.querySelectorAll('ul');
    const ols = container.querySelectorAll('ol');
    const lis = container.querySelectorAll('li');

    expect(uls.length).toBe(1);
    expect(ols.length).toBe(1);
    expect(lis.length).toBe(4);
    expect(screen.getByText('Intro')).toBeTruthy();
    expect(screen.getByText('Bullet A')).toBeTruthy();
    expect(screen.getByText('Step 1')).toBeTruthy();
  });

  it('renders Arabic runs with zero letter-spacing to protect cursive ligatures', () => {
    const arabicDoc: RichText = createDoc([
      createParagraph([
        createRun('هذا نص عربي أصيل', { bold: true }),
      ]),
    ]);

    const { container } = render(<RichTextRenderer content={arabicDoc} />);
    const run = container.querySelector('.rich-text-run') as HTMLElement;
    expect(run).toBeTruthy();
    expect(run.dir).toBe('rtl');
    expect(['0', '0px']).toContain(run.style.letterSpacing);
  });

  it('isolates bidirectional text using <bdi> to protect Arabic punctuation with English words', () => {
    const mixedDoc: RichText = createDoc([
      createParagraph([
        createRun('تطبيق '),
        createRun('SlideThread', { bold: true, color: '#0891b2' }),
        createRun(' يقدم ميزات رائعة!'),
      ]),
    ]);

    const { container } = render(<RichTextRenderer content={mixedDoc} />);
    const bdiElements = container.querySelectorAll('bdi');
    expect(bdiElements.length).toBe(3);

    // English word run
    expect(bdiElements[1]?.getAttribute('dir')).toBe('ltr');
    // Surrounding Arabic runs
    expect(bdiElements[0]?.getAttribute('dir')).toBe('rtl');
    expect(bdiElements[2]?.getAttribute('dir')).toBe('rtl');
  });

  it('renders inline mode without outer paragraph block', () => {
    const doc: RichText = createDoc([
      createParagraph([createRun('Single inline run')]),
    ]);

    const { container } = render(<RichTextRenderer content={doc} inline={true} />);
    expect(container.querySelector('.rich-text-inline')).toBeTruthy();
    expect(container.querySelector('p')).toBeNull();
  });
});
