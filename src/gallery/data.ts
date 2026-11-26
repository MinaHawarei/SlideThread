import { templateRegistry } from '../templates/registry';
import categoryRegistry from '../templates/registry/categories.json';

export interface GalleryTemplate {
  id: string;
  name: { en: string; ar: string };
  description: { en?: string; ar?: string };
  categories: string[];
  tags: string[];
  colorFlexible: boolean;
  formats: Array<'post' | 'carousel'>;
  modes: string[];
  languages: string[];
  preview: string;
}

export interface GalleryCategory {
  id: string;
  name: { en: string; ar: string };
  description: { en: string; ar: string };
  icon: string;
  status: 'active' | 'planned';
}

export interface TemplateGalleryIndex {
  schema: 1;
  categories: string[];
  templates: GalleryTemplate[];
}

export interface GalleryFilters {
  query?: string;
  categoryId?: string;
  language?: string;
  contentType?: 'post' | 'carousel';
  mode?: string;
  favoritesOnly?: boolean;
  favoriteIds?: readonly string[];
}

export const TEMPLATE_GALLERY_INDEX = templateRegistry as TemplateGalleryIndex;
export const TEMPLATE_CATEGORIES = categoryRegistry as GalleryCategory[];
export const TEMPLATE_FAVORITES_KEY = 'slidethread:template-favorites:v1';
const previewUrls = import.meta.glob<string>('../templates/starters/*/preview.webp', { eager: true, query: '?url', import: 'default' });

export function getTemplatePreviewUrl(templateId: string): string {
  const entry = Object.entries(previewUrls).find(([path]) => path.includes(`/starters/${templateId}/`));
  return entry?.[1] ?? '';
}

function defaultStorage(): Pick<Storage, 'getItem' | 'setItem'> | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

export function readTemplateFavorites(storage = defaultStorage()): string[] {
  if (!storage) return [];
  try {
    const value: unknown = JSON.parse(storage.getItem(TEMPLATE_FAVORITES_KEY) ?? '[]');
    if (!Array.isArray(value)) return [];
    return [...new Set(value.filter((id): id is string => typeof id === 'string' && id.length > 0))];
  } catch {
    return [];
  }
}

export function toggleTemplateFavorite(templateId: string, storage = defaultStorage()): string[] {
  const favorites = readTemplateFavorites(storage);
  const next = favorites.includes(templateId)
    ? favorites.filter((id) => id !== templateId)
    : [...favorites, templateId];
  try {
    storage?.setItem(TEMPLATE_FAVORITES_KEY, JSON.stringify(next));
  } catch {
    return favorites;
  }
  return next;
}

export function filterGalleryTemplates(
  templates: readonly GalleryTemplate[],
  filters: GalleryFilters = {},
): GalleryTemplate[] {
  const query = filters.query?.trim().toLocaleLowerCase() ?? '';
  const favorites = new Set(filters.favoriteIds ?? []);
  return templates.filter((template) => {
    if (filters.categoryId && !template.categories.includes(filters.categoryId)) return false;
    if (filters.language && !template.languages.includes(filters.language)) return false;
    if (filters.mode && !template.modes.includes(filters.mode)) return false;
    if (filters.contentType && !template.formats.includes(filters.contentType)) return false;
    if (filters.favoritesOnly && !favorites.has(template.id)) return false;
    if (!query) return true;
    const searchable = [
      template.id,
      template.name.en,
      template.name.ar,
      template.description.en ?? '',
      template.description.ar ?? '',
      ...template.categories.flatMap((id) => {
        const category = TEMPLATE_CATEGORIES.find((candidate) => candidate.id === id);
        return category ? [category.name.en, category.name.ar] : [id];
      }),
      ...template.tags,
    ].join(' ').toLocaleLowerCase();
    return searchable.includes(query);
  });
}

/** Categories appear when they have at least one template; status does not change their behavior. */
export function getAvailableCategories(
  categories: readonly GalleryCategory[],
  templates: readonly GalleryTemplate[],
): GalleryCategory[] {
  const populatedIds = new Set(templates.flatMap((template) => template.categories));
  return categories.filter((category) => populatedIds.has(category.id));
}
