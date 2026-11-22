import { createStore, get, set, del, clear, keys, type UseStore } from 'idb-keyval';

export const ASSET_DB_NAME = 'slidethread-assets-db';
export const ASSET_STORE_NAME = 'media-assets';

let customStore: UseStore | undefined;

export function getAssetStore(): UseStore | undefined {
  if (!customStore) {
    if (typeof window !== 'undefined' && 'indexedDB' in window && window.indexedDB) {
      customStore = createStore(ASSET_DB_NAME, ASSET_STORE_NAME);
    }
  }
  return customStore;
}

// In-memory cache for Object URLs to manage browser memory and lifecycles
const objectUrlCache = new Map<string, string>();

/**
 * Stores a binary media Blob in IndexedDB under assetId.
 */
export async function saveAsset(assetId: string, blob: Blob): Promise<void> {
  const store = getAssetStore();
  if (!store) {
    throw new Error('IndexedDB is not available in this environment');
  }
  await set(assetId, blob, store);
}

/**
 * Retrieves a media Blob from IndexedDB.
 */
export async function getAsset(assetId: string): Promise<Blob | undefined> {
  const store = getAssetStore();
  if (!store) {
    return undefined;
  }
  return get<Blob>(assetId, store);
}

/**
 * Deletes a media asset from IndexedDB and revokes any active Object URL.
 */
export async function deleteAsset(assetId: string): Promise<void> {
  revokeAssetUrl(assetId);
  const store = getAssetStore();
  if (store) {
    await del(assetId, store);
  }
}

/**
 * Clears all stored media assets and revokes all active Object URLs.
 */
export async function clearAllAssets(): Promise<void> {
  revokeAllAssetUrls();
  const store = getAssetStore();
  if (store) {
    await clear(store);
  }
}

/**
 * Returns all asset IDs currently stored in IndexedDB.
 */
export async function getAllAssetIds(): Promise<string[]> {
  const store = getAssetStore();
  if (!store) {
    return [];
  }
  const allKeys = await keys(store);
  return allKeys.map(String);
}

/**
 * Gets or creates an Object URL for the specified assetId.
 * Caches the URL so multiple slide renders share a single Object URL.
 */
export async function getAssetUrl(assetId: string): Promise<string | undefined> {
  const cachedUrl = objectUrlCache.get(assetId);
  if (cachedUrl) {
    return cachedUrl;
  }

  const blob = await getAsset(assetId);
  if (!blob) {
    return undefined;
  }

  if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
    const objectUrl = URL.createObjectURL(blob);
    objectUrlCache.set(assetId, objectUrl);
    return objectUrl;
  }

  return undefined;
}

/**
 * Revokes a cached Object URL for an asset to free browser memory.
 */
export function revokeAssetUrl(assetId: string): void {
  const url = objectUrlCache.get(assetId);
  if (url && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
    URL.revokeObjectURL(url);
    objectUrlCache.delete(assetId);
  }
}

/**
 * Revokes all cached Object URLs.
 */
export function revokeAllAssetUrls(): void {
  if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
    for (const url of objectUrlCache.values()) {
      URL.revokeObjectURL(url);
    }
  }
  objectUrlCache.clear();
}
