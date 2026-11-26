import JSZip from 'jszip';
import { STARTER_TEMPLATE_IDS } from './starters';
import { FONT_REGISTRY, type FontId } from '../fonts/registry';

export interface TemplateBuilderInput {
  nameEn: string;
  nameAr?: string;
  /** Shipped starter this template extends. */
  baseId: string;
  displayFont: FontId;
  bodyFont: FontId;
  monoFont?: FontId;
  cardRadius: number;
  chipRadius: number;
  authorName?: string;
}

export function slugify(name: string): string {
  const slug = name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40).replace(/-+$/g, '');
  return slug || `custom-${Date.now().toString(36)}`;
}

export function uniqueTemplateId(nameEn: string, taken: readonly string[]): string {
  const base = `my-${slugify(nameEn)}`;
  let id = base;
  let n = 2;
  while (taken.includes(id) || STARTER_TEMPLATE_IDS.includes(id)) id = `${base}-${n++}`;
  return id;
}

export function validateBuilderInput(input: TemplateBuilderInput): string | undefined {
  if (!input.nameEn.trim()) return 'Give the template a name.';
  if (input.nameEn.trim().length > 60) return 'Template names can be at most 60 characters.';
  if (!STARTER_TEMPLATE_IDS.includes(input.baseId)) return 'Pick a base template.';
  for (const font of [input.displayFont, input.bodyFont]) if (!Object.hasOwn(FONT_REGISTRY, font)) return 'Pick fonts from the list.';
  if (!(input.cardRadius >= 0 && input.cardRadius <= 120)) return 'Card radius must be between 0 and 120.';
  return undefined;
}

/** Builds a schema-1 manifest that extends a shipped starter, so layouts, decoration and fit rules stay valid. */
export function buildManifest(input: TemplateBuilderInput, id: string) {
  return {
    schema: 1 as const,
    id,
    extends: input.baseId,
    name: { en: input.nameEn.trim(), ar: (input.nameAr ?? '').trim() || input.nameEn.trim() },
    description: { en: `Custom template based on ${input.baseId}.`, ar: `قالب مخصص مبني على ${input.baseId}.` },
    author: { name: (input.authorName ?? '').trim() || 'You' },
    license: 'CC0-1.0',
    categories: ['general'],
    tags: ['custom', 'builder'],
    colorFlexible: true,
    theme: {
      fonts: { display: input.displayFont, body: input.bodyFont, ...(input.monoFont ? { mono: input.monoFont } : {}) },
      radius: { card: Math.round(input.cardRadius), chip: Math.round(input.chipRadius) },
    },
    formats: ['post', 'carousel'] as Array<'post' | 'carousel'>,
  };
}

/** Manifest for a template that captures a project's design (positions, hidden slots, portable elements) on top of its base. */
export function buildDesignManifest(input: Pick<TemplateBuilderInput, 'nameEn' | 'nameAr' | 'authorName'>, id: string, baseId: string, baseTheme: { fonts: { display: string; body: string; mono?: string }; radius?: { card?: number; chip?: number } }, composition: Record<string, unknown>, assets: Record<string, string> = {}) {
  return {
    schema: 1 as const,
    id,
    extends: baseId,
    name: { en: input.nameEn.trim(), ar: (input.nameAr ?? '').trim() || input.nameEn.trim() },
    description: { en: `Saved design based on ${baseId}.`, ar: `تصميم محفوظ مبني على ${baseId}.` },
    author: { name: (input.authorName ?? '').trim() || 'You' },
    license: 'CC0-1.0',
    categories: ['general'],
    tags: ['custom', 'saved-design'],
    colorFlexible: true,
    theme: { fonts: baseTheme.fonts, ...(baseTheme.radius ? { radius: baseTheme.radius } : {}) },
    composition,
    ...(Object.keys(assets).length ? { assets } : {}),
    formats: ['post', 'carousel'] as Array<'post' | 'carousel'>,
  };
}

export async function buildTemplateZip(manifest: { id: string }, preview?: Blob, files: Record<string, string> = {}, blobs: Record<string, Blob> = {}): Promise<File> {
  const zip = new JSZip();
  zip.file(`${manifest.id}/template.json`, JSON.stringify(manifest, null, 2));
  for (const [path, text] of Object.entries(files)) zip.file(`${manifest.id}/${path}`, text);
  for (const [path, blob] of Object.entries(blobs)) zip.file(`${manifest.id}/${path}`, await blob.arrayBuffer());
  if (preview) zip.file(`${manifest.id}/preview.webp`, await preview.arrayBuffer());
  const bytes = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
  return new File([bytes.buffer as ArrayBuffer], `${manifest.id}.zip`, { type: 'application/zip' });
}
