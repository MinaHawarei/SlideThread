import { capture, type CaptureOptions } from './capture';
import { createZipFromPngs } from './zip';
import { createPdfFromPngs, type SlidePng } from './pdf';
import { dataUrlToBlob } from '../core/projectIO';

export type ExportFormat = 'png' | 'zip' | 'pdf';
export type ExportRange = 'all' | 'current';

export interface ExportProgress {
  current: number;
  total: number;
  message: string;
}

/**
 * Sanitizes project title for file naming.
 */
export function getBaseSlug(title?: string): string {
  const base = title && title.trim() ? title : 'slidethread';
  return (
    base
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'slidethread'
  );
}

/**
 * Checks whether Web Share API with file support is available.
 */
export function canWebShare(file?: File): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
    return false;
  }
  if (file && typeof navigator.canShare === 'function') {
    try {
      return navigator.canShare({ files: [file] });
    } catch {
      return false;
    }
  }
  return true;
}

/**
 * Triggers a browser download of a Blob.
 */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Shares via Web Share API if possible, otherwise falls back to browser download.
 */
export async function shareOrDownload(
  blob: Blob,
  filename: string,
  title: string = 'SlideThread'
): Promise<boolean> {
  if (typeof File !== 'undefined' && canWebShare()) {
    try {
      const file = new File([blob], filename, { type: blob.type });
      if (canWebShare(file)) {
        await navigator.share({
          title,
          files: [file],
        });
        return true;
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') {
        return false;
      }
    }
  }

  triggerBlobDownload(blob, filename);
  return true;
}

/**
 * Captures a single element and returns its PNG data URL.
 */
export async function captureSlideElement(
  element: HTMLElement,
  dimensions: { width: number; height: number },
  warmUp = false
): Promise<string> {
  const options: CaptureOptions = {
    library: 'html-to-image',
    dimensions,
    pixelRatio: 1,
    warmUp,
  };
  return await capture(element, options);
}

/**
 * Creates and downloads a single PNG file.
 */
export async function exportSinglePng(
  dataUrl: string,
  filename: string,
  useShare = false,
  title?: string
): Promise<void> {
  const blob = dataUrlToBlob(dataUrl);
  if (useShare) {
    await shareOrDownload(blob, filename, title);
  } else {
    triggerBlobDownload(blob, filename);
  }
}

/**
 * Generates and downloads a ZIP archive of PNGs.
 */
export async function exportZipArchive(
  pngDataUrls: string[],
  baseSlug: string
): Promise<Blob> {
  const entries = pngDataUrls.map((dataUrl, idx) => {
    const num = String(idx + 1).padStart(2, '0');
    return {
      dataUrl,
      filename: `${baseSlug}-${num}.png`,
    };
  });

  const zipBlob = await createZipFromPngs(entries, baseSlug);
  triggerBlobDownload(zipBlob, `${baseSlug}.zip`);
  return zipBlob;
}

/**
 * Generates and downloads a multi-page PDF document.
 */
export async function exportPdfDocument(
  slides: SlidePng[],
  baseSlug: string,
  title?: string
): Promise<Blob> {
  const pdfBlob = await createPdfFromPngs(slides, title || baseSlug);
  triggerBlobDownload(pdfBlob, `${baseSlug}.pdf`);
  return pdfBlob;
}
