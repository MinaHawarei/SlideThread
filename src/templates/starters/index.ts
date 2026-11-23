import { createTemplateRuntime } from '../runtime';

export const STARTER_TEMPLATE_IDS = ['tech-mesh', 'clean-minimal', 'bold-marketing', 'soft-gradient', 'heritage-geometric'] as const;

export const STARTER_TEMPLATE_LOADERS = {
  'tech-mesh': () => import('./tech-mesh/template.json'),
  'clean-minimal': () => import('./clean-minimal/template.json'),
  'bold-marketing': () => import('./bold-marketing/template.json'),
  'soft-gradient': () => import('./soft-gradient/template.json'),
  'heritage-geometric': () => import('./heritage-geometric/template.json'),
} as const;

export const starterTemplateRuntime = createTemplateRuntime(STARTER_TEMPLATE_LOADERS);

export function loadStarterTemplate(id: (typeof STARTER_TEMPLATE_IDS)[number]) {
  return starterTemplateRuntime.load(id);
}
