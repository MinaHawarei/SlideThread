import type { RichText, RichTextBlock, RichTextRun, RichTextMarks, TextAlignment, TextDirection } from './schema';
import { FONT_REGISTRY, type FontId } from '../fonts/registry';
import type { JSONContent } from '@tiptap/core';

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

export function parseInlineRuns(text: string): RichTextRun[] {
  if (!text) return [{ text: '' }];
  if (!text.includes('**')) return [{ text }];

  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  const runs: RichTextRun[] = [];

  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      runs.push({ text: part.slice(2, -2), marks: { bold: true } });
    } else {
      runs.push({ text: part });
    }
  }

  return runs.length > 0 ? runs : [{ text: '' }];
}

/**
 * Converts a plain string to the v2 RichText document shape.
 * Multi-line strings are parsed into separate paragraphs, with
 * `- ` / `* ` / `• ` prefixes parsed as unordered list items, and
 * `1. ` prefixes parsed as ordered list items (per Spec §8.3).
 */
export function parsePlainTextToRichText(text: string): RichText {
  if (!text) {
    return { type: 'doc', blocks: [{ type: 'p', runs: [{ text: '' }] }] };
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
        runs: parseInlineRuns(orderedMatch[2]!),
      });
      continue;
    }

    const bulletMatch = line.match(/^\s*[-*•]\s+(.*)$/);
    if (bulletMatch) {
      blocks.push({
        type: 'li',
        ordered: false,
        runs: parseInlineRuns(bulletMatch[1]!),
      });
      continue;
    }

    blocks.push({ type: 'p', runs: parseInlineRuns(line) });
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

/**
 * Checks if any run in the RichText document has a manually specified font size mark.
 * Per Spec §5.3, if manual size is set on a text run, auto-fit is disabled for that
 * element and only the overflow warning applies.
 */
export function hasManualTextSize(doc?: RichText | string): boolean {
  if (!doc || typeof doc === 'string') return false;
  if (!doc.blocks || !Array.isArray(doc.blocks)) return false;
  return doc.blocks.some((block) =>
    block.runs.some((run) => typeof run.marks?.size === 'number')
  );
}

/**
 * Converts a RichText document into Tiptap JSON document representation.
 */
export function richTextToTiptapJSON(doc: RichText): JSONContent {
  const content: JSONContent[] = [];
  let currentList: { type: 'bulletList' | 'orderedList'; items: JSONContent[] } | null = null;

  const flushList = () => {
    if (currentList) {
      content.push({
        type: currentList.type,
        content: currentList.items,
      });
      currentList = null;
    }
  };

  const blockToTextNodes = (block: RichTextBlock): JSONContent[] => {
    return block.runs.map((run) => {
      const marks: Array<{ type: string; attrs?: Record<string, unknown> }> = [];
      if (run.marks?.bold) marks.push({ type: 'bold' });
      if (run.marks?.underline) marks.push({ type: 'underline' });
      if (run.marks?.highlight) marks.push({ type: 'highlight', attrs: { color: run.marks.highlight } });

      const styleAttrs: Record<string, unknown> = {};
      if (run.marks?.color) styleAttrs.color = run.marks.color;
      if (run.marks?.size) styleAttrs.fontSize = `${run.marks.size}%`;
      if (run.marks?.font) styleAttrs.fontFamily = resolveFontFamily(run.marks.font);
      if (Object.keys(styleAttrs).length > 0) {
        marks.push({ type: 'textStyle', attrs: styleAttrs });
      }

      return {
        type: 'text',
        text: run.text,
        ...(marks.length > 0 ? { marks } : {}),
      };
    });
  };

  for (const block of doc.blocks) {
    if (block.type === 'li') {
      const listType = block.ordered ? 'orderedList' : 'bulletList';
      if (!currentList || currentList.type !== listType) {
        flushList();
        currentList = { type: listType, items: [] };
      }
      const textNodes = blockToTextNodes(block);
      currentList.items.push({
        type: 'listItem',
        content: [
          {
            type: 'paragraph',
            content: textNodes.length > 0 ? textNodes : undefined,
          },
        ],
      });
    } else {
      flushList();
      const attrs: Record<string, unknown> = {};
      if (block.align) attrs.textAlign = block.align;
      if (block.dir) attrs.dir = block.dir;

      const textNodes = blockToTextNodes(block);
      content.push({
        type: 'paragraph',
        ...(Object.keys(attrs).length > 0 ? { attrs } : {}),
        content: textNodes.length > 0 ? textNodes : undefined,
      });
    }
  }

  flushList();

  return {
    type: 'doc',
    content: content.length > 0 ? content : [{ type: 'paragraph' }],
  };
}

/**
 * Converts a Tiptap JSON document representation back into the application's RichText model.
 */
export function tiptapJSONToRichText(json: JSONContent): RichText {
  if (!json || json.type !== 'doc' || !Array.isArray(json.content)) {
    return { type: 'doc', blocks: [{ type: 'p', runs: [{ text: '' }] }] };
  }

  const blocks: RichTextBlock[] = [];

  const extractRuns = (nodes?: JSONContent[]): RichTextRun[] => {
    const runs: RichTextRun[] = [];
    if (!Array.isArray(nodes)) return runs;

    for (const child of nodes) {
      if (child.type === 'text' && typeof child.text === 'string') {
        const marks: RichTextMarks = {};
        if (Array.isArray(child.marks)) {
          for (const mark of child.marks) {
            if (mark.type === 'bold') marks.bold = true;
            if (mark.type === 'underline') marks.underline = true;
            if (mark.type === 'highlight') {
              marks.highlight = (mark.attrs?.color as string) || '#fef08a';
            }
            if (mark.type === 'textStyle' && mark.attrs) {
              if (typeof mark.attrs.color === 'string') marks.color = mark.attrs.color;
              if (typeof mark.attrs.fontSize === 'string') {
                const parsed = parseInt(mark.attrs.fontSize, 10);
                if (!isNaN(parsed) && parsed >= 50 && parsed <= 300) {
                  marks.size = parsed;
                }
              } else if (typeof mark.attrs.fontSize === 'number') {
                marks.size = Math.max(50, Math.min(300, mark.attrs.fontSize));
              }
              if (typeof mark.attrs.fontFamily === 'string') {
                const family = mark.attrs.fontFamily.replace(/["']/g, '').trim().toLowerCase();
                const exactFont = Object.values(FONT_REGISTRY).find((font) => font.family.toLowerCase() === family);
                if (exactFont) marks.font = exactFont.id;
                else if (family.includes('arabic')) marks.font = 'ibm-plex-sans-arabic';
                else if (family.includes('mono')) marks.font = 'jetbrains-mono';
                else if (family.includes('coptic')) marks.font = 'noto-sans-coptic';
                else if (family.includes('ibm') || family.includes('sans')) marks.font = 'ibm-plex-sans';
                else marks.font = mark.attrs.fontFamily;
              }
            }
          }
        }
        runs.push({
          text: child.text,
          ...(Object.keys(marks).length > 0 ? { marks } : {}),
        });
      }
    }
    return runs;
  };

  for (const node of json.content) {
    if (node.type === 'bulletList' || node.type === 'orderedList') {
      const isOrdered = node.type === 'orderedList';
      if (Array.isArray(node.content)) {
        for (const item of node.content) {
          if (item.type === 'listItem' && Array.isArray(item.content)) {
            for (const itemChild of item.content) {
              const align = (itemChild.attrs?.textAlign as TextAlignment) || undefined;
              const dir = (itemChild.attrs?.dir as TextDirection) || undefined;
              const runs = extractRuns(itemChild.content);
              blocks.push({
                type: 'li',
                ordered: isOrdered,
                runs: runs.length > 0 ? runs : [{ text: '' }],
                ...(align ? { align } : {}),
                ...(dir ? { dir } : {}),
              });
            }
          }
        }
      }
    } else if (node.type === 'paragraph' || node.type === 'heading') {
      const align = (node.attrs?.textAlign as TextAlignment) || undefined;
      const dir = (node.attrs?.dir as TextDirection) || undefined;
      const runs = extractRuns(node.content);

      blocks.push({
        type: 'p',
        runs: runs.length > 0 ? runs : [{ text: '' }],
        ...(align ? { align } : {}),
        ...(dir ? { dir } : {}),
      });
    }
  }

  return {
    type: 'doc',
    blocks: blocks.length > 0 ? blocks : [{ type: 'p', runs: [{ text: '' }] }],
  };
}
