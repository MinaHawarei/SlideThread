import { plainTextFieldsToRichText } from '../../src/core/schema';
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import {
  exportProjectToJSON,
  importProjectFromJSON,
  handleExportProject,
  blobToDataUrl,
  dataUrlToBlob,
  getExportFilename,
  LARGE_PROJECT_SIZE_THRESHOLD_BYTES,
} from '../../src/core/projectIO';
import { saveAsset, getAsset, clearAllAssets } from '../../src/core/assetStore';
import type { Project } from '../../src/core/schema';

describe('Project JSON I/O (Spec §8.2 & Plan §4)', () => {
  beforeAll(() => {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => { });
    if (typeof URL.createObjectURL !== 'function') {
      URL.createObjectURL = (blob: Blob) => `blob:mock-${blob.size}`;
    }
    if (typeof URL.revokeObjectURL !== 'function') {
      URL.revokeObjectURL = () => { };
    }
  });

  beforeEach(async () => {
    await clearAllAssets();
  });

  const sampleProject: Project = {
    id: 'proj_sample_123',
    schemaVersion: 2,
    title: 'Modern Architecture Patterns',
    formatId: 'r_4_5',
    orientation: 'portrait',
    platform: 'linkedin',
    contentType: 'carousel',
    templateId: 'network',
    theme: 'dark',
    primaryColor: '#06b6d4',
    textDir: 'ltr',
    slides: [
      {
        id: 'slide_1',
        type: 'cover',
        fields: plainTextFieldsToRichText({
          tag: 'ARCHITECTURE',
          title: 'Microservices vs Monoliths',
          subtitle: 'A practical comparison in 2026',
          ruleLine: 'system --diagnose',
        }),
      },
      {
        id: 'slide_2',
        type: 'image',
        fields: plainTextFieldsToRichText({
          title: 'System Blueprint',
          body: 'Distributed tracing overview',
        }),
        media: {
          assetId: 'asset_blueprint_01',
          fit: 'cover',
          placement: 'background',
        },
      },
    ],
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  };

  it('converts between Blob and base64 Data URL accurately', async () => {
    const rawData = 'Hello SlideThread Base64 World';
    const blob = new globalThis.Blob([rawData], { type: 'text/plain' });

    const dataUrl = await blobToDataUrl(blob);
    expect(dataUrl).toContain('data:text/plain;base64,');

    const restoredBlob = dataUrlToBlob(dataUrl);
    expect(restoredBlob.type).toBe('text/plain');
    const restoredText = await restoredBlob.text();
    expect(restoredText).toBe(rawData);
  });

  it('generates a clean sanitized export filename', () => {
    const fn1 = getExportFilename('My Awesome Carousel: Part 1!');
    expect(fn1).toMatch(/^my-awesome-carousel-part-1-\d{4}-\d{2}-\d{2}\.json$/);

    const fn2 = getExportFilename('');
    expect(fn2).toMatch(/^slidethread-project-\d{4}-\d{2}-\d{2}\.json$/);
  });

  it('exports and imports project roundtrip, embedding and restoring media assets', async () => {
    // Save asset in IndexedDB
    const imageContent = 'fake-binary-image-data-payload-for-test';
    const imageBlob = new globalThis.Blob([imageContent], { type: 'image/png' });
    await saveAsset('asset_blueprint_01', imageBlob);

    // Export
    const { json, isLarge } = await exportProjectToJSON(sampleProject);
    expect(isLarge).toBe(false);
    expect(json).toContain('asset_blueprint_01');

    // Wipe IndexedDB to simulate fresh machine / browser session
    await clearAllAssets();
    expect(await getAsset('asset_blueprint_01')).toBeUndefined();

    // Import from exported JSON
    const importedProject = await importProjectFromJSON(json);

    // Verify project integrity
    expect(importedProject.id).toBe(sampleProject.id);
    expect(importedProject.title).toBe(sampleProject.title);
    expect(importedProject.slides.length).toBe(2);
    expect(importedProject.slides[1]?.media?.assetId).toBe('asset_blueprint_01');

    // Verify restored asset in IndexedDB
    const restoredAsset = await getAsset('asset_blueprint_01');
    expect(restoredAsset).toBeDefined();
    expect(restoredAsset?.type).toBe('image/png');
    expect(await restoredAsset?.text()).toBe(imageContent);
  });

  it('detects large projects (> 5MB threshold) and flags them', async () => {
    // Generate an asset larger than 5 MB
    const largeSize = LARGE_PROJECT_SIZE_THRESHOLD_BYTES + 1024;
    const largeBuffer = new Uint8Array(largeSize);
    const largeBlob = new globalThis.Blob([largeBuffer], { type: 'application/octet-stream' });
    await saveAsset('asset_blueprint_01', largeBlob);

    const { isLarge, sizeBytes, sizeMB } = await exportProjectToJSON(sampleProject);
    expect(isLarge).toBe(true);
    expect(sizeBytes).toBeGreaterThan(LARGE_PROJECT_SIZE_THRESHOLD_BYTES);
    expect(parseFloat(sizeMB)).toBeGreaterThanOrEqual(5.0);
  });

  it('handleExportProject triggers warning callback on large projects', async () => {
    const largeSize = LARGE_PROJECT_SIZE_THRESHOLD_BYTES + 500;
    const largeBuffer = new Uint8Array(largeSize);
    const largeBlob = new globalThis.Blob([largeBuffer], { type: 'application/octet-stream' });
    await saveAsset('asset_blueprint_01', largeBlob);

    let warningFired = false;
    let receivedSizeMB = '';

    await handleExportProject(sampleProject, (sizeMB, proceed) => {
      warningFired = true;
      receivedSizeMB = sizeMB;
      expect(typeof proceed).toBe('function');
    });

    expect(warningFired).toBe(true);
    expect(parseFloat(receivedSizeMB)).toBeGreaterThanOrEqual(5.0);
  });

  it('handleExportProject proceeds without warning for small projects', async () => {
    const warningSpy = vi.fn();
    const result = await handleExportProject(
      {
        ...sampleProject,
        slides: [sampleProject.slides[0]!], // no media
      },
      warningSpy
    );

    expect(result).toBe(true);
    expect(warningSpy).not.toHaveBeenCalled();
  });

  it('throws descriptive errors on invalid or malformed JSON import', async () => {
    await expect(importProjectFromJSON('not json')).rejects.toThrow('File content is not valid JSON');
    await expect(importProjectFromJSON('null')).rejects.toThrow('Malformed project file');
    await expect(importProjectFromJSON('123')).rejects.toThrow('Malformed project file');
    await expect(importProjectFromJSON('""')).rejects.toThrow('Malformed project file');
  });

  it('imports raw legacy Project JSON without bundle wrapper', async () => {
    const rawJson = JSON.stringify({
      title: 'Legacy Project',
      formatId: 'r_1_1',
    });

    const project = await importProjectFromJSON(rawJson);
    expect(project.title).toBe('Legacy Project');
    expect(project.formatId).toBe('r_1_1');
    expect(project.slides).toBeDefined();
    expect(project.schemaVersion).toBe(2);
  });
});
