import type { TemplateId } from '../core/schema';
import type { TemplateDef } from './types';
import { networkTemplate } from './network';
import { cleanTemplate } from './clean';
import { boldTemplate } from './bold';

export * from './types';
export { networkTemplate } from './network';
export { cleanTemplate } from './clean';
export { boldTemplate } from './bold';

export const TEMPLATES: Record<TemplateId, TemplateDef> = {
  network: networkTemplate,
  clean: cleanTemplate,
  bold: boldTemplate,
};

export function getTemplate(id: TemplateId = 'network'): TemplateDef {
  return TEMPLATES[id] || TEMPLATES.network;
}

export function getAllTemplates(): TemplateDef[] {
  return [TEMPLATES.network, TEMPLATES.clean, TEMPLATES.bold];
}
