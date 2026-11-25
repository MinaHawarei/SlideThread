import type { TemplateId } from '../core/schema';
import { FONT_REGISTRY } from '../fonts/registry';
import registry from './registry/index.json';
import { STARTER_TEMPLATE_IDS } from './starters';
import type { TemplateDef } from './types';

export * from './types';

const previewImages = import.meta.glob<string>('./starters/*/preview.webp', { eager: true, query: '?url', import: 'default' });
type RegistryTemplate = (typeof registry.templates)[number];

function definitionFor(id: string): TemplateDef {
  const entry = registry.templates.find((item) => item.id === id) as RegistryTemplate | undefined;
  if (!entry) throw new Error(`Unknown template package: ${id}`);
  const theme = entry.theme;
  const display = FONT_REGISTRY[theme.fonts.display as keyof typeof FONT_REGISTRY].family;
  const body = FONT_REGISTRY[theme.fonts.body as keyof typeof FONT_REGISTRY].family;
  const mono = FONT_REGISTRY[(theme.fonts.mono ?? 'jetbrains-mono') as keyof typeof FONT_REGISTRY].family;
  const typeScale = theme.typeScale as Partial<TemplateDef['typeScale']> | undefined;
  const radius = theme.radius as Partial<TemplateDef['radius']> | undefined;
  return {
    id: id as TemplateId,
    className: entry.className,
    nameKey: `wizard.template.${id}`,
    previewUrl: previewImages[`./starters/${id}/preview.webp`] ?? '',
    fonts: { display: `${display}, sans-serif`, body: `${body}, sans-serif`, mono: `${mono}, monospace` },
    typeScale: { h1: 112, h2: 76, body: 44, small: 30, mono: 34, ...typeScale },
    radius: { card: 24, chip: 9999, ...radius },
    ...(entry.counter ? { counter: entry.counter as TemplateDef['counter'] } : {}),
    Background: () => null,
  };
}

export function getTemplate(id: TemplateId | string = 'tech-mesh'): TemplateDef {
  return definitionFor(id);
}

export function getAllTemplates(): TemplateDef[] {
  return STARTER_TEMPLATE_IDS.map(definitionFor);
}
