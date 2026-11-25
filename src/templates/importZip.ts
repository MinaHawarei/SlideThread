import JSZip from 'jszip';
import { STARTER_TEMPLATE_IDS, STARTER_TEMPLATE_LOADERS } from './starters';
import { createTemplateRuntime } from './runtime';
import { DECORATION_GENERATORS } from './decorations/generators';
import { TemplateSchema, resolveTemplatePalette, type ValidatedTemplateData } from './schema';
import { getContrastRatio } from '../core/palette';
import { FONT_REGISTRY } from '../fonts/registry';
import { sanitizeSvg } from './security/sanitizers';
import { listUserTemplatePackages, saveUserTemplatePackage, type StoredUserTemplatePackage } from './userLibrary';

const MAX_COMPRESSED_BYTES = 5 * 1024 * 1024;
const MAX_UNCOMPRESSED_BYTES = 512 * 1024;
const MAX_FILE_COUNT = 64;
const MAX_COMPRESSION_RATIO = 100;
const MAX_ASSET_BYTES = 300 * 1024;
const MAX_PREVIEW_BYTES = 40 * 1024;
const MAX_MANIFEST_BYTES = 128 * 1024;
const EXECUTABLE_EXTENSIONS = new Set(['.js', '.ts', '.tsx', '.css', '.mjs', '.cjs', '.jsx', '.html', '.htm']);
const ALLOWED_EXTENSIONS = new Set(['.json', '.svg', '.webp', '.png']);

interface CentralEntry {
  path: string;
  directory: boolean;
  compressedSize: number;
  uncompressedSize: number;
  externalAttributes: number;
  hostSystem: number;
}

function fail(message: string): never {
  throw new Error(message);
}

function normalizeArchivePath(path: string): string {
  const slashPath = path.replaceAll('\\', '/');
  if (/[\u0000-\u001f]/.test(slashPath)) fail(`ZIP path “${path}” contains a control character.`);
  if (slashPath.startsWith('/') || /^[a-zA-Z]:/.test(slashPath)) fail(`ZIP path “${path}” is absolute.`);
  const segments = slashPath.split('/');
  if (segments.some((part) => part === '..')) fail(`ZIP path “${path}” contains a parent-directory segment.`);
  return segments.filter((part) => part && part !== '.').join('/') + (slashPath.endsWith('/') ? '/' : '');
}

/** Inspect central-directory metadata before JSZip sees or inflates file data. */
async function inspectZip(file: File): Promise<CentralEntry[]> {
  if (file.size > MAX_COMPRESSED_BYTES) fail(`ZIP file is ${file.size} bytes; the compressed-size limit is ${MAX_COMPRESSED_BYTES} bytes.`);
  if (!file.size) fail('ZIP file is empty.');
  const buffer = await file.arrayBuffer();
  const bytes = new DataView(buffer);
  const lowerBound = Math.max(0, bytes.byteLength - 65_557);
  let endOffset = -1;
  for (let offset = bytes.byteLength - 22; offset >= lowerBound; offset -= 1) {
    if (bytes.getUint32(offset, true) === 0x06054b50) { endOffset = offset; break; }
  }
  if (endOffset < 0) fail('ZIP central directory is missing or malformed.');
  const disk = bytes.getUint16(endOffset + 4, true);
  const centralDisk = bytes.getUint16(endOffset + 6, true);
  const entryCount = bytes.getUint16(endOffset + 10, true);
  const centralSize = bytes.getUint32(endOffset + 12, true);
  const centralOffset = bytes.getUint32(endOffset + 16, true);
  if (disk || centralDisk) fail('Multi-disk ZIP archives are not supported.');
  if (entryCount === 0xffff || centralOffset === 0xffffffff || centralSize === 0xffffffff) fail('ZIP64 archives are not supported by the template importer.');
  if (entryCount > MAX_FILE_COUNT) fail(`ZIP contains ${entryCount} entries; the file-count limit is ${MAX_FILE_COUNT}.`);
  if (centralOffset + centralSize > endOffset || centralOffset + centralSize > bytes.byteLength) fail('ZIP central directory has invalid bounds.');

  const decoder = new TextDecoder('utf-8', { fatal: true });
  const entries: CentralEntry[] = [];
  const seen = new Set<string>();
  let offset = centralOffset;
  let totalUncompressed = 0;
  let totalCompressed = 0;
  for (let index = 0; index < entryCount; index += 1) {
    if (offset + 46 > bytes.byteLength || bytes.getUint32(offset, true) !== 0x02014b50) fail(`ZIP entry ${index + 1} has a malformed central-directory record.`);
    const flags = bytes.getUint16(offset + 8, true);
    const method = bytes.getUint16(offset + 10, true);
    const compressedSize = bytes.getUint32(offset + 20, true);
    const uncompressedSize = bytes.getUint32(offset + 24, true);
    const nameLength = bytes.getUint16(offset + 28, true);
    const extraLength = bytes.getUint16(offset + 30, true);
    const commentLength = bytes.getUint16(offset + 32, true);
    const hostSystem = bytes.getUint8(offset + 5);
    const externalAttributes = bytes.getUint32(offset + 38, true);
    const recordEnd = offset + 46 + nameLength + extraLength + commentLength;
    if (recordEnd > centralOffset + centralSize) fail(`ZIP entry ${index + 1} extends beyond the central directory.`);
    if (flags & 0x0001) fail(`ZIP entry ${index + 1} is encrypted; encrypted packages are not supported.`);
    if (method !== 0 && method !== 8) fail(`ZIP entry ${index + 1} uses unsupported compression method ${method}.`);
    let rawPath: string;
    try { rawPath = decoder.decode(new Uint8Array(buffer, offset + 46, nameLength)); }
    catch { fail(`ZIP entry ${index + 1} has an invalid UTF-8 filename.`); }
    const path = normalizeArchivePath(rawPath!);
    if (!path) fail(`ZIP entry ${index + 1} has an empty path.`);
    if (seen.has(path)) fail(`ZIP contains duplicate path “${path}”.`);
    seen.add(path);
    const directory = path.endsWith('/');
    if (directory && (compressedSize > 0 || uncompressedSize > 0)) fail(`ZIP directory entry “${path}” contains an unexpected data payload.`);
    const mode = externalAttributes >>> 16;
    if ((hostSystem === 3 && (mode & 0o170000) === 0o120000) || (externalAttributes & 0x400) !== 0) fail(`ZIP entry “${path}” is a symbolic link or reparse point.`);
    if (!directory) {
      const dot = path.lastIndexOf('.');
      const extension = dot > path.lastIndexOf('/') ? path.slice(dot).toLowerCase() : '';
      totalUncompressed += uncompressedSize;
      totalCompressed += compressedSize;
      if (uncompressedSize && !compressedSize) fail(`ZIP entry “${path}” has an invalid zero-byte compressed size.`);
      if (compressedSize > 0 && uncompressedSize / compressedSize > MAX_COMPRESSION_RATIO) {
        fail(`ZIP entry “${path}” has a suspicious compression ratio over ${MAX_COMPRESSION_RATIO}:1.`);
      }
      if (EXECUTABLE_EXTENSIONS.has(extension)) fail(`ZIP entry “${path}” is executable or CSS; code files are not allowed in template packages.`);
      if (!ALLOWED_EXTENSIONS.has(extension)) fail(`ZIP entry “${path}” has an unsupported file type.`);
    }
    entries.push({ path, directory, compressedSize, uncompressedSize, externalAttributes, hostSystem });
    offset = recordEnd;
  }
  const fileCount = entries.filter((entry) => !entry.directory).length;
  if (fileCount > MAX_FILE_COUNT) fail(`ZIP contains ${fileCount} files; the file-count limit is ${MAX_FILE_COUNT}.`);
  if (totalUncompressed > MAX_UNCOMPRESSED_BYTES) fail(`ZIP expands to ${totalUncompressed} bytes; the uncompressed-size limit is ${MAX_UNCOMPRESSED_BYTES} bytes.`);
  if (totalCompressed > 0 && totalUncompressed / totalCompressed > MAX_COMPRESSION_RATIO) fail(`ZIP has a suspicious overall compression ratio over ${MAX_COMPRESSION_RATIO}:1.`);
  return entries;
}

function parseManifest(bytes: Uint8Array): ValidatedTemplateData {
  if (bytes.byteLength > MAX_MANIFEST_BYTES) fail(`template.json is ${bytes.byteLength} bytes; the manifest limit is ${MAX_MANIFEST_BYTES} bytes.`);
  let input: unknown;
  try { input = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
  catch { fail('template.json is not valid UTF-8 JSON.'); }
  const parsed = TemplateSchema.safeParse(input!);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    fail(`template.json failed schema validation at ${firstIssue?.path.join('.') || '(root)'}: ${firstIssue?.message ?? 'invalid manifest'}`);
  }
  if (Object.hasOwn(input as object, 'customCss')) fail('template.json declares customCss, which is not supported for imported templates.');
  return parsed.data;
}

function assertNoExternalSvgReferences(path: string, raw: string): void {
  const document = new DOMParser().parseFromString(raw, 'image/svg+xml');
  if (document.querySelector('parsererror')) fail(`${path} is not valid SVG XML.`);
  for (const element of Array.from(document.querySelectorAll('*'))) {
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      if (name === 'href' || name === 'xlink:href' || name === 'src') fail(`${path} contains an external or linked resource reference (${attribute.name}).`);
      if (/url\s*\(|https?:\/\/|\/\//i.test(attribute.value) && !name.startsWith('xmlns')) fail(`${path} contains an external resource reference in ${attribute.name}.`);
    }
  }
}

function verifyImageSignature(path: string, data: Uint8Array): void {
  const extension = path.slice(path.lastIndexOf('.') + 1).toLowerCase();
  if (extension === 'png' && !(data.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => data[index] === byte))) {
    fail(`${path} has a .png extension but does not contain a PNG image.`);
  }
  if (extension === 'webp' && !(data.length >= 12 && String.fromCharCode(...data.slice(0, 4)) === 'RIFF' && String.fromCharCode(...data.slice(8, 12)) === 'WEBP')) {
    fail(`${path} has a .webp extension but does not contain a WebP image.`);
  }
}

function extractEntryBounded(entry: JSZip.JSZipObject, path: string, expectedSize: number, limit: number): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const streamable = entry as unknown as { internalStream: (type: 'uint8array') => { on: (event: string, listener: (data: Uint8Array) => void) => unknown; resume: () => unknown; pause: () => unknown } };
    const stream = streamable.internalStream('uint8array');
    const chunks: Uint8Array[] = [];
    let actualSize = 0;
    let ended = false;
    stream.on('data', (chunk) => {
      actualSize += chunk.byteLength;
      if (actualSize > limit || actualSize > expectedSize) {
        stream.pause();
        ended = true;
        reject(new Error(`ZIP entry “${path}” exceeded its declared or allowed expanded size during extraction.`));
        return;
      }
      chunks.push(chunk);
    });
    (stream as unknown as { on: (event: 'end' | 'error', listener: (error?: Error) => void) => unknown }).on('error', (error) => {
      if (!ended) { ended = true; reject(error ?? new Error(`Could not decompress ZIP entry “${path}”.`)); }
    });
    (stream as unknown as { on: (event: 'end', listener: () => void) => unknown }).on('end', () => {
      if (ended) return;
      ended = true;
      if (actualSize !== expectedSize) { reject(new Error(`ZIP entry “${path}” expanded to an unexpected size.`)); return; }
      const result = new Uint8Array(actualSize);
      let offset = 0;
      for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.byteLength; }
      resolve(result);
    });
    stream.resume();
  });
}

function checkManifestReferences(manifest: ValidatedTemplateData, files: Record<string, Blob>): void {
  for (const [key, reference] of Object.entries(manifest.assets ?? {})) {
    if (reference.startsWith('pack:')) {
      fail(`template.json assets.${key} references a bundled application pack; include the asset file in the ZIP instead.`);
    }
    const path = normalizeArchivePath(reference);
    if (!path.startsWith('assets/') || !files[path]) fail(`template.json assets.${key} must reference an included file under assets/: “${reference}”.`);
    if (!/\.(?:svg|webp|png)$/i.test(path)) fail(`template.json assets.${key} must reference an SVG, WebP, or PNG image.`);
  }
  for (const [slideType, aspects] of Object.entries(manifest.composition ?? {})) {
    for (const [aspect, composition] of Object.entries(aspects ?? {})) {
      for (const [index, element] of (composition?.elements ?? []).entries()) {
        for (const [blockIndex, block] of (element.text?.blocks ?? []).entries()) {
          for (const [runIndex, run] of block.runs.entries()) {
            const fontId = run.marks?.font;
            if (fontId && !Object.hasOwn(FONT_REGISTRY, fontId)) fail(`template.json composition.${slideType}.${aspect}.elements[${index}].text.blocks[${blockIndex}].runs[${runIndex}] references unknown font “${fontId}”.`);
          }
        }
        for (const [label, assetId] of [['assetId', element.assetId], ['media.assetId', element.media?.assetId]] as const) {
          if (!assetId) continue;
          if (/^(https?:|data:|blob:|\/\/)/i.test(assetId)) fail(`template.json composition.${slideType}.${aspect}.elements[${index}].${label} uses an external resource.`);
          const declared = Object.entries(manifest.assets ?? {}).some(([key, reference]) => key === assetId || reference === assetId);
          if (!declared) fail(`template.json composition.${slideType}.${aspect}.elements[${index}].${label} references undeclared asset “${assetId}”.`);
        }
      }
    }
  }
  for (const [index, overlay] of (manifest.decor?.overlay ?? []).entries()) {
    if (typeof overlay.asset === 'string' && !Object.hasOwn(manifest.assets ?? {}, overlay.asset)) fail(`template.json decor.overlay[${index}] references undeclared local asset “${overlay.asset}”.`);
    if (typeof overlay.id === 'string' && !Object.hasOwn(DECORATION_GENERATORS, overlay.id) && typeof overlay.asset !== 'string') fail(`template.json decor.overlay[${index}] uses unknown decoration generator “${overlay.id}”.`);
  }
  const backgroundId = manifest.decor?.background?.id;
  if (typeof backgroundId === 'string' && !Object.hasOwn(DECORATION_GENERATORS, backgroundId)) fail(`template.json decor.background uses unknown decoration generator “${backgroundId}”.`);
}

function validatePalette(manifest: ValidatedTemplateData): void {
  for (const mode of ['light', 'dark'] as const) {
    let palette;
    try { palette = resolveTemplatePalette(manifest, mode, mode === 'dark' ? '#35D0E6' : '#0B7FA6'); }
    catch (error) { fail(`template.json theme.modes.${mode}: ${error instanceof Error ? error.message : String(error)}`); }
    const failures = [
      ['ink/bg', palette.ink, palette.bg, 7], ['mute/bg', palette.mute, palette.bg, 4.5],
      ['accent/bg', palette.acc, palette.bg, 3], ['onAcc/accent', palette.onAcc, palette.acc, 4.5],
    ].filter(([, foreground, background, threshold]) => getContrastRatio(String(foreground), String(background)) < Number(threshold)).map(([label]) => label);
    if (failures.length) fail(`template.json ${mode} palette fails contrast checks: ${failures.join(', ')}.`);
  }
}

async function validateRuntime(manifest: ValidatedTemplateData, existing: StoredUserTemplatePackage[]): Promise<void> {
  if (manifest.extends && !STARTER_TEMPLATE_IDS.includes(manifest.extends) && !existing.some((item) => item.id === manifest.extends)) {
    fail(`template.json extends unknown template package “${manifest.extends}”.`);
  }
  const loaders = Object.fromEntries(existing.map((item) => [item.id, async () => item.manifest]));
  const runtime = createTemplateRuntime({ ...STARTER_TEMPLATE_LOADERS, ...loaders, [manifest.id]: async () => manifest });
  for (const mode of ['light', 'dark'] as const) {
    for (const slideType of ['cover', 'explain', 'rule', 'code', 'compare', 'stat', 'quote', 'image', 'cta'] as const) {
      for (const aspectClass of ['landscape', 'square', 'portrait', 'tall'] as const) {
        try {
          await runtime.resolve({
            templateId: manifest.id, mode, primaryColor: mode === 'dark' ? '#35D0E6' : '#0B7FA6', slideType, aspectClass,
            decorationContext: { tileIndex: 0, tileCount: 1, tileWidth: 1080, height: 1350, seed: 7 },
          });
        } catch (error) {
          fail(`template.json runtime resolution failed for ${slideType}/${aspectClass}/${mode}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
  }
}

export async function importTemplateZip(file: File): Promise<ValidatedTemplateData> {
  const entries = await inspectZip(file);
  const fileEntries = entries.filter((entry) => !entry.directory);
  if (!fileEntries.length) fail('ZIP archive contains no files.');
  const roots = new Set(entries.map((entry) => entry.path.split('/')[0]).filter(Boolean));
  if (roots.size !== 1) fail('ZIP must contain exactly one template package root folder.');
  const root = [...roots][0]!;
  if (entries.some((entry) => entry.path !== `${root}/` && !entry.path.startsWith(`${root}/`))) fail('Every ZIP entry must be inside the single package root folder.');
  for (const entry of fileEntries) {
    const relative = entry.path.slice(root.length + 1);
    if (relative !== 'template.json' && relative !== 'preview.webp' && !relative.startsWith('assets/')) fail(`ZIP file “${entry.path}” is outside the allowed package files (template.json, preview.webp, assets/).`);
  }
  const manifestPath = `${root}/template.json`;
  if (!fileEntries.some((entry) => entry.path === manifestPath)) fail(`ZIP is missing ${manifestPath}.`);

  const zip = await JSZip.loadAsync(file, { checkCRC32: false, createFolders: false });
  const extracted: Record<string, Blob> = {};
  const extractedBytes: Record<string, Uint8Array> = {};
  let actualTotal = 0;
  let actualAssetTotal = 0;
  for (const entry of fileEntries) {
    const zipEntry = zip.files[entry.path];
    if (!zipEntry || zipEntry.dir) fail(`ZIP entry “${entry.path}” could not be extracted.`);
    const relativePath = entry.path.slice(root.length + 1);
    const isAsset = entry.path.startsWith(`${root}/assets/`);
    const isPreview = relativePath.toLowerCase() === 'preview.webp';
    const isManifest = relativePath === 'template.json';
    if (isAsset && entry.uncompressedSize > MAX_ASSET_BYTES - actualAssetTotal) fail(`Package asset “${relativePath}” would exceed the ${MAX_ASSET_BYTES}-byte total asset limit.`);
    if (isPreview && entry.uncompressedSize > MAX_PREVIEW_BYTES) fail(`preview.webp is ${entry.uncompressedSize} bytes; the preview limit is ${MAX_PREVIEW_BYTES} bytes.`);
    if (isManifest && entry.uncompressedSize > MAX_MANIFEST_BYTES) fail(`template.json is ${entry.uncompressedSize} bytes; the manifest limit is ${MAX_MANIFEST_BYTES} bytes.`);
    const limit = Math.min(MAX_UNCOMPRESSED_BYTES - actualTotal, isAsset ? MAX_ASSET_BYTES - actualAssetTotal : Infinity, isPreview ? MAX_PREVIEW_BYTES : Infinity, isManifest ? MAX_MANIFEST_BYTES : Infinity);
    let bytes: Uint8Array;
    try { bytes = await extractEntryBounded(zipEntry, entry.path, entry.uncompressedSize, limit); }
    catch (error) { fail(error instanceof Error ? error.message : String(error)); }
    actualTotal += bytes!.byteLength;
    if (actualTotal > MAX_UNCOMPRESSED_BYTES) fail(`ZIP exceeded the ${MAX_UNCOMPRESSED_BYTES}-byte expanded-size limit during extraction.`);
    if (isAsset) {
      actualAssetTotal += bytes!.byteLength;
      if (actualAssetTotal > MAX_ASSET_BYTES) fail(`Package assets exceed the ${MAX_ASSET_BYTES}-byte total asset limit.`);
    }
    if (isPreview && bytes!.byteLength > MAX_PREVIEW_BYTES) fail(`preview.webp is ${bytes!.byteLength} bytes; the preview limit is ${MAX_PREVIEW_BYTES} bytes.`);
    if (isManifest && bytes!.byteLength > MAX_MANIFEST_BYTES) fail(`template.json is ${bytes!.byteLength} bytes; the manifest limit is ${MAX_MANIFEST_BYTES} bytes.`);
    if (isPreview || relativePath.toLowerCase().endsWith('.png') || relativePath.toLowerCase().endsWith('.webp')) verifyImageSignature(relativePath, bytes!);
    if (relativePath.toLowerCase().endsWith('.svg')) {
      const raw = new TextDecoder('utf-8', { fatal: true }).decode(bytes!);
      assertNoExternalSvgReferences(relativePath, raw);
      const safe = sanitizeSvg(raw);
      const safeBytes = new TextEncoder().encode(safe);
      extractedBytes[entry.path] = safeBytes;
      extracted[relativePath] = new Blob([safeBytes.buffer as ArrayBuffer], { type: 'image/svg+xml' });
    } else {
      extractedBytes[entry.path] = bytes!;
      const type = relativePath.endsWith('.webp') ? 'image/webp' : relativePath.endsWith('.png') ? 'image/png' : 'application/octet-stream';
      extracted[relativePath] = new Blob([bytes.buffer as ArrayBuffer], { type });
    }
  }

  const manifest = parseManifest(extractedBytes[manifestPath]!);
  if (root !== manifest.id) fail(`Package root folder “${root}” must match template.json id “${manifest.id}”.`);
  if (manifest.className && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(manifest.className)) fail(`template.json className must be a lowercase CSS-safe slug.`);
  if (STARTER_TEMPLATE_IDS.includes(manifest.id)) fail(`Template ID “${manifest.id}” is already used by a shipped template.`);
  const existing = await listUserTemplatePackages();
  if (existing.some((item) => item.id === manifest.id)) fail(`Template ID “${manifest.id}” is already in your imported template library.`);
  validatePalette(manifest);
  checkManifestReferences(manifest, extracted);
  await validateRuntime(manifest, existing);

  const record: StoredUserTemplatePackage = { id: manifest.id, manifest, files: extracted, installedAt: Date.now() };
  await saveUserTemplatePackage(record);
  return manifest;
}
