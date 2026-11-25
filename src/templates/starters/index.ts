import { createTemplateRuntime } from '../runtime';
import { getUserTemplatePackage } from '../userLibrary';

const manifestModules = import.meta.glob<unknown>('./*/template.json');
export const STARTER_TEMPLATE_IDS = Object.keys(manifestModules).map((path) => path.split('/')[1]!).sort();
export const STARTER_TEMPLATE_LOADERS = Object.fromEntries(
  Object.entries(manifestModules).map(([path, load]) => [path.split('/')[1]!, load]),
);

export const starterTemplateRuntime = createTemplateRuntime(STARTER_TEMPLATE_LOADERS);
const packageLoaders = new Proxy(STARTER_TEMPLATE_LOADERS, {
  get(target, key: string) {
    if (Object.hasOwn(target, key)) return target[key];
    return async () => {
      const imported = await getUserTemplatePackage(key);
      if (!imported) throw new Error(`Unknown template package: ${key}`);
      return imported.manifest;
    };
  },
});
export const templatePackageRuntime = createTemplateRuntime(packageLoaders);
export function invalidateTemplatePackage(id: string): void {
  templatePackageRuntime.invalidate(id);
}

export function loadStarterTemplate(id: string) {
  return starterTemplateRuntime.load(id);
}
