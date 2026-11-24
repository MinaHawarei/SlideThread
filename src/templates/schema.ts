import { z } from 'zod';
import { FONT_REGISTRY } from '../fonts/registry';
import { generatePalette, type Palette } from '../core/palette';
import { SlideTypeSchema, ThemeModeSchema } from '../core/schema';
import { CATEGORY_REGISTRY } from './categories';

const BilingualNameSchema = z.object({ en: z.string().trim().min(1), ar: z.string().trim().min(1) }).strict();
const FontIdSchema = z.enum(Object.keys(FONT_REGISTRY) as [keyof typeof FONT_REGISTRY, ...(keyof typeof FONT_REGISTRY)[]]);
const PaletteSchema = z.object({
  bg: z.string().min(1).optional(), bg2: z.string().min(1).optional(), ink: z.string().min(1).optional(),
  mute: z.string().min(1).optional(), acc: z.string().min(1).optional(), acc2: z.string().min(1).optional(),
  line: z.string().min(1).optional(), card: z.string().min(1).optional(), ok: z.string().min(1).optional(),
  bad: z.string().min(1).optional(), onAcc: z.string().min(1).optional(),
}).strict();

export const TemplateSchema = z.object({
  schema: z.literal(1),
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: BilingualNameSchema,
  description: z.object({ en: z.string().optional(), ar: z.string().optional() }).strict().optional(),
  author: z.object({ name: z.string().trim().min(1), url: z.string().url().optional() }).strict(),
  license: z.string().trim().min(1),
  categories: z.array(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)).min(1),
  tags: z.array(z.string().trim().min(1)),
  extends: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  colorFlexible: z.boolean(),
  theme: z.object({
    modes: z.object({ dark: PaletteSchema.optional(), light: PaletteSchema.optional() }).strict().default({}),
    fonts: z.object({ display: FontIdSchema, body: FontIdSchema, mono: FontIdSchema.optional() }).strict(),
    typeScale: z.object({ h1: z.number().positive().optional(), h2: z.number().positive().optional(), body: z.number().positive().optional(), small: z.number().positive().optional(), mono: z.number().positive().optional() }).strict().optional(),
    radius: z.object({ card: z.number().min(0).max(9999).optional(), chip: z.number().min(0).max(9999).optional() }).strict().optional(),
  }).strict(),
  layouts: z.partialRecord(SlideTypeSchema, z.string().trim().min(1)).default({}),
  decor: z.object({ background: z.record(z.string(), z.unknown()).optional(), overlay: z.array(z.record(z.string(), z.unknown())).optional() }).strict().optional(),
  counter: z.object({ styles: z.array(z.enum(['number', 'bar', 'dots'])).min(1), defaultStyle: z.enum(['number', 'bar', 'dots']) }).strict().optional(),
  signature: z.object({ variants: z.array(z.string().min(1)).min(1), defaultVariant: z.string().min(1) }).strict().optional(),
  formats: z.union([z.literal('all'), z.array(z.string().min(1))]),
  customCss: z.string().min(1).optional(),
  assets: z.record(z.string().min(1), z.string().min(1)).optional(),
}).strict().superRefine((template, ctx) => {
  if (template.counter && !template.counter.styles.includes(template.counter.defaultStyle)) {
    ctx.addIssue({ code: 'custom', path: ['counter', 'defaultStyle'], message: 'Default counter style must be declared in styles' });
  }
  if (template.signature && !template.signature.variants.includes(template.signature.defaultVariant)) {
    ctx.addIssue({ code: 'custom', path: ['signature', 'defaultVariant'], message: 'Default signature variant must be declared in variants' });
  }
  if (template.extends === template.id) ctx.addIssue({ code: 'custom', path: ['extends'], message: 'A template cannot extend itself' });
  template.categories.forEach((categoryId, index) => {
    if (!CATEGORY_REGISTRY.some((category) => category.id === categoryId)) {
      ctx.addIssue({ code: 'custom', path: ['categories', index], message: `Unknown category: ${categoryId}` });
    }
  });
});

export type TemplateData = z.input<typeof TemplateSchema>;
export type ValidatedTemplateData = z.output<typeof TemplateSchema>;

export interface CategoryDefinition {
  id: string;
  name: { en: string; ar: string };
  description: { en: string; ar: string };
  icon: string;
  status: 'active' | 'planned';
}

export function resolveTemplate(id: string, templates: readonly TemplateData[]): ValidatedTemplateData {
  const byId = new Map<string, ValidatedTemplateData>();
  for (const source of templates) {
    const parsed = TemplateSchema.parse(source);
    if (byId.has(parsed.id)) throw new Error(`Duplicate template id: ${parsed.id}`);
    byId.set(parsed.id, parsed);
  }

  const resolving: string[] = [];
  const resolved = new Map<string, ValidatedTemplateData>();
  const visit = (templateId: string): ValidatedTemplateData => {
    const cached = resolved.get(templateId);
    if (cached) return cached;
    const template = byId.get(templateId);
    if (!template) throw new Error(`Unknown template: ${templateId}`);
    if (resolving.includes(templateId)) throw new Error(`Template inheritance cycle: ${[...resolving, templateId].join(' → ')}`);
    resolving.push(templateId);
    if (!template.extends) {
      resolving.pop();
      resolved.set(templateId, template);
      return template;
    }
    const parent = visit(template.extends);
    const merged = TemplateSchema.parse({
      ...parent,
      ...template,
      categories: template.categories,
      tags: template.tags,
      theme: {
        ...parent.theme,
        ...template.theme,
        modes: { ...parent.theme.modes, ...template.theme.modes },
        fonts: { ...parent.theme.fonts, ...template.theme.fonts },
        typeScale: { ...parent.theme.typeScale, ...template.theme.typeScale },
        radius: { ...parent.theme.radius, ...template.theme.radius },
      },
      layouts: { ...parent.layouts, ...template.layouts },
      decor: { ...parent.decor, ...template.decor },
      counter: template.counter ?? parent.counter,
      signature: template.signature ?? parent.signature,
      formats: template.formats,
      extends: undefined,
    });
    resolving.pop();
    resolved.set(templateId, merged);
    return merged;
  };
  return visit(id);
}

export function resolveTemplatePalette(template: ValidatedTemplateData, mode: z.infer<typeof ThemeModeSchema>, primaryColor: string): Palette {
  if (template.colorFlexible) return { ...generatePalette(primaryColor, mode), ...template.theme.modes[mode] } as Palette;
  const fixed = template.theme.modes[mode];
  if (!fixed) throw new Error(`Template ${template.id} has no fixed ${mode} palette`);
  const keys: Array<keyof Palette> = ['bg', 'bg2', 'ink', 'mute', 'acc', 'acc2', 'line', 'card', 'ok', 'bad', 'onAcc'];
  const missing = keys.filter((key) => !fixed[key]);
  if (missing.length) throw new Error(`Template ${template.id} fixed ${mode} palette is missing: ${missing.join(', ')}`);
  return fixed as Palette;
}
