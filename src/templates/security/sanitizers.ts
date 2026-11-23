import DOMPurify, { type Config } from 'dompurify';
import * as cssTree from 'css-tree';

const SVG_TAGS = [
  'svg', 'g', 'defs', 'linearGradient', 'radialGradient', 'stop',
  'path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon',
];
const SVG_ATTRIBUTES = [
  'xmlns', 'viewBox', 'width', 'height', 'x', 'y', 'x1', 'x2', 'y1', 'y2',
  'cx', 'cy', 'r', 'rx', 'ry', 'd', 'points', 'fill', 'fill-rule', 'fill-opacity',
  'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-opacity',
  'opacity', 'offset', 'stop-color', 'stop-opacity', 'gradientUnits', 'gradientTransform',
];
const SVG_SANITIZER_CONFIG: Config = {
  ALLOWED_TAGS: SVG_TAGS,
  ALLOWED_ATTR: SVG_ATTRIBUTES,
  ALLOW_ARIA_ATTR: false,
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  FORBID_TAGS: ['script', 'foreignObject', 'style', 'image', 'use', 'a', 'animate', 'set'],
  FORBID_ATTR: ['style', 'href', 'xlink:href'],
  RETURN_TRUSTED_TYPE: false,
};

const SAFE_CSS_PROPERTIES = new Set([
  'align-items', 'aspect-ratio', 'background', 'background-color', 'background-image',
  'block-size', 'border', 'border-block-end', 'border-block-start', 'border-color',
  'border-inline-end', 'border-inline-start', 'border-radius', 'border-style', 'border-width',
  'box-shadow', 'color', 'column-gap', 'display', 'flex-direction', 'font-family', 'font-size',
  'font-style', 'font-weight', 'gap', 'grid-template-columns', 'grid-template-rows',
  'inline-size', 'justify-content', 'line-height', 'margin', 'margin-block', 'margin-inline',
  'max-block-size', 'max-inline-size', 'min-block-size', 'min-inline-size', 'object-fit',
  'opacity', 'overflow', 'padding', 'padding-block', 'padding-block-end', 'padding-block-start',
  'padding-inline', 'padding-inline-end', 'padding-inline-start', 'text-align', 'text-decoration',
  'white-space',
]);
const SAFE_CSS_FUNCTIONS = new Set([
  'var', 'calc', 'min', 'max', 'clamp', 'rgb', 'rgba', 'hsl', 'hsla', 'color', 'color-mix',
  'linear-gradient', 'radial-gradient', 'conic-gradient', 'repeating-linear-gradient',
  'repeating-radial-gradient', 'repeating-conic-gradient',
]);
const MAX_SVG_LENGTH = 100_000;
const MAX_CSS_LENGTH = 8_000;
const MAX_CSS_RULES = 128;
const MAX_CSS_DECLARATIONS = 512;

function isTemplateId(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function parseCss(source: string, context: 'stylesheet' | 'value' = 'stylesheet'): cssTree.CssNode {
  let parseError: Error | undefined;
  try {
    const ast = cssTree.parse(source, {
      context,
      onParseError(error) {
        parseError = new Error(error.message);
      },
    });
    if (parseError) throw parseError;
    return ast;
  } catch {
    throw new Error('Invalid CSS syntax');
  }
}

function assertSafeCssValue(value: cssTree.CssNode): void {
  let unsafe = false;
  cssTree.walk(value, (node) => {
    if (node.type === 'Raw' || node.type === 'Url') unsafe = true;
    if (node.type === 'Function' && !SAFE_CSS_FUNCTIONS.has(node.name.toLowerCase())) unsafe = true;
  });
  if (unsafe) throw new Error('CSS value contains an unsafe or unsupported function');
}

function assertSafeSvgPaint(value: string): void {
  assertSafeCssValue(parseCss(value, 'value'));
}

export function sanitizeSvg(source: string): string {
  if (source.length === 0 || source.length > MAX_SVG_LENGTH) throw new Error(`SVG size must be between 1 and ${MAX_SVG_LENGTH} characters`);
  const inputDocument = new DOMParser().parseFromString(source, 'image/svg+xml');
  if (inputDocument.querySelector('parsererror')) throw new Error('Input must be valid XML');
  const sanitized = DOMPurify.sanitize(source, SVG_SANITIZER_CONFIG);
  const document = new DOMParser().parseFromString(sanitized, 'image/svg+xml');
  if (document.querySelector('parsererror') || document.documentElement.localName.toLowerCase() !== 'svg') {
    throw new Error('Input must be a valid SVG document');
  }

  for (const element of Array.from(document.querySelectorAll('*'))) {
    for (const attribute of Array.from(element.attributes)) {
      if (attribute.name.toLowerCase() === 'fill' || attribute.name.toLowerCase() === 'stroke') {
        assertSafeSvgPaint(attribute.value);
      }
    }
  }
  return new XMLSerializer().serializeToString(document.documentElement);
}

export function sanitizeTemplateCss(source: string, templateId: string): string {
  if (!isTemplateId(templateId)) throw new Error('Invalid template id');
  if (source.length === 0 || source.length > MAX_CSS_LENGTH) throw new Error(`CSS size must be between 1 and ${MAX_CSS_LENGTH} characters`);
  const ast = parseCss(source) as cssTree.StyleSheet;
  const rules = ast.children.toArray();
  if (rules.length === 0 || rules.length > MAX_CSS_RULES) throw new Error('CSS rule count is empty or exceeds the limit');
  let declarationCount = 0;
  for (const rule of rules) {
    if (rule.type !== 'Rule') throw new Error('CSS at-rules and raw tokens are not allowed');
    if (rule.prelude.type !== 'SelectorList') throw new Error('Invalid CSS selector');
    const selectors = rule.prelude.children.toArray();
    if (selectors.length === 0) throw new Error('CSS selector is required');
    for (const selector of selectors) {
      if (selector.type !== 'Selector') throw new Error('Invalid CSS selector');
      const first = selector.children.toArray()[0];
      if (first?.type !== 'ClassSelector' || first.name !== `tpl-${templateId}`) {
        throw new Error(`Every selector must be scoped to .tpl-${templateId}`);
      }
      let hasUnsafeCombinator = false;
      cssTree.walk(selector, (node) => {
        if (node.type === 'Combinator' && (node.name === '+' || node.name === '~')) hasUnsafeCombinator = true;
      });
      if (hasUnsafeCombinator) throw new Error('Sibling selectors can escape the template scope');
    }

    for (const item of rule.block.children.toArray()) {
      if (item.type !== 'Declaration') throw new Error('Invalid CSS declaration');
      declarationCount += 1;
      if (declarationCount > MAX_CSS_DECLARATIONS) throw new Error('CSS declaration count exceeds the limit');
      const property = item.property.toLowerCase();
      if (!SAFE_CSS_PROPERTIES.has(property)) throw new Error(`CSS property is not allowed: ${property}`);
      assertSafeCssValue(item.value);
    }
  }
  return cssTree.generate(ast);
}
