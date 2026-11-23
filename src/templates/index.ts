import type { TemplateId } from '../core/schema';
import type { TemplateDef } from './types';
import { networkTemplate } from './network';
import { cleanTemplate } from './clean';
import { boldTemplate } from './bold';
import { softGradientTemplate } from './softGradient';
import { heritageGeometricTemplate } from './heritageGeometric';

export * from './types';
export { networkTemplate } from './network';
export { cleanTemplate } from './clean';
export { boldTemplate } from './bold';
export { softGradientTemplate } from './softGradient';
export { heritageGeometricTemplate } from './heritageGeometric';

type StarterTemplateId = 'tech-mesh' | 'clean-minimal' | 'bold-marketing' | 'soft-gradient' | 'heritage-geometric';
export const TEMPLATES: Record<StarterTemplateId, TemplateDef> = {
  'tech-mesh': networkTemplate,
  'clean-minimal': cleanTemplate,
  'bold-marketing': boldTemplate,
  'soft-gradient': softGradientTemplate,
  'heritage-geometric': heritageGeometricTemplate,
};

const LEGACY_TEMPLATE_IDS: Record<string, StarterTemplateId> = {
  network: 'tech-mesh',
  clean: 'clean-minimal',
  bold: 'bold-marketing',
};

export function getTemplate(id: TemplateId = 'network'): TemplateDef {
  const resolvedId = LEGACY_TEMPLATE_IDS[id] ?? id;
  return Object.hasOwn(TEMPLATES, resolvedId) ? TEMPLATES[resolvedId as StarterTemplateId] : TEMPLATES['tech-mesh'];
}

export function getAllTemplates(): TemplateDef[] {
  return Object.values(TEMPLATES);
}
