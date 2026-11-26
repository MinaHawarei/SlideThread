import type { AspectClass, Project } from '../core/schema';
import { getShapeSvg } from '../assets';
import { STARTER_TEMPLATE_LOADERS } from './starters';
import { listUserTemplatePackages } from './userLibrary';
import { flattenUserPackage } from './portable';
import { STARTER_TEMPLATE_IDS } from './starters';
import { buildDesignManifest, buildTemplateZip, uniqueTemplateId } from './builder';
import { importTemplateZip } from './importZip';
import { captureDesign, type CaptureReport } from './designCapture';
import type { ValidatedTemplateData } from './schema';

/** Preview of what saving would capture, without writing anything. */
const snapshotAsset = (project: Pick<Project, 'templateSnapshot'>, id: string): string | undefined => project.templateSnapshot?.assets?.[id];
/** An asset can travel when it is a built-in shape or one of the base template's own bundled assets. */
const bundler = (project: Pick<Project, 'templateSnapshot'>) => (id: string) => Boolean(getShapeSvg(id)) || Boolean(snapshotAsset(project, id));

export function previewDesignCapture(project: Project, aspect: AspectClass, chosen: Record<string, number> = {}): CaptureReport {
  return captureDesign(project, aspect, chosen, bundler(project)).report;
}

/**
 * Save the design of a project (current aspect only) as a user template package that extends the project's base template.
 * Goes through the same import path as a hand-made ZIP.
 */
export async function saveProjectDesignAsTemplate(project: Project, aspect: AspectClass, name: string, chosen: Record<string, number> = {}): Promise<{ id: string; report: CaptureReport }> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Give the template a name.');
  if (trimmed.length > 60) throw new Error('Template names can be at most 60 characters.');
  const baseId = project.templateSnapshot?.id ?? project.templateId;
  const { composition, report } = captureDesign(project, aspect, chosen, bundler(project));
  const existing = await listUserTemplatePackages();
  const id = uniqueTemplateId(trimmed, existing.map((item) => item.id));
  const assets: Record<string, string> = {};
  const files: Record<string, string> = {};
  const bundledBlobs: Record<string, Blob> = {};
  let n = 0;
  for (const assetId of report.bundledAssets) {
    n += 1;
    const svg = getShapeSvg(assetId);
    if (svg) { assets[assetId] = `assets/shape-${n}.svg`; files[`assets/shape-${n}.svg`] = svg; continue; }
    const dataUrl = snapshotAsset(project, assetId)!;
    const blob = await (await fetch(dataUrl)).blob();
    const ext = blob.type.includes('svg') ? 'svg' : blob.type.includes('png') ? 'png' : 'webp';
    assets[assetId] = `assets/base-${n}.${ext}`;
    bundledBlobs[`assets/base-${n}.${ext}`] = blob;
  }

  let manifest: Record<string, unknown>;
  const blobFiles: Record<string, Blob> = { ...bundledBlobs };
  if (STARTER_TEMPLATE_IDS.includes(baseId)) {
    const loader = STARTER_TEMPLATE_LOADERS[baseId]!;
    const base = (await loader()) as ValidatedTemplateData;
    manifest = buildDesignManifest({ nameEn: trimmed, nameAr: trimmed }, id, baseId, { fonts: base.theme.fonts, radius: base.theme.radius }, composition, assets);
  } else {
    // A user-package base is folded into the new template, so exporting and importing it elsewhere cannot break.
    const flat = await flattenUserPackage(baseId);
    const designed = buildDesignManifest({ nameEn: trimmed, nameAr: trimmed }, id, baseId, { fonts: (flat.manifest.theme as { fonts: never }).fonts }, composition, {});
    const mergedComposition: Record<string, Record<string, Record<string, unknown>>> = structuredClone((flat.manifest.composition ?? {}) as never);
    for (const [type, aspects] of Object.entries(composition)) {
      mergedComposition[type] = mergedComposition[type] ?? {};
      for (const [asp, def] of Object.entries(aspects)) {
        const before = mergedComposition[type]![asp] ?? {};
        mergedComposition[type]![asp] = { ...before, ...def, slots: { ...(before.slots as object), ...(def.slots as object) }, ...(def.hiddenSlots ? { hiddenSlots: def.hiddenSlots } : {}), ...(def.elements ? { elements: def.elements } : {}) };
      }
    }
    const flatAssets = flat.manifest.assets as Record<string, string> | undefined;
    for (const key of Object.keys(assets)) if (flatAssets?.[key] && !files[assets[key]!]) { delete bundledBlobs[assets[key]!]; delete blobFiles[assets[key]!]; delete assets[key]; }
    manifest = { ...flat.manifest, id, name: designed.name, description: designed.description, author: designed.author, tags: designed.tags, composition: mergedComposition, assets: { ...(flat.manifest.assets as object), ...assets } };
    if (!Object.keys(manifest.assets as object).length) delete manifest.assets;
    Object.assign(blobFiles, flat.files);
  }
  const zipFile = await buildTemplateZip(manifest as { id: string }, undefined, files, blobFiles);
  await importTemplateZip(zipFile);
  return { id, report };
}
