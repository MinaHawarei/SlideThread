import { describe, expect, it } from 'vitest';
import {
  filterGalleryTemplates,
  getAvailableCategories,
  readTemplateFavorites,
  TEMPLATE_FAVORITES_KEY,
  toggleTemplateFavorite,
  type GalleryCategory,
  type GalleryTemplate,
} from '../../src/gallery/data';

const templates: GalleryTemplate[] = [
  {
    id: 'theme-dots',
    name: { en: 'Dot Notes', ar: 'ملاحظات منقطة' },
    description: { en: 'Light editorial dots.', ar: 'نقاط تحريرية.' },
    categories: ['general', 'coptic'],
    tags: ['dots', 'editorial'],
    colorFlexible: true,
    formats: ['post', 'carousel'],
    modes: ['light', 'dark'],
    languages: ['en', 'ar'],
    preview: 'starters/theme-dots/preview.webp',
  },
  {
    id: 'portrait-only',
    name: { en: 'Portrait Card', ar: 'بطاقة عمودية' },
    description: { en: 'A warm story.', ar: 'قصة دافئة.' },
    categories: ['lifestyle'],
    tags: ['portrait'],
    colorFlexible: false,
    formats: ['post'],
    modes: ['light'],
    languages: ['ar'],
    preview: 'starters/portrait-only/preview.webp',
  },
];

const categories: GalleryCategory[] = [
  { id: 'general', name: { en: 'General', ar: 'عام' }, description: { en: '', ar: '' }, icon: 'shapes', status: 'active' },
  { id: 'coptic', name: { en: 'Coptic', ar: 'قبطي' }, description: { en: '', ar: '' }, icon: 'shapes', status: 'planned' },
  { id: 'islamic', name: { en: 'Islamic', ar: 'إسلامي' }, description: { en: '', ar: '' }, icon: 'shapes', status: 'planned' },
];

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem(key: string) { return values.get(key) ?? null; },
    setItem(key: string, value: string) { values.set(key, value); },
  };
}

describe('template gallery data', () => {
  it('searches English and Arabic names, descriptions, IDs, and tags', () => {
    expect(filterGalleryTemplates(templates, { query: 'ملاحظات' }).map(({ id }) => id)).toEqual(['theme-dots']);
    expect(filterGalleryTemplates(templates, { query: 'portrait' }).map(({ id }) => id)).toEqual(['portrait-only']);
    expect(filterGalleryTemplates(templates, { query: 'Coptic' }).map(({ id }) => id)).toEqual(['theme-dots']);
  });

  it('applies category, language, format, and mode filters together', () => {
    expect(filterGalleryTemplates(templates, {
      categoryId: 'lifestyle',
      language: 'ar',
      contentType: 'post',
      mode: 'light',
    }).map(({ id }) => id)).toEqual(['portrait-only']);
    expect(filterGalleryTemplates(templates, { contentType: 'carousel' }).map(({ id }) => id)).toEqual(['theme-dots']);
    expect(filterGalleryTemplates(templates, { categoryId: 'missing' })).toEqual([]);
  });

  it('shows populated planned categories and hides empty categories regardless of status', () => {
    expect(getAvailableCategories(categories, templates).map(({ id }) => id)).toEqual(['general', 'coptic']);
    expect(categories.map(({ id }) => id)).toEqual(['general', 'coptic', 'islamic']);
  });

  it('persists unique favorite IDs and tolerates malformed or unavailable storage', () => {
    const storage = memoryStorage();
    storage.setItem(TEMPLATE_FAVORITES_KEY, '["theme-dots","theme-dots",4]');
    expect(readTemplateFavorites(storage)).toEqual(['theme-dots']);
    expect(toggleTemplateFavorite('portrait-only', storage)).toEqual(['theme-dots', 'portrait-only']);
    expect(toggleTemplateFavorite('theme-dots', storage)).toEqual(['portrait-only']);
    storage.setItem(TEMPLATE_FAVORITES_KEY, '{broken');
    expect(readTemplateFavorites(storage)).toEqual([]);
    const unavailableStorage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
    expect(toggleTemplateFavorite('theme-dots', unavailableStorage)).toEqual([]);
  });
});
