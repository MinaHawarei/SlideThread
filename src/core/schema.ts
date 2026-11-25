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

export const TextAlignmentSchema = z.enum(['left', 'center', 'right']);
export type TextAlignment = z.infer<typeof TextAlignmentSchema>;

export const TextDirectionSchema = z.enum(['ltr', 'rtl']);
export type TextDirection = z.infer<typeof TextDirectionSchema>;

export const RichTextParagraphSchema = z.object({
  type: z.literal('p'),
  runs: z.array(RichTextRunSchema),
  align: TextAlignmentSchema.optional(),
  dir: TextDirectionSchema.optional(),
}).strict();

export const RichTextListItemSchema = z.object({
  type: z.literal('li'),
  runs: z.array(RichTextRunSchema),
  ordered: z.boolean().optional(),
  align: TextAlignmentSchema.optional(),
  dir: TextDirectionSchema.optional(),
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
  z: z.number().int().optional(),
  locked: z.boolean().optional(),
  hidden: z.boolean().optional(),
  rotation: z.number().finite().optional(),
  opacity: z.number().min(0).max(1).optional(),
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
  hidden: z.boolean().optional(),
  text: RichTextSchema.optional(),
  media: MediaRefSchema.optional(),
  assetId: z.string().min(1).optional(),
  shape: z.enum(['rectangle', 'ellipse', 'line', 'arrow']).optional(),
  fill: SafeColorValueSchema.optional(),
  opacity: z.number().min(0).max(1).optional(),
}).strict();
export type ExtraElement = z.infer<typeof ExtraElementSchema>;

const TemplateSlotFrameSchema = z.object({
  blockStart: z.number().min(0).max(1), inlineStart: z.number().min(0).max(1),
  inlineSize: z.number().positive().max(1), blockSize: z.number().positive().max(1),
  align: z.enum(['start', 'center', 'end']),
}).strict();
const TemplateAspectCompositionSchema = z.object({
  slots: z.record(z.string(), TemplateSlotFrameSchema).optional(),
  elements: z.array(ExtraElementSchema).optional(),
}).strict();
export const TemplateProjectSnapshotSchema = z.object({
  version: z.literal(1),
  id: z.string().min(1),
  name: z.object({ en: z.string().min(1), ar: z.string().min(1) }).optional(),
  paletteByMode: z.record(ThemeModeSchema, z.record(z.string(), z.string())),
  fonts: z.object({ display: z.string(), body: z.string(), mono: z.string() }).strict(),
  typeScale: z.object({ h1: z.number(), h2: z.number(), body: z.number(), small: z.number(), mono: z.number() }).strict(),
  radius: z.object({ card: z.number(), chip: z.number() }).strict(),
  counter: z.object({ styles: z.array(z.enum(['number', 'bar', 'dots'])), defaultStyle: z.enum(['number', 'bar', 'dots']) }).strict().optional(),
  composition: z.record(z.string(), z.record(z.string(), TemplateAspectCompositionSchema)),
  assets: z.record(z.string(), z.string()),
  className: z.string().optional(),
  gradientBackground: z.object({ from: z.string(), to: z.string(), x1: z.number(), y1: z.number(), x2: z.number(), y2: z.number() }).strict().optional(),
  decorationAssets: z.array(z.object({ asset: z.string(), x: z.number().min(0).max(1), y: z.number().min(0).max(1), w: z.number().positive().max(1), h: z.number().positive().max(1), opacity: z.number().min(0).max(1) }).strict()).optional(),
  decoration: z.object({ id: z.string(), params: z.record(z.string(), z.unknown()), intensity: z.number().min(0).max(1) }).optional(),
}).strict();
export type TemplateProjectSnapshot = z.infer<typeof TemplateProjectSnapshotSchema>;
export type TemplateProjectSnapshotInput = z.input<typeof TemplateProjectSnapshotSchema>;

export const SlideBackgroundSchema = z.object({
  assetId: z.string().optional(),
  symbolId: z.string().optional(),
  symbolPack: z.enum(['shapes', 'icons', 'emoji', 'stickers']).optional(),
  mode: z.enum(['fill', 'fit', 'repeat']).default('fill'),
  focal: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }).optional(),
  opacity: z.number().min(0).max(1).default(1),
  fillColor: z.string().optional(),
  tileSize: z.number().min(10).max(1000).optional(),
}).strict();
export type SlideBackground = z.input<typeof SlideBackgroundSchema>;
export type ValidatedSlideBackground = z.output<typeof SlideBackgroundSchema>;

export const SlideSchema = z.object({
  id: z.string(),
  type: SlideTypeSchema,
  fields: z.record(z.string(), RichTextSchema),
  media: MediaRefSchema.optional(),
  background: SlideBackgroundSchema.optional(),
  hideSignature: z.boolean().optional(),
  overrides: ElementOverridesSchema.default({}),
  extras: z.array(ExtraElementSchema).default([]),
}).strict();
/** Accepted v2 input shape; schema parsing supplies overrides/extras defaults. */
export type Slide = z.input<typeof SlideSchema>;
export type ValidatedSlide = z.output<typeof SlideSchema>;

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
  templateSnapshot: TemplateProjectSnapshotSchema.optional(),
  primaryColor: z.string().regex(/^#[\da-fA-F]{6}$/),
  theme: ThemeModeSchema,
  textDir: TextDirSchema,
  slides: z.array(SlideSchema),
  background: SlideBackgroundSchema.optional(),
  counter: CounterConfigSchema.default(DEFAULT_COUNTER_CONFIG),
  signature: SignatureConfigSchema.default(DEFAULT_SIGNATURE_CONFIG),
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
  pattern: PatternConfigSchema.default({ enabled: false, intensity: 1 }),
  createdAt: z.number(),
  updatedAt: z.number(),
}).strict();
/** Accepted v2 input shape; schema parsing supplies config defaults. */
export type Project = z.input<typeof ProjectSchema>;
export type ValidatedProject = z.output<typeof ProjectSchema>;

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
  appTheme: z.enum(['light', 'dark']).optional().default('light'),
}).strict();
/** Accepted settings input shape; schema parsing supplies counter/signature defaults. */
export type BrandSettings = z.input<typeof BrandSettingsSchema>;
import { parsePlainTextToRichText, serializeRichTextToPlainText } from './richText';

export type ValidatedBrandSettings = z.output<typeof BrandSettingsSchema>;

/** Converts a plain string to the v2 RichText document shape. */
export function plainTextToRichText(text: string): RichText {
  return parsePlainTextToRichText(text);
}

/** Joins blocks with newlines so the legacy single-field editor can keep working until R4. */
export function richTextToPlainText(value: RichText): string {
  return serializeRichTextToPlainText(value);
}

/** Returns plain text for the transitional field-based editor and renderer. */
export function plainTextFieldsToRichText(fields: Record<string, string>): Record<string, RichText> {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, plainTextToRichText(value)]));
}

export function richTextFieldsToPlainText(fields: Record<string, RichText>): Record<string, string> {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, richTextToPlainText(value)]));
}

/** Validates untrusted data against the v2 Project schema. */
export function validateProject(data: unknown): ValidatedProject {
  return ProjectSchema.parse(data);
}

/** Validates untrusted data against the brand settings schema, adding revision defaults when absent. */
export function validateBrandSettings(data: unknown): ValidatedBrandSettings {
  return BrandSettingsSchema.parse(data);
}
