import type { RichText, RichTextBlock, RichTextRun, RichTextMarks } from './schema';
import { FONT_REGISTRY, type FontId } from '../fonts/registry';

/** Checks if a string contains any Arabic characters. */
export function isArabicText(text: string): boolean {
  return /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]/u.test(text);
}

/** Detects primary text direction based on first strong directional character. */
export function detectRunDirection(text: string): 'rtl' | 'ltr' | 'auto' {
  if (isArabicText(text)) return 'rtl';
  if (/[A-Za-z\u00c0-\u024f]/u.test(text)) return 'ltr';
  return 'auto';
}

/** Creates a RichTextRun with optional formatting marks. */
export function createRun(text: string, marks?: RichTextMarks): RichTextRun {
  return {
    text,
    ...(marks ? { marks } : {}),
  };
}

/** Creates a paragraph block. */
export function createParagraph(runs: RichTextRun[]): RichTextBlock {
  return {
    type: 'p',
    runs,
  };
}

/** Creates a list item block. */
export function createListItem(runs: RichTextRun[], ordered = false): RichTextBlock {
  return {
    type: 'li',
    runs,
    ordered,
  };
}

/** Creates a complete RichText doc. */
export function createDoc(blocks: RichTextBlock[]): RichText {
  return {
    type: 'doc',
    blocks,
  };
}

/**
 * Converts a plain string to the v2 RichText document shape.
 * Multi-line strings are parsed into separate paragraphs, with
 * `- ` / `* ` / `• ` prefixes parsed as unordered list items, and
 * `1. ` prefixes parsed as ordered list items (per Spec §8.3).
 */
export function parsePlainTextToRichText(text: string): RichText {
  if (!text.includes('\n')) {
    return { type: 'doc', blocks: [{ type: 'p', runs: [{ text }] }] };
  }

  const lines = text.split('\n');
  const blocks: RichTextBlock[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed && lines.length > 1) {
      // Empty line -> empty paragraph
      blocks.push({ type: 'p', runs: [{ text: '' }] });
      continue;
    }

    const orderedMatch = line.match(/^\s*(\d+)\.\s+(.*)$/);
    if (orderedMatch) {
      blocks.push({
        type: 'li',
        ordered: true,
        runs: [{ text: orderedMatch[2]! }],
      });
      continue;
    }

    const bulletMatch = line.match(/^\s*[-*•]\s+(.*)$/);
    if (bulletMatch) {
      blocks.push({
        type: 'li',
        ordered: false,
        runs: [{ text: bulletMatch[1]! }],
      });
      continue;
    }

    blocks.push({ type: 'p', runs: [{ text: line }] });
  }

  return { type: 'doc', blocks };
}

/**
 * Converts a RichText document back to a plain string.
 * Preserves list prefixes so strings round-trip cleanly.
 */
export function serializeRichTextToPlainText(doc: RichText): string {
  let orderedIndex = 1;
  return doc.blocks
    .map((block, idx) => {
      const text = block.runs.map((r) => r.text).join('');
      if (block.type === 'li') {
        const isOrdered = block.ordered;
        const prevBlock = doc.blocks[idx - 1];
        if (prevBlock?.type !== 'li' || !prevBlock.ordered) {
          orderedIndex = 1;
        }
        const prefix = isOrdered ? `${orderedIndex++}. ` : '- ';
        return `${prefix}${text}`;
      }
      orderedIndex = 1;
      return text;
    })
    .join('\n');
}

/** Resolves font family name from FontId or raw font family string. */
export function resolveFontFamily(font?: string): string | undefined {
  if (!font) return undefined;
  const def = FONT_REGISTRY[font as FontId];
  return def ? def.family : font;
}
