import { describe, it, expect } from 'vitest';
import { parsePastedText, candidateToSlide } from '../../src/core/paste';
import { richTextToPlainText } from '../../src/core/schema';

describe('Paste to Slides Parser (Spec §8.3 & Plan §4)', () => {
  it('returns empty array for empty or whitespace-only inputs', () => {
    expect(parsePastedText('')).toEqual([]);
    expect(parsePastedText('   \n\n   \t  ')).toEqual([]);
  });

  it('splits on explicit "---" separator', () => {
    const raw = `
Slide 1 Title
Subtitle line
---
Slide 2 Title
- Point 1
- Point 2
---
Slide 3 Title
Final notes
    `;
    const candidates = parsePastedText(raw);
    expect(candidates.length).toBe(3);
    expect(candidates[0]?.fields.title).toBe('Slide 1 Title');
    expect(candidates[1]?.fields.title).toBe('Slide 2 Title');
    expect(candidates[2]?.fields.title).toBe('Slide 3 Title');
  });

  it('splits on double blank lines when "---" is absent', () => {
    const raw = `First Section Title
Intro details here

Second Section Title
- Key insight A
- Key insight B

Third Section Title
Closing notes`;

    const candidates = parsePastedText(raw);
    expect(candidates.length).toBe(3);
    expect(candidates[0]?.fields.title).toBe('First Section Title');
    expect(candidates[1]?.fields.title).toBe('Second Section Title');
  });

  it('classifies first chunk as cover slide', () => {
    const raw = `Designing for Scale
High-throughput systems in 2026
system.optimize()`;

    const candidates = parsePastedText(raw);
    expect(candidates.length).toBe(1);
    expect(candidates[0]?.type).toBe('cover');
    expect(candidates[0]?.fields.title).toBe('Designing for Scale');
    expect(candidates[0]?.fields.sub).toBe('High-throughput systems in 2026');
    expect(candidates[0]?.fields.rule).toBe('system.optimize()');
  });

  it('detects code snippet slides with language and fences', () => {
    const raw = `
# Carousel Cover
Introduction

---
### TypeScript Implementation
\`\`\`ts
export function calculateLatency(start: number): number {
  return performance.now() - start;
}
\`\`\`
Fast non-blocking measurement
    `;
    const candidates = parsePastedText(raw);
    expect(candidates.length).toBe(2);

    const codeCand = candidates[1]!;
    expect(codeCand.type).toBe('code');
    expect(codeCand.fields.title).toBe('TypeScript Implementation');
    expect(codeCand.fields.lang).toBe('ts');
    expect(codeCand.fields.code).toContain('calculateLatency');
    expect(codeCand.fields.note).toBe('Fast non-blocking measurement');
  });

  it('detects quote slides with blockquote syntax and attribution', () => {
    const raw = `
---
> Simplicity is prerequisite for reliability.
-- Edsger W. Dijkstra, Computing Pioneer
    `;
    const candidates = parsePastedText(raw);
    expect(candidates.length).toBe(1);

    const quoteCand = candidates[0]!;
    expect(quoteCand.type).toBe('quote');
    expect(quoteCand.fields.text).toBe('Simplicity is prerequisite for reliability.');
    expect(quoteCand.fields.author).toBe('Edsger W. Dijkstra');
    expect(quoteCand.fields.role).toBe('Computing Pioneer');
  });

  it('detects stat slides with prominent numeric metrics', () => {
    const raw = `
---
99.9%
Service Availability
Measured across all active clusters in Q3
    `;
    const candidates = parsePastedText(raw);
    expect(candidates.length).toBe(1);

    const statCand = candidates[0]!;
    expect(statCand.type).toBe('stat');
    expect(statCand.fields.value).toBe('99.9%');
    expect(statCand.fields.label).toBe('Service Availability');
    expect(statCand.fields.note).toContain('Measured across');
  });

  it('detects compare slides with Don\'t / Do or Bad / OK', () => {
    const raw = `
---
Architecture Dos and Don'ts
Don't: Store binary assets in localStorage
Do: Store binary assets in IndexedDB
    `;
    const candidates = parsePastedText(raw);
    expect(candidates.length).toBe(1);

    const compCand = candidates[0]!;
    expect(compCand.type).toBe('compare');
    expect(compCand.fields.title).toBe("Architecture Dos and Don'ts");
    expect(compCand.fields.t1).toBe('Store binary assets in localStorage');
    expect(compCand.fields.t2).toBe('Store binary assets in IndexedDB');
  });

  it('detects rule slides with IF / THEN structure', () => {
    const raw = `
---
Storage Protection Rule
If: Browser quota is exceeded
Then: Gracefully pause autosave and notify user
    `;
    const candidates = parsePastedText(raw);
    expect(candidates.length).toBe(1);

    const ruleCand = candidates[0]!;
    expect(ruleCand.type).toBe('rule');
    expect(ruleCand.fields.title).toBe('Storage Protection Rule');
    expect(ruleCand.fields.cond).toBe('Browser quota is exceeded');
    expect(ruleCand.fields.res).toBe('Gracefully pause autosave and notify user');
  });

  it('detects closing CTA slide on final chunk with CTA triggers', () => {
    const raw = `
Intro Slide
Start here
---
Middle Content
Details
---
Enjoyed this breakdown?
Follow for weekly software architecture deep-dives.
    `;
    const candidates = parsePastedText(raw);
    expect(candidates.length).toBe(3);

    const ctaCand = candidates[2]!;
    expect(ctaCand.type).toBe('cta');
    expect(ctaCand.fields.title).toBe('Enjoyed this breakdown?');
    expect(ctaCand.fields.body).toContain('Follow for weekly');
  });

  it('converts candidate to valid Slide schema', () => {
    const cand = parsePastedText('### Key Insight\n- Point 1\n- Point 2')[0]!;
    const slide = candidateToSlide(cand);

    expect(slide.id).toBeDefined();
    expect(slide.type).toBe('explain');
    expect(richTextToPlainText(slide.fields.title!)).toBe('Key Insight');
    expect(richTextToPlainText(slide.fields.body!)).toContain('- Point 1');
  });
});
