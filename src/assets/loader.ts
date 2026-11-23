import type {
  AssetPack,
  AssetPackSummary,
  LoadedAssetPack,
  LoadedAssetItem,
} from './types';
import { validateCompleteAssetPack, validateAssetPackJson } from './validator';

// In-memory cache for loaded asset packs
const loadedPacks = new Map<string, LoadedAssetPack>();
// In-memory registry for programmatically added packs (e.g. tests or custom extensions)
const registeredPacks = new Map<string, { pack: AssetPack; svgs: Record<string, string> }>();

// Vite dynamic glob imports for /assets/packs/*
const packJsonModules = import.meta.glob<AssetPack>(
  '../../assets/packs/*/pack.json',
  { import: 'default', eager: false }
);

const svgRawModules = import.meta.glob<string>(
  '../../assets/packs/*/*.svg',
  { query: '?raw', import: 'default', eager: false }
);

/**
 * Register a pack programmatically (useful for tests and dynamic packs)
 */
export function registerAssetPack(pack: AssetPack, svgs: Record<string, string>): void {
  const validation = validateCompleteAssetPack(pack, svgs);
  if (!validation.success) {
    throw new Error(`Failed to register asset pack '${pack.id}': ${validation.errors.join(', ')}`);
  }
  registeredPacks.set(pack.id, { pack: validation.data, svgs: validation.data.svgs });
  loadedPacks.set(pack.id, validation.data);
}

/**
 * Clear cached and registered packs (for test isolation)
 */
export function resetAssetRegistry(): void {
  loadedPacks.clear();
  registeredPacks.clear();
}

/**
 * List all available asset packs without loading all their SVG files
 */
export async function getAssetPacksSummary(): Promise<AssetPackSummary[]> {
  const summaries: AssetPackSummary[] = [];
  const discoveredIds = new Set<string>();

  // 1. Programmatically registered packs
  for (const [id, entry] of registeredPacks.entries()) {
    discoveredIds.add(id);
    summaries.push({
      id: entry.pack.id,
      name: entry.pack.name,
      description: entry.pack.description,
      kind: entry.pack.kind,
      version: entry.pack.version,
      license: entry.pack.license,
      author: entry.pack.author,
      itemCount: entry.pack.items.length,
    });
  }

  // 2. Discover packs from filesystem via glob
  for (const [filePath, importFn] of Object.entries(packJsonModules)) {
    const match = filePath.match(/\/assets\/packs\/([^/]+)\/pack\.json$/);
    if (!match || !match[1]) continue;
    const packId = match[1];
    if (discoveredIds.has(packId)) continue;

    try {
      const rawData = await importFn();
      const validation = validateAssetPackJson(rawData);
      if (validation.success) {
        discoveredIds.add(packId);
        summaries.push({
          id: validation.data.id,
          name: validation.data.name,
          description: validation.data.description,
          kind: validation.data.kind,
          version: validation.data.version,
          license: validation.data.license,
          author: validation.data.author,
          itemCount: validation.data.items.length,
        });
      }
    } catch (err) {
      console.warn(`Failed to inspect asset pack at ${filePath}:`, err);
    }
  }

  return summaries;
}

/**
 * Lazy load a complete asset pack with all its sanitized SVG contents
 */
export async function loadAssetPack(packId: string): Promise<LoadedAssetPack> {
  // Check cache first
  const cached = loadedPacks.get(packId);
  if (cached) return cached;

  // Check registered packs
  const registered = registeredPacks.get(packId);
  if (registered) {
    const loaded: LoadedAssetPack = {
      ...registered.pack,
      svgs: registered.svgs,
    };
    loadedPacks.set(packId, loaded);
    return loaded;
  }

  // Find pack module
  const packModuleKey = Object.keys(packJsonModules).find((key) =>
    key.endsWith(`/assets/packs/${packId}/pack.json`)
  );

  if (!packModuleKey || !packJsonModules[packModuleKey]) {
    throw new Error(`Asset pack '${packId}' not found`);
  }

  const rawPackJson = await packJsonModules[packModuleKey]();
  const packValidation = validateAssetPackJson(rawPackJson);
  if (!packValidation.success) {
    throw new Error(`Asset pack '${packId}' is invalid: ${packValidation.errors.join(', ')}`);
  }

  const pack = packValidation.data;
  const svgFiles: Record<string, string> = {};

  // Load all SVG files for this pack in parallel
  const svgLoadPromises = pack.items.map(async (item) => {
    const svgModuleKey = Object.keys(svgRawModules).find((key) =>
      key.endsWith(`/assets/packs/${packId}/${item.file}`)
    );
    if (svgModuleKey && svgRawModules[svgModuleKey]) {
      const content = await svgRawModules[svgModuleKey]();
      svgFiles[item.file] = content;
    }
  });

  await Promise.all(svgLoadPromises);

  const fullValidation = validateCompleteAssetPack(pack, svgFiles);
  if (!fullValidation.success) {
    throw new Error(`Asset pack '${packId}' validation failed: ${fullValidation.errors.join(', ')}`);
  }

  loadedPacks.set(packId, fullValidation.data);
  return fullValidation.data;
}

/**
 * Load a single asset item with its SVG content
 */
export async function loadAssetItem(packId: string, itemId: string): Promise<LoadedAssetItem> {
  const pack = await loadAssetPack(packId);
  const item = pack.items.find((i) => i.id === itemId);
  if (!item) {
    throw new Error(`Asset item '${itemId}' not found in pack '${packId}'`);
  }

  const svgContent = pack.svgs[itemId];
  if (!svgContent) {
    throw new Error(`SVG content for '${itemId}' is missing in pack '${packId}'`);
  }

  return {
    ...item,
    packId,
    svgContent,
  };
}
