import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { processUserUpload, replaceUserUpload } from '../../src/core/uploads';
import { getAsset, clearAllAssets } from '../../src/core/assetStore';
import { exportProjectToJSON, importProjectFromJSON } from '../../src/core/projectIO';
import { CURRENT_SCHEMA_VERSION, type Project } from '../../src/core/schema';

describe('Uploads & Image Assets Handling (§5.6, REQ-10, Task R6-6)', () => {
  beforeAll(() => {
    if (!globalThis.URL.createObjectURL) {
      globalThis.URL.createObjectURL = () => 'blob:mock-url';
      globalThis.URL.revokeObjectURL = () => {};
    }

    // In jsdom Image.prototype.src doesn't trigger onload automatically
    Object.defineProperty(globalThis.Image.prototype, 'src', {
      set(this: HTMLImageElement) {
        setTimeout(() => {
          Object.defineProperty(this, 'naturalWidth', { value: 800, configurable: true });
          Object.defineProperty(this, 'naturalHeight', { value: 600, configurable: true });
          this.onload?.(new Event('load'));
        }, 10);
      },
    });

    if (!HTMLCanvasElement.prototype.toBlob) {
      HTMLCanvasElement.prototype.toBlob = function (callback, mimeType) {
        callback(new Blob(['mock-data'], { type: mimeType || 'image/jpeg' }));
      };
    }
  });

  beforeEach(async () => {
    try {
      await clearAllAssets();
    } catch {
      // Ignored
    }
  });

  describe('SVG Validation & Sanitization', () => {
    it('accepts and sanitizes safe SVG uploads', async () => {
      const cleanSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="red"/></svg>';
      const file = new File([cleanSvg], 'circle.svg', { type: 'image/svg+xml' });

      const result = await processUserUpload(file);
      expect(result.isSvg).toBe(true);
      expect(result.mimeType).toBe('image/svg+xml');
      expect(result.assetId).toMatch(/^upload_/);

      // Verify blob in IndexedDB
      const stored = await getAsset(result.assetId);
      expect(stored).toBeDefined();
      const text = await stored!.text();
      expect(text).toContain('<circle');
    });

    it('rejects malicious SVG uploads with script tags or event handlers', async () => {
      const maliciousSvg = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><circle cx="10" cy="10" r="5"/></svg>';
      const file = new File([maliciousSvg], 'hack.svg', { type: 'image/svg+xml' });

      await expect(processUserUpload(file)).rejects.toThrow(/Malicious or invalid SVG upload rejected/);
    });

    it('rejects malicious SVG uploads with inline onload event handlers', async () => {
      const evilSvg = '<svg xmlns="http://www.w3.org/2000/svg" onload="fetch(\'/steal\')"><rect width="10" height="10"/></svg>';
      const file = new File([evilSvg], 'evil.svg', { type: 'image/svg+xml' });

      await expect(processUserUpload(file)).rejects.toThrow(/Malicious or invalid SVG upload rejected/);
    });
  });

  describe('Raster Image Downscaling & Replacement', () => {
    it('processes and downscales image uploads into IndexedDB', async () => {
      // Create a mock small PNG file
      const dummyPngBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]); // PNG magic bytes
      const file = new File([dummyPngBytes], 'photo.png', { type: 'image/png' });

      const result = await processUserUpload(file);
      expect(result.isSvg).toBe(false);
      expect(result.assetId).toBeTruthy();

      const stored = await getAsset(result.assetId);
      expect(stored).toBeDefined();
    });

    it('replaces an existing asset while retaining assetId', async () => {
      const originalSvg = '<svg xmlns="http://www.w3.org/2000/svg"><rect width="20" height="20"/></svg>';
      const file1 = new File([originalSvg], 'orig.svg', { type: 'image/svg+xml' });
      const first = await processUserUpload(file1);

      const replacementSvg = '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="10"/></svg>';
      const file2 = new File([replacementSvg], 'new.svg', { type: 'image/svg+xml' });
      const replaced = await replaceUserUpload(first.assetId, file2);

      expect(replaced.assetId).toBe(first.assetId);

      const stored = await getAsset(first.assetId);
      const text = await stored!.text();
      expect(text).toContain('<circle');
      expect(text).not.toContain('<rect');
    });
  });

  describe('Project JSON Round-Trip with Extra Image Elements', () => {
    it('serializes project with extra image elements and restores them on import', async () => {
      const assetId = 'upload_extra_roundtrip_test';
      const cleanSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><path d="M10 10 h30 v30 h-30 z"/></svg>';
      await processUserUpload(new File([cleanSvg], 'shape.svg', { type: 'image/svg+xml' }), assetId);

      const project: Project = {
        id: 'proj_upload_roundtrip',
        schemaVersion: CURRENT_SCHEMA_VERSION,
        title: 'Upload Roundtrip Test',
        formatId: 'r_4_5',
        orientation: 'portrait',
        contentType: 'carousel',
        platform: 'linkedin',
        templateId: 'clean-minimal',
        primaryColor: '#0891b2',
        theme: 'dark',
        textDir: 'ltr',
        createdAt: 1000,
        updatedAt: 2000,
        slides: [
          {
            id: 'slide_1',
            type: 'explain',
            fields: {},
            extras: [
              {
                id: 'extra_img_1',
                kind: 'image',
                x: 0.1,
                y: 0.1,
                w: 0.3,
                h: 0.3,
                rotation: 0,
                z: 1,
                locked: false,
                shape: 'ellipse',
                media: {
                  assetId,
                  fit: 'cover',
                  placement: 'background',
                },
              },
            ],
          },
        ],
      };

      // Export to JSON bundle
      const { json } = await exportProjectToJSON(project);
      expect(json).toContain(assetId);
      expect(json).toContain('data:image/svg+xml;base64');

      // Clear local IndexedDB to test recovery
      await clearAllAssets();
      expect(await getAsset(assetId)).toBeUndefined();

      // Import project from JSON
      const imported = await importProjectFromJSON(json);
      expect(imported.id).toBe(project.id);
      expect(imported.slides[0]!.extras![0]!.media?.assetId).toBe(assetId);

      // Verify the asset was restored into IndexedDB
      const restored = await getAsset(assetId);
      expect(restored).toBeDefined();
      const restoredText = await restored!.text();
      expect(restoredText).toContain('<path');
    });
  });
});
