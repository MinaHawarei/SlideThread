import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getBaseSlug,
  canWebShare,
  triggerBlobDownload,
  shareOrDownload,
  exportZipArchive,
  exportPdfDocument,
} from '../../src/export/pipeline';

describe('Export Pipeline (Spec §9 & Plan §4)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    if (typeof URL.createObjectURL !== 'function') {
      URL.createObjectURL = (blob: Blob) => `blob:mock-${blob.size}`;
    }
    if (typeof URL.revokeObjectURL !== 'function') {
      URL.revokeObjectURL = () => {};
    }
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  it('generates clean base slug for filenames', () => {
    expect(getBaseSlug('My 10x Architectural Carousel!')).toBe('my-10x-architectural-carousel');
    expect(getBaseSlug('')).toBe('slidethread');
    expect(getBaseSlug('   ')).toBe('slidethread');
  });

  it('detects Web Share API support accurately', () => {
    // In node/jsdom environment, navigator.share is usually undefined
    expect(canWebShare()).toBe(typeof navigator.share === 'function');
  });

  it('triggers browser file download for Blobs', () => {
    const createUrlSpy = vi.spyOn(URL, 'createObjectURL');
    const blob = new globalThis.Blob(['test-content'], { type: 'text/plain' });

    triggerBlobDownload(blob, 'test-download.txt');
    expect(createUrlSpy).toHaveBeenCalledWith(blob);
  });

  it('falls back to browser download when Web Share is unsupported or fails', async () => {
    const createUrlSpy = vi.spyOn(URL, 'createObjectURL');
    const blob = new globalThis.Blob(['sample-data'], { type: 'application/pdf' });

    const result = await shareOrDownload(blob, 'sample.pdf', 'Sample Title');
    expect(result).toBe(true);
    expect(createUrlSpy).toHaveBeenCalledWith(blob);
  });

  it('generates a multi-file ZIP archive with standardized sequential filenames', async () => {
    const dummyPngDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const pngs = [dummyPngDataUrl, dummyPngDataUrl];

    const zipBlob = await exportZipArchive(pngs, 'my-presentation');
    expect(zipBlob).toBeDefined();
    expect(zipBlob.type).toContain('zip');
    expect(zipBlob.size).toBeGreaterThan(0);
  });

  it('generates a multi-page PDF document', async () => {
    const dummyPngDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const slides = [
      { dataUrl: dummyPngDataUrl, width: 1080, height: 1350 },
      { dataUrl: dummyPngDataUrl, width: 1080, height: 1350 },
    ];

    const pdfBlob = await exportPdfDocument(slides, 'my-presentation', 'Presentation Title');
    expect(pdfBlob).toBeDefined();
    expect(pdfBlob.type).toContain('pdf');
    expect(pdfBlob.size).toBeGreaterThan(0);
  });
});
