import { describe, it, expect } from 'vitest';
import { createPdfFromPngs } from '@/export/pdf';
import { createZipFromPngs } from '@/export/zip';
import JSZip from 'jszip';

// 1x1 transparent PNG data URL
const DUMMY_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

describe('createPdfFromPngs', () => {
  it('throws error when slide array is empty', async () => {
    await expect(createPdfFromPngs([])).rejects.toThrow('No slides provided');
  });

  it('generates a PDF Blob with correct dimensions', async () => {
    const slides = [
      { dataUrl: DUMMY_PNG, width: 1080, height: 1350 },
      { dataUrl: DUMMY_PNG, width: 1080, height: 1080 },
    ];

    const pdfBlob = await createPdfFromPngs(slides, 'test-carousel');
    expect(pdfBlob).toBeInstanceOf(Blob);
    expect(pdfBlob.type).toBe('application/pdf');
    expect(pdfBlob.size).toBeGreaterThan(0);
  });
});

describe('createZipFromPngs', () => {
  it('throws error when slide array is empty', async () => {
    await expect(createZipFromPngs([])).rejects.toThrow('No slides provided');
  });

  it('generates a ZIP archive containing all PNGs', async () => {
    const slides = [
      { dataUrl: DUMMY_PNG },
      { dataUrl: DUMMY_PNG },
    ];

    const zipBlob = await createZipFromPngs(slides, 'test-export');
    expect(zipBlob).toBeInstanceOf(Blob);
    expect(zipBlob.size).toBeGreaterThan(0);

    // Read zip back to verify contents
    const zip = await JSZip.loadAsync(zipBlob);
    const filenames = Object.keys(zip.files);
    expect(filenames).toContain('test-export-01.png');
    expect(filenames).toContain('test-export-02.png');
  });
});
