import { z } from 'zod';
import { ALLOWED_ASSET_LICENSES, ASSET_PACK_KINDS } from './types';

export const AssetItemSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Item ID must be lowercase kebab-case (e.g. arrow-right)',
  }),
  name: z.object({
    en: z.string().min(1, { message: 'English name is required' }),
    ar: z.string().min(1, { message: 'Arabic name is required' }),
  }),
  tags: z.object({
    en: z.array(z.string().min(1)).default([]),
    ar: z.array(z.string().min(1)).default([]),
  }),
  file: z.string().min(1).regex(/^[a-zA-Z0-9_-]+\.svg$/, {
    message: 'File must be an SVG filename without paths or directories (e.g. shape.svg)',
  }),
  recolorable: z.boolean().default(true),
  defaultWidth: z.number().positive().optional(),
  defaultHeight: z.number().positive().optional(),
}).strict();

export const AssetPackSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Pack ID must be lowercase kebab-case (e.g. core-shapes)',
  }),
  name: z.object({
    en: z.string().min(1, { message: 'English pack name is required' }),
    ar: z.string().min(1, { message: 'Arabic pack name is required' }),
  }),
  description: z.object({
    en: z.string(),
    ar: z.string(),
  }).optional(),
  kind: z.enum(ASSET_PACK_KINDS, {
    message: `Kind must be one of: ${ASSET_PACK_KINDS.join(', ')}`,
  }),
  version: z.string().regex(/^\d+\.\d+\.\d+.*$/, {
    message: 'Version must be semver formatted (e.g. 1.0.0)',
  }),
  license: z.enum(ALLOWED_ASSET_LICENSES, {
    message: `License must be one of permitted licenses: ${ALLOWED_ASSET_LICENSES.join(', ')}`,
  }),
  sourceUrl: z.string().url({ message: 'sourceUrl must be a valid URL' }).optional(),
  author: z.string().min(1, { message: 'Author is required' }),
  attribution: z.string().optional(),
  items: z.array(AssetItemSchema).min(1, { message: 'Asset pack must contain at least 1 item' }),
}).strict()
.superRefine((pack, ctx) => {
  // Attribution requirement for CC-BY licenses
  if ((pack.license === 'CC-BY' || pack.license === 'CC-BY-4.0') && (!pack.attribution || !pack.attribution.trim())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Attribution statement is required for CC-BY licensed packs',
      path: ['attribution'],
    });
  }

  // Duplicate item ID check
  const seenIds = new Set<string>();
  pack.items.forEach((item, index) => {
    if (seenIds.has(item.id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Duplicate item ID '${item.id}' found in pack`,
        path: ['items', index, 'id'],
      });
    }
    seenIds.add(item.id);
  });
});
