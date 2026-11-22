import JSZip from 'jszip';

export interface ZipSlideEntry {
  dataUrl: string;
  filename?: string;
}

/**
 * Creates a ZIP archive containing all slide PNG files.
 * Files are named {baseSlug}-{nn}.png per Spec §9.2.
 */
export async function createZipFromPngs(
  slides: ZipSlideEntry[],
  baseSlug: string = 'slidethread'
): Promise<Blob> {
  if (slides.length === 0) {
    throw new Error('No slides provided to build ZIP');
  }

  const zip = new JSZip();

  slides.forEach((slide, index) => {
    const num = String(index + 1).padStart(2, '0');
    const filename = slide.filename || `${baseSlug}-${num}.png`;
    const base64Data = slide.dataUrl.replace(/^data:image\/\w+;base64,/, '');
    zip.file(filename, base64Data, { base64: true });
  });

  return await zip.generateAsync({ type: 'blob' });
}
