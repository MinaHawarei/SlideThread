import type { TemplateId } from '../core/schema';
import type { TemplateDef } from './types';
import { networkTemplate } from './network';
import { cleanTemplate } from './clean';
import { boldTemplate } from './bold';

export * from './types';
export { networkTemplate } from './network';
export { cleanTemplate } from './clean';
export { boldTemplate } from './bold';

type StarterTemplateId = 'network' | 'clean' | 'bold';
export const TEMPLATES: Record<StarterTemplateId, TemplateDef> = {
  network: networkTemplate,
  clean: cleanTemplate,
  bold: boldTemplate,
};

export function getTemplate(id: TemplateId = 'network'): TemplateDef {
  return Object.hasOwn(TEMPLATES, id) ? TEMPLATES[id as StarterTemplateId] : TEMPLATES.network;
}

export function getAllTemplates(): TemplateDef[] {
  return [TEMPLATES.network, TEMPLATES.clean, TEMPLATES.bold];
}
