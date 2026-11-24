import { createTemplateRuntime } from '../runtime';

const manifestModules = import.meta.glob<unknown>('./*/template.json');
export const STARTER_TEMPLATE_IDS = Object.keys(manifestModules).map((path) => path.split('/')[1]!).sort();
export const STARTER_TEMPLATE_LOADERS = Object.fromEntries(
  Object.entries(manifestModules).map(([path, load]) => [path.split('/')[1]!, load]),
);

export const starterTemplateRuntime = createTemplateRuntime(STARTER_TEMPLATE_LOADERS);

export function loadStarterTemplate(id: string) {
  return starterTemplateRuntime.load(id);
}
