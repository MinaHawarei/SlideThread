import type { CSSProperties } from 'react';
import type { TextStyleOverride } from './schema';
import { FONT_REGISTRY, type FontId } from '../fonts/registry';

/**
 * Text style precedence: a template's existing inline/class defaults remain the
 * legacy baseline; template typeScale CSS variables apply only where a template
 * or extra explicitly consumes them; element textStyle overrides replace those
 * inherited values; existing rich-text run marks remain the most specific
 * inline formatting. Omitting/resetting textStyle therefore restores inheritance.
 */
/** Converts validated, bounded editor typography into inline styles without raw CSS input. */
export function textStyleToCss(style?: TextStyleOverride): CSSProperties {
  if (!style) return {};
  const family = style.font ? FONT_REGISTRY[style.font as FontId]?.family : undefined;
  const fontDefinition = style.font ? FONT_REGISTRY[style.font as FontId] : undefined;
  return {
    ...(family ? { fontFamily: family } : {}),
    ...(style.size !== undefined ? { fontSize: `${style.size}px` } : {}),
    ...(style.weight !== undefined ? { fontWeight: style.weight } : fontDefinition ? { fontWeight: fontDefinition.weights[0] } : {}),
    ...(style.italic !== undefined ? { fontStyle: style.italic ? 'italic' : 'normal' } : fontDefinition && !fontDefinition.styles.includes('italic') ? { fontStyle: 'normal' } : {}),
    ...(style.letterSpacing !== undefined ? { letterSpacing: `${style.letterSpacing}px` } : {}),
    ...(style.lineHeight !== undefined ? { lineHeight: style.lineHeight } : {}),
    ...(style.color ? { color: style.color } : {}),
  };
}

export const TYPOGRAPHY_SLOT_IDS = new Set(['title', 'body', 'tag', 'signature', 'code', 'counter', 'value', 'source', 'author', 'text', 'cond', 'res', 'note', 't1', 't2', 'label', 'left', 'right', 'action', 'name', 'handle', 'rule', 'sub']);
