import categories from './categories.json';

/**
 * Built-in template registry, discovered at build time from `src/templates/starters/<id>/template.json`.
 * Dropping a folder there adds a template; deleting the folder removes it. No code edits and no generated index.
 */
const manifests = import.meta.glob<Record<string, any>>('../starters/*/template.json', { eager: true, import: 'default' }); // eslint-disable-line @typescript-eslint/no-explicit-any

export const templateRegistry = {
  schema: 1 as const,
  categories: categories.map(({ id }) => id),
  templates: Object.entries(manifests)
    .filter(([, manifest]) => !manifest.testFixture)
    .map(([file, manifest]) => ({
      id: manifest.id as string,
      className: (manifest.className ?? manifest.id) as string,
      name: manifest.name as { en: string; ar: string },
      description: (manifest.description ?? {}) as { en?: string; ar?: string },
      categories: manifest.categories as string[],
      tags: manifest.tags as string[],
      colorFlexible: manifest.colorFlexible as boolean,
      theme: manifest.theme,
      counter: manifest.counter ?? null,
      formats: manifest.formats as Array<'post' | 'carousel'>,
      modes: (manifest.colorFlexible ? ['dark', 'light'] : Object.keys(manifest.theme.modes ?? {}).sort()) as string[],
      languages: ['ar', 'en'],
      preview: `starters/${file.split('/')[2]}/preview.webp`,
    }))
    .sort((a, b) => a.id.localeCompare(b.id)),
};
