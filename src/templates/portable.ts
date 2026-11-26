import JSZip from 'jszip';
import { STARTER_TEMPLATE_IDS } from './starters';
import { getUserTemplatePackage, type StoredUserTemplatePackage } from './userLibrary';
import type { ValidatedTemplateData } from './schema';

type Manifest = ValidatedTemplateData;
type Json = Record<string, unknown>;

export interface FlatPackage {
  /** Manifest body without id/name; callers add their own identity. Extends a shipped starter at most, never a user package. */
  manifest: Json;
  /** Files by package-relative path (assets/..., preview.webp is not included). */
  files: Record<string, Blob>;
}

/** Walk `extends` through the user library until a shipped starter or a package with no parent. Root first. */
async function loadChain(id: string): Promise<{ chain: StoredUserTemplatePackage[]; starter?: string }> {
  const chain: StoredUserTemplatePackage[] = [];
  let current: string | undefined = id;
  let starter: string | undefined;
  const seen = new Set<string>();
  while (current) {
    if (STARTER_TEMPLATE_IDS.includes(current)) { starter = current; break; }
    if (seen.has(current)) throw new Error(`Template inheritance cycle at “${current}”.`);
    seen.add(current);
    const pkg = await getUserTemplatePackage(current);
    if (!pkg) throw new Error(`Template “${current}” is not in your library, so its design cannot be made portable.`);
    chain.unshift(pkg);
    current = (pkg.manifest as Manifest).extends;
  }
  return { chain, starter };
}

/**
 * Merge a user package and everything it extends into one manifest that depends only on shipped starters, so the
 * result can be exported and imported on another device. Asset files from every layer are carried along.
 */
export async function flattenUserPackage(id: string): Promise<FlatPackage> {
  const { chain, starter } = await loadChain(id);
  const files: Record<string, Blob> = {};
  let merged: Json = {};
  chain.forEach((pkg, layer) => {
    const m = structuredClone(pkg.manifest) as unknown as Json;
    const assets: Record<string, string> = {};
    for (const [key, path] of Object.entries((m.assets as Record<string, string> | undefined) ?? {})) {
      const blob = pkg.files[path];
      if (!blob) throw new Error(`Template “${pkg.id}” is missing the file for asset “${key}”.`);
      const next = layer === chain.length - 1 ? path : path.replace(/^assets\//, `assets/l${layer}-`);
      files[next] = blob;
      assets[key] = next;
    }
    const prior = merged;
    const theme = { ...(prior.theme as Json | undefined), ...(m.theme as Json) } as Json;
    const priorTheme = (prior.theme ?? {}) as Json; const ownTheme = (m.theme ?? {}) as Json;
    for (const k of ['fonts', 'typeScale', 'radius']) if (priorTheme[k] || ownTheme[k]) theme[k] = { ...(priorTheme[k] as Json), ...(ownTheme[k] as Json) };
    theme.modes = { ...(priorTheme.modes as Json), ...(ownTheme.modes as Json) };
    const composition: Record<string, Record<string, Json>> = structuredClone((prior.composition ?? {}) as Record<string, Record<string, Json>>);
    for (const [type, aspects] of Object.entries((m.composition ?? {}) as Record<string, Record<string, Json>>)) {
      composition[type] = composition[type] ?? {};
      for (const [aspect, def] of Object.entries(aspects)) {
        const before = composition[type]![aspect] ?? {};
        composition[type]![aspect] = {
          ...before, ...def,
          slots: { ...(before.slots as Json), ...(def.slots as Json) },
          hiddenSlots: def.hiddenSlots ?? before.hiddenSlots,
          elements: def.elements ?? before.elements,
        };
        for (const k of ['slots', 'hiddenSlots', 'elements']) if (composition[type]![aspect]![k] === undefined) delete composition[type]![aspect]![k];
      }
    }
    merged = {
      ...prior, ...m,
      theme,
      layouts: { ...(prior.layouts as Json), ...(m.layouts as Json) },
      ...(Object.keys(composition).length ? { composition } : {}),
      assets: { ...(prior.assets as Json), ...assets },
    };
    delete merged.extends;
  });
  if (starter) merged.extends = starter;
  if (!Object.keys((merged.assets as Json) ?? {}).length) delete merged.assets;
  delete merged.customCss;
  return { manifest: merged, files };
}

/** Self-contained ZIP of a user template (own design, parents and all asset files) for transfer to another device. */
export async function exportUserTemplateZip(id: string): Promise<File> {
  const own = await getUserTemplatePackage(id);
  if (!own) throw new Error(`Template “${id}” is not in your library.`);
  const flat = await flattenUserPackage(id);
  const zip = new JSZip();
  zip.file(`${id}/template.json`, JSON.stringify({ ...flat.manifest, id }, null, 2));
  for (const [path, blob] of Object.entries(flat.files)) zip.file(`${id}/${path}`, await blob.arrayBuffer());
  const preview = own.files['preview.webp'];
  if (preview) zip.file(`${id}/preview.webp`, await preview.arrayBuffer());
  const bytes = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
  return new File([bytes.buffer as ArrayBuffer], `${id}.zip`, { type: 'application/zip' });
}
