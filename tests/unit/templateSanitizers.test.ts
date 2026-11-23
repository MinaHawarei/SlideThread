import { describe, expect, it } from 'vitest';
import { sanitizeSvg, sanitizeTemplateCss } from '../../src/templates/security/sanitizers';

const root = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100">';

describe('template input sanitizers', () => {
  it('preserves allowlisted SVG geometry and removes executable markup and attributes', () => {
    const result = sanitizeSvg(`${root}<script>alert(1)</script><circle cx="20" cy="20" r="8" fill="#f00" onload="alert(2)"/><foreignObject><iframe src="https://evil.example"/></foreignObject></svg>`);
    expect(result).toContain('<circle');
    expect(result).not.toMatch(/script|foreignObject|iframe|onload|evil\.example/i);
  });

  it('removes linked image/use payloads and rejects external paint references', () => {
    const result = sanitizeSvg(`${root}<image href="https://evil.example/tracker.png"/><use xlink:href="javascript:alert(1)"/><path d="M0 0L10 10" stroke="currentColor"/></svg>`);
    expect(result).toContain('<path');
    expect(result).not.toMatch(/image|use|href|evil\.example|javascript:/i);
    expect(() => sanitizeSvg(`${root}<rect width="20" height="20" fill="url(https://evil.example/payload.svg#x)"/></svg>`)).toThrow(/unsafe or unsupported function/);
  });

  it('rejects malformed and non-SVG documents', () => {
    expect(() => sanitizeSvg('<div>not svg</div>')).toThrow(/valid SVG/);
    expect(() => sanitizeSvg('<svg><path></svg>')).toThrow(/valid XML/);
    expect(() => sanitizeSvg('x'.repeat(100_001))).toThrow(/size/);
  });

  it('accepts scoped logical CSS and serializes the parsed stylesheet', () => {
    const css = sanitizeTemplateCss('.tpl-demo .title { color: #17212b; padding-inline: 8px; border-inline-start: 2px solid currentColor; }', 'demo');
    expect(css).toContain('.tpl-demo .title');
    expect(css).toContain('padding-inline');
    expect(css).toContain('border-inline-start');
  });

  it.each([
    ['body { color: red }', 'scope'],
    ['.other .title { color: red }', 'scope'],
    ['.tpl-demo + body { color: red }', 'Sibling'],
    ['@import url(https://evil.example/a.css);', 'at-rules'],
    ['.tpl-demo { background-image: url(https://evil.example/a.png) }', 'unsafe'],
    ['.tpl-demo { background-image: u\\72l("https://evil.example/a.png") }', 'unsafe'],
    ['.tpl-demo { color: expression(alert(1)) }', 'unsafe'],
    ['.tpl-demo { position: fixed; left: 0 }', 'property'],
    ['.tpl-demo { margin-left: 4px }', 'property'],
  ])('rejects hostile or unsupported CSS: %s', (css, reason) => {
    expect(() => sanitizeTemplateCss(css, 'demo')).toThrow(new RegExp(reason, 'i'));
  });

  it('bounds CSS input and validates template identifiers', () => {
    expect(() => sanitizeTemplateCss('.tpl-demo { color: red }', '../demo')).toThrow(/Invalid template id/);
    expect(() => sanitizeTemplateCss(`.tpl-demo { color: red }${' '.repeat(8_000)}`, 'demo')).toThrow(/size/);
  });
});
