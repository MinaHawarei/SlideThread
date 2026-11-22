import { z } from 'zod';

export const CURRENT_SCHEMA_VERSION = 1;

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

export const MediaRefSchema = z.object({
  assetId: z.string(),
  fit: z.enum(['cover', 'contain']),
  focal: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }).optional(),
  placement: z.enum(['background', 'top', 'side', 'replace-text']),
});
export type MediaRef = z.infer<typeof MediaRefSchema>;

export const SlideSchema = z.object({
  id: z.string(),
  type: SlideTypeSchema,
  fields: z.record(z.string(), z.string()),
  media: MediaRefSchema.optional(),
  hideSignature: z.boolean().optional(),
});
export type Slide = z.infer<typeof SlideSchema>;

export const TemplateIdSchema = z.enum(['network', 'clean', 'bold']);
export type TemplateId = z.infer<typeof TemplateIdSchema>;

export const ProjectSchema = z.object({
  schemaVersion: z.number().int().positive(),
  id: z.string(),
  title: z.string(),
  platform: PlatformIdSchema,
  contentType: ContentTypeSchema,
  formatId: z.string(),
  orientation: OrientationSchema,
  templateId: TemplateIdSchema,
  primaryColor: z.string(),
  theme: ThemeModeSchema,
  textDir: TextDirSchema,
  slides: z.array(SlideSchema),
  createdAt: z.number(),
  updatedAt: z.number(),
});
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
  socials: z.array(
    z.object({
      platform: SocialPlatformSchema,
      handle: z.string(),
    })
  ),
  language: z.enum(['en', 'ar']),
  defaultTemplateId: z.string(),
  defaultPrimaryColor: z.string(),
  defaultTheme: ThemeModeSchema,
});
export type BrandSettings = z.infer<typeof BrandSettingsSchema>;

/**
 * Validates untrusted data against the Project schema.
 */
export function validateProject(data: unknown): Project {
  return ProjectSchema.parse(data);
}

/**
 * Validates untrusted data against the BrandSettings schema.
 */
export function validateBrandSettings(data: unknown): BrandSettings {
  return BrandSettingsSchema.parse(data);
}
