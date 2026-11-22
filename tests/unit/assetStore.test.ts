import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import {
  saveAsset,
  getAsset,
  deleteAsset,
  clearAllAssets,
  getAllAssetIds,
  getAssetUrl,
  revokeAssetUrl,
  revokeAllAssetUrls,
} from '../../src/core/assetStore';

describe('AssetStore with IndexedDB and Object URLs (Spec §8.2)', () => {
  beforeAll(() => {
    if (typeof URL.createObjectURL !== 'function') {
      URL.createObjectURL = (blob: Blob) => `blob:mock-url-${blob.size}-${blob.type}`;
    }
    if (typeof URL.revokeObjectURL !== 'function') {
      URL.revokeObjectURL = () => {};
    }
  });

  beforeEach(async () => {
    await clearAllAssets();
  });

  it('stores, retrieves, and deletes binary assets', async () => {
    const assetId = 'ast_test_123';
    const blob = new globalThis.Blob(['sample-image-content'], { type: 'image/png' });

    // Save
    await saveAsset(assetId, blob);

    // Retrieve
    const retrieved = await getAsset(assetId);
    expect(retrieved).toBeDefined();
    expect(retrieved?.type).toBe('image/png');
    expect(await retrieved?.text()).toBe('sample-image-content');

    // List all
    const keys = await getAllAssetIds();
    expect(keys).toContain(assetId);

    // Delete
    await deleteAsset(assetId);
    const afterDelete = await getAsset(assetId);
    expect(afterDelete).toBeUndefined();
  });

  it('manages Object URL creation, caching, and revocation', async () => {
    const assetId = 'ast_test_url';
    const blob = new globalThis.Blob(['png-content'], { type: 'image/png' });
    await saveAsset(assetId, blob);

    // Creates and caches URL
    const url1 = await getAssetUrl(assetId);
    expect(url1).toBeDefined();
    expect(typeof url1).toBe('string');

    // Subsequent retrieval returns the same cached URL
    const url2 = await getAssetUrl(assetId);
    expect(url2).toBe(url1);

    // Revoke
    revokeAssetUrl(assetId);
    revokeAllAssetUrls();
  });

  it('clearAllAssets clears all stored assets and URLs', async () => {
    await saveAsset('ast_1', new globalThis.Blob(['1']));
    await saveAsset('ast_2', new globalThis.Blob(['2']));

    expect((await getAllAssetIds()).length).toBe(2);

    await clearAllAssets();
    expect((await getAllAssetIds()).length).toBe(0);
  });
});
