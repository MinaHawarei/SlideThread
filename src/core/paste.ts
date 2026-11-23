import { plainTextFieldsToRichText, type RichText, type Slide, type SlideType } from './schema';

export interface ParsedCandidateSlide {
  id: string;
  type: SlideType;
  fields: Record<string, string>;
  richFields?: Record<string, RichText>;
  rawChunk: string;
}

/**
 * Heuristically parses pasted long-form text (markdown, outlines, threads) into slide candidates.
 * Follows Spec §8.3:
 * - Splits on '---' (explicit separator) or 2+ newlines.
 * - Heuristically classifies slide type (code, quote, stat, compare, rule, cta, cover, explain).
 * - Extracts structured fields per slide type schema.
 */
export function parsePastedText(rawText: string): ParsedCandidateSlide[] {
  const normalized = rawText.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  // Check for explicit "---" separator on its own line
  const hasExplicitSeparator = /(?:^|\n)\s*---\s*(?:\n|$)/.test(normalized);

  let rawChunks: string[];
  if (hasExplicitSeparator) {
    rawChunks = normalized.split(/(?:^|\n)\s*---\s*(?:\n|$)/);
  } else {
    // Split by double blank lines
    rawChunks = normalized.split(/\n\s*\n+/);
  }

  rawChunks = rawChunks.map((c) => c.trim()).filter((c) => c.length > 0);
  if (rawChunks.length === 0) return [];

  const candidates: ParsedCandidateSlide[] = [];

  for (let i = 0; i < rawChunks.length; i++) {
    const chunk = rawChunks[i]!;
    const candidate = parseChunk(chunk, i, rawChunks.length);
    candidates.push(candidate);
  }

  return candidates;
}

function cleanHeader(line: string): string {
  return line.replace(/^#+\s*/, '').trim();
}

function makeCandidate(
  id: string,
  type: SlideType,
  fields: Record<string, string>,
  rawChunk: string
): ParsedCandidateSlide {
  return {
    id,
    type,
    fields,
    richFields: plainTextFieldsToRichText(fields),
    rawChunk,
  };
}

function parseChunk(chunk: string, index: number, total: number): ParsedCandidateSlide {
  const id = `cand_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`;
  const lines = chunk
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // 1. Code block detection: ```lang ... ```
  if (chunk.includes('```')) {
    const codeFenceMatch = chunk.match(/```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/);
    if (codeFenceMatch) {
      const lang = codeFenceMatch[1] || '';
      const code = (codeFenceMatch[2] || '').trim();

      // Title: line preceding code block, or first line of chunk
      let title = 'Implementation Snippet';
      const beforeCode = chunk.split('```')[0]?.trim();
      if (beforeCode) {
        const firstLine = beforeCode.split('\n')[0]?.trim();
        if (firstLine) title = cleanHeader(firstLine);
      }

      // Note: text after code block
      const afterCode = chunk.split('```')[2]?.trim() || '';

      return makeCandidate(
        id,
        'code',
        {
          title,
          code,
          lang,
          note: afterCode,
        },
        chunk
      );
    }
  }

  // 2. Quote detection: lines starting with > or blockquote
  const quoteLines = lines.filter((l) => l.startsWith('>'));
  if (quoteLines.length > 0 || (lines[0]?.startsWith('"') && lines[0]?.endsWith('"') && lines.length <= 3)) {
    const quoteText = quoteLines.length > 0
      ? quoteLines.map((l) => l.replace(/^>\s*/, '')).join(' ')
      : (lines[0] || '').replace(/^["'“](.*)["'”]$/, '$1');

    // Look for attribution line (-- Author, — Author, Author:, etc.)
    const attrLine = lines.find((l) => /^[-—–]{1,2}\s+/.test(l) || /^by\s+/i.test(l));
    let author = 'Author';
    let role = '';

    if (attrLine) {
      const cleanAttr = attrLine.replace(/^[-—–]{1,2}\s+/, '').replace(/^by\s+/i, '').trim();
      const parts = cleanAttr.split(/,\s*/);
      author = parts[0] || 'Author';
      role = parts.slice(1).join(', ') || '';
    }

    return makeCandidate(
      id,
      'quote',
      {
        text: quoteText,
        author,
        role,
      },
      chunk
    );
  }

  // 3. Stat detection: line matching prominent metric ($10M, 99%, 4.5x, 100k, 10x)
  const statMetricRegex = /^(\+|-)?(\$|€|£)?\d+([.,]\d+)?\s*(%|x|X|k|K|m|M|b|B|\+)?$/;
  let statLineIndex = -1;
  let matchedStatValue = '';

  for (let li = 0; li < lines.length; li++) {
    const l = cleanHeader(lines[li]!);
    if (statMetricRegex.test(l)) {
      statLineIndex = li;
      matchedStatValue = l;
      break;
    }
  }

  if (statLineIndex >= 0) {
    const otherLines = lines.filter((_, li) => li !== statLineIndex);
    const label = otherLines[0] ? cleanHeader(otherLines[0]) : 'Key Metric';
    const note = otherLines.slice(1).join(' ') || '';

    return makeCandidate(
      id,
      'stat',
      {
        value: matchedStatValue,
        label,
        note,
      },
      chunk
    );
  }

  // 4. Compare detection: Bad vs OK, Don't vs Do, Problem vs Solution, ❌ vs ✅
  const compareKeywordMatch = lines.some((l) =>
    /^(bad|don't|dont|problem|before|❌|negative):/i.test(l) ||
    /^(ok|good|do|solution|after|✅|positive):/i.test(l)
  );

  if (compareKeywordMatch) {
    let title = 'Comparison';
    let l1 = "Don't";
    let t1 = '';
    let l2 = 'Do';
    let t2 = '';

    const firstLine = lines[0] || '';
    if (!/^(bad|don't|dont|problem|before|ok|good|do|solution|after|❌|✅):/i.test(firstLine)) {
      title = cleanHeader(firstLine);
    }

    for (const line of lines) {
      if (/^(bad|don't|dont|problem|before|❌):?\s*(.*)/i.test(line)) {
        const m = line.match(/^(bad|don't|dont|problem|before|❌):?\s*(.*)/i);
        l1 = m?.[1]?.toUpperCase() || "Don't";
        t1 = m?.[2] || '';
      } else if (/^(ok|good|do|solution|after|✅):?\s*(.*)/i.test(line)) {
        const m = line.match(/^(ok|good|do|solution|after|✅):?\s*(.*)/i);
        l2 = m?.[1]?.toUpperCase() || 'Do';
        t2 = m?.[2] || '';
      }
    }

    return makeCandidate(
      id,
      'compare',
      {
        title,
        l1,
        t1: t1 || 'Suboptimal approach',
        l2,
        t2: t2 || 'Recommended approach',
      },
      chunk
    );
  }

  // 5. Rule detection: IF / THEN, When / Then
  const hasIfThen = lines.some((l) => /^if\b/i.test(l)) && lines.some((l) => /^then\b/i.test(l));
  if (hasIfThen || /^(rule|when):/i.test(lines[0] || '')) {
    let title = 'Core Rule';
    let cond = '';
    let res = '';
    let note = '';

    const ifLine = lines.find((l) => /^if\b/i.test(l) || /^when\b/i.test(l));
    const thenLine = lines.find((l) => /^then\b/i.test(l));

    if (ifLine) {
      cond = ifLine.replace(/^(if|when):?\s*/i, '').trim();
    }
    if (thenLine) {
      res = thenLine.replace(/^then:?\s*/i, '').trim();
    }

    // Title line if first line is not if/then
    if (lines[0] && !/^if\b/i.test(lines[0]) && !/^when\b/i.test(lines[0])) {
      title = cleanHeader(lines[0]);
    }

    const noteLine = lines.find((l) => l !== lines[0] && l !== ifLine && l !== thenLine);
    if (noteLine) note = noteLine;

    return makeCandidate(
      id,
      'rule',
      {
        title,
        cond: cond || 'Condition occurs',
        res: res || 'Execute action',
        note,
        condLabel: 'IF',
        resLabel: 'THEN',
      },
      chunk
    );
  }

  // 6. CTA closing slide detection: last slide with call-to-action signals
  const isLast = index === total - 1 && total > 1;
  const hasCtaSignal = /follow|subscribe|connect|share|save this|link in bio/i.test(chunk);
  if (isLast && hasCtaSignal) {
    const title = cleanHeader(lines[0] || 'Thanks for Reading');
    const body = lines.slice(1).join(' ') || 'Follow for more insights on modern software architecture.';

    return makeCandidate(
      id,
      'cta',
      {
        title,
        body,
        action: 'Follow & Share',
      },
      chunk
    );
  }

  // 7. Cover slide detection: first slide if it has title + subtitle structure (no list bullets)
  const hasBullets = lines.some((l) => l.startsWith('-') || l.startsWith('*') || /^\d+\./.test(l));
  if (index === 0 && !hasBullets && lines.length >= 1) {
    const title = cleanHeader(lines[0] || 'Untitled Presentation');
    const sub = lines[1] ? cleanHeader(lines[1]) : '';
    const rule = lines[2] || '';

    return makeCandidate(
      id,
      'cover',
      {
        tag: 'CAROUSEL',
        title,
        sub,
        rule,
      },
      chunk
    );
  }

  // 8. Explain slide (Default topic breakdown)
  const title = cleanHeader(lines[0] || `Slide ${index + 1}`);
  const bodyLines = lines.slice(1);
  const body = bodyLines.length > 0
    ? bodyLines.map((l) => (l.startsWith('-') || l.startsWith('*') || /^\d+\./.test(l) ? l : `- ${l}`)).join('\n')
    : '- Core insight for this slide';

  return makeCandidate(
    id,
    'explain',
    {
      title,
      body,
    },
    chunk
  );
}

/**
 * Converts a ParsedCandidateSlide into a permanent Slide schema object.
 */
export function candidateToSlide(candidate: ParsedCandidateSlide): Slide {
  return {
    id: candidate.id || `slide_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type: candidate.type,
    fields: candidate.richFields || plainTextFieldsToRichText(candidate.fields),
  };
}
