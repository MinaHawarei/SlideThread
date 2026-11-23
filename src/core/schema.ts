import { z } from 'zod';

export const CURRENT_SCHEMA_VERSION = 2;

export const PlatformIdSchema = z.enum(['instagram', 'linkedin', 'facebook', 'custom']);
export type PlatformId = z.infer<typeof PlatformIdSchema>;

export const ContentTypeSchema = z.enum(['post', 'carousel', 'story']);
export type ContentType = z.infer<typeof ContentTypeSchema>;

export const OrientationSchema = z.enum(['landscape', 'portrait']);
export type Orientation = z.infer<typeof OrientationSchema>;

export const ThemeModeSchema = z.enum(['dark', 'light']);
export type ThemeMode = z.infer<typeof ThemeModeSchema>;

export const TextDirSchema = z.enum(['auto', 'ltr', 'rtl']);
export type TextDir = z.infer<typeof TextDirSchema>;

export const AspectClassSchema = z.enum(['landscape', 'square', 'portrait', 'tall']);
export type AspectClass = z.infer<typeof AspectClassSchema>;

export const FormatDefSchema = z.object({
  id: z.string(),
  label: z.string(),
  aspectRatio: z.string().optional(),
  width: z.number().positive(),
  height: z.number().positive(),
  orientable: z.boolean(),
  platforms: z.array(PlatformIdSchema),
  contentTypes: z.array(ContentTypeSchema),
});
export type FormatDef = z.infer<typeof FormatDefSchema>;

export const SlideTypeSchema = z.enum([
  'cover',
  'explain',
  'rule',
  'code',
  'compare',
  'stat',
  'quote',
  'image',
  'cta',
]);
export type SlideType = z.infer<typeof SlideTypeSchema>;

export const FontIdSchema = z.string().min(1).max(64);
export type FontId = z.infer<typeof FontIdSchema>;

const SafeColorValueSchema = z.string().max(64).regex(
  /^(#[\da-fA-F]{3,8}|[a-z][a-z\d-]{0,31})$/,
  'Expected a hex color or a simple theme token'
);

export const RichTextMarksSchema = z.object({
  size: z.number().min(50).max(300).optional(),
  color: SafeColorValueSchema.optional(),
  font: FontIdSchema.optional(),
  bold: z.boolean().optional(),
  underline: z.boolean().optional(),
  highlight: SafeColorValueSchema.optional(),
}).strict();
export type RichTextMarks = z.infer<typeof RichTextMarksSchema>;

export const RichTextRunSchema = z.object({
  text: z.string(),
  marks: RichTextMarksSchema.optional(),
}).strict();
export type RichTextRun = z.infer<typeof RichTextRunSchema>;

export const RichTextParagraphSchema = z.object({
  type: z.literal('p'),
  runs: z.array(RichTextRunSchema),
}).strict();

export const RichTextListItemSchema = z.object({
  type: z.literal('li'),
  runs: z.array(RichTextRunSchema),
  ordered: z.boolean().optional(),
}).strict();

export const RichTextBlockSchema = z.discriminatedUnion('type', [
  RichTextParagraphSchema,
  RichTextListItemSchema,
]);
export type RichTextBlock = z.infer<typeof RichTextBlockSchema>;

export const RichTextSchema = z.object({
  type: z.literal('doc'),
  blocks: z.array(RichTextBlockSchema),
}).strict();
export type RichText = z.infer<typeof RichTextSchema>;

export const MediaRefSchema = z.object({
  assetId: z.string(),
  fit: z.enum(['cover', 'contain']),
  focal: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }).optional(),
  placement: z.enum(['background', 'top', 'side', 'replace-text']),
}).strict();
export type MediaRef = z.infer<typeof MediaRefSchema>;

export const ElementOverrideSchema = z.object({
  dx: z.number().finite(),
  dy: z.number().finite(),
  scale: z.number().positive().finite(),
  w: z.number().positive().finite().optional(),
  h: z.number().positive().finite().optional(),
}).strict();
export type ElementOverride = z.infer<typeof ElementOverrideSchema>;

export const ElementOverridesSchema = z.partialRecord(AspectClassSchema, z.record(z.string().min(1), ElementOverrideSchema));
export type ElementOverrides = z.infer<typeof ElementOverridesSchema>;

export const ExtraElementSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['image', 'icon', 'shape', 'sticker', 'text']),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  w: z.number().positive().max(1),
  h: z.number().positive().max(1),
  rotation: z.number().finite(),
  z: z.number().int(),
  locked: z.boolean(),
  text: RichTextSchema.optional(),
  media: MediaRefSchema.optional(),
  assetId: z.string().min(1).optional(),
  shape: z.enum(['rectangle', 'ellipse', 'line', 'arrow']).optional(),
  fill: SafeColorValueSchema.optional(),
}).strict();
export type ExtraElement = z.infer<typeof ExtraElementSchema>;

export const SlideSchema = z.object({
  id: z.string(),
  type: SlideTypeSchema,
  fields: z.record(z.string(), RichTextSchema),
  media: MediaRefSchema.optional(),
  hideSignature: z.boolean().optional(),
  overrides: ElementOverridesSchema,
  extras: z.array(ExtraElementSchema),
}).strict();
export type Slide = z.infer<typeof SlideSchema>;

/** Template IDs are data-defined and may be contributed without changing app code. */
export const TemplateIdSchema = z.string().min(1);
export type TemplateId = z.infer<typeof TemplateIdSchema>;

export const AnchorSchema = z.enum(['tl', 'tc', 'tr', 'bl', 'bc', 'br']);
export type Anchor = z.infer<typeof AnchorSchema>;

export const CounterConfigSchema = z.object({
  show: z.boolean(),
  anchor: AnchorSchema,
  style: z.enum(['number', 'bar', 'dots']),
  format: z.enum(['nn/nn', 'n', 'n/nn']),
  hideOnFirst: z.boolean(),
  hideOnLast: z.boolean(),
}).strict();
export type CounterConfig = z.infer<typeof CounterConfigSchema>;

export const SignatureConfigSchema = z.object({
  show: z.boolean(),
  anchor: z.union([AnchorSchema, z.literal('free')]),
  arrangement: z.enum(['inline', 'stacked']),
  size: z.enum(['sm', 'md', 'lg']),
  photoShape: z.enum(['circle', 'rounded', 'square']),
  showHandle: z.boolean(),
  showSocials: z.boolean(),
}).strict();
export type SignatureConfig = z.infer<typeof SignatureConfigSchema>;

export const DEFAULT_COUNTER_CONFIG: CounterConfig = {
  show: true,
  anchor: 'br',
  style: 'number',
  format: 'nn/nn',
  hideOnFirst: false,
  hideOnLast: false,
};

export const DEFAULT_SIGNATURE_CONFIG: SignatureConfig = {
  show: true,
  anchor: 'bc',
  arrangement: 'inline',
  size: 'md',
  photoShape: 'circle',
  showHandle: true,
  showSocials: false,
};

export const PatternConfigSchema = z.object({
  enabled: z.boolean(),
  intensity: z.number().min(0).max(1),
}).strict();
export type PatternConfig = z.infer<typeof PatternConfigSchema>;

export const ProjectSchema = z.object({
  schemaVersion: z.literal(CURRENT_SCHEMA_VERSION),
  id: z.string(),
  title: z.string(),
  platform: PlatformIdSchema,
  contentType: ContentTypeSchema,
  formatId: z.string(),
  orientation: OrientationSchema,
  templateId: TemplateIdSchema,
  primaryColor: z.string().regex(/^#[\da-fA-F]{6}$/),
  theme: ThemeModeSchema,
  textDir: TextDirSchema,
  slides: z.array(SlideSchema),
  counter: CounterConfigSchema,
  signature: SignatureConfigSchema,
  brandOverride: z.object({
    displayName: z.string().optional(),
    handle: z.string().optional(),
    photoDataUrl: z.string().optional(),
    showSignature: z.boolean().optional(),
    showSocials: z.boolean().optional(),
    showCounter: z.boolean().optional(),
    socials: z.array(z.object({ platform: z.enum([
      'instagram', 'linkedin', 'facebook', 'x', 'github', 'youtube', 'tiktok', 'website',
    ]), handle: z.string() }).strict()).optional(),
    language: z.enum(['en', 'ar']).optional(),
    defaultTemplateId: z.string().optional(),
    defaultPrimaryColor: z.string().optional(),
    defaultTheme: ThemeModeSchema.optional(),
    defaultCounter: CounterConfigSchema.optional(),
    defaultSignature: SignatureConfigSchema.optional(),
  }).strict().optional(),
  pattern: PatternConfigSchema,
  createdAt: z.number(),
  updatedAt: z.number(),
}).strict();
export type Project = z.infer<typeof ProjectSchema>;

export const SocialPlatformSchema = z.enum([
  'instagram',
  'linkedin',
  'facebook',
  'x',
  'github',
  'youtube',
  'tiktok',
  'website',
]);
export type SocialPlatform = z.infer<typeof SocialPlatformSchema>;

export const BrandSettingsSchema = z.object({
  displayName: z.string(),
  handle: z.string(),
  photoDataUrl: z.string().optional(),
  showSignature: z.boolean(),
  showSocials: z.boolean(),
  showCounter: z.boolean().optional(),
  defaultCounter: CounterConfigSchema.default(DEFAULT_COUNTER_CONFIG),
  defaultSignature: SignatureConfigSchema.default(DEFAULT_SIGNATURE_CONFIG),
  socials: z.array(z.object({
    platform: SocialPlatformSchema,
    handle: z.string(),
  }).strict()),
  language: z.enum(['en', 'ar']),
  defaultTemplateId: z.string(),
  defaultPrimaryColor: z.string(),
  defaultTheme: ThemeModeSchema,
}).strict();
export type BrandSettings = z.infer<typeof BrandSettingsSchema>;

/** Converts a plain string to the v2 RichText document shape. */
export function plainTextToRichText(text: string): RichText {
  return { type: 'doc', blocks: [{ type: 'p', runs: [{ text }] }] };
}

/** Joins blocks with newlines so the legacy single-field editor can keep working until R4. */
export function richTextToPlainText(value: RichText): string {
  return value.blocks.map((block) => block.runs.map((run) => run.text).join('')).join('\n');
}

export function plainTextFieldsToRichText(fields: Record<string, string>): Record<string, RichText> {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, plainTextToRichText(value)]));
}

export function richTextFieldsToPlainText(fields: Record<string, RichText>): Record<string, string> {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, richTextToPlainText(value)]));
}

/** Validates untrusted data against the v2 Project schema. */
export function validateProject(data: unknown): Project {
  return ProjectSchema.parse(data);
}

/** Validates untrusted data against the brand settings schema, adding revision defaults when absent. */
export function validateBrandSettings(data: unknown): BrandSettings {
  return BrandSettingsSchema.parse(data);
}
