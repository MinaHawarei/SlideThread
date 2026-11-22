import * as htmlToImage from 'html-to-image';
import * as modernScreenshot from 'modern-screenshot';
import { fontsReady } from '../core/fonts';

export type CaptureLibrary = 'html-to-image' | 'modern-screenshot';

export interface CaptureDimensions {
  width: number;
  height: number;
}

export interface CaptureOptions {
  library?: CaptureLibrary;
  dimensions?: CaptureDimensions;
  pixelRatio?: number;
  warmUp?: boolean;
}

/**
 * Awaits decode() for all images inside the given element.
 */
export async function imagesReady(element: HTMLElement): Promise<void> {
  const images = Array.from(element.querySelectorAll('img'));
  const decodePromises = images.map(async (img) => {
    try {
      if ('decode' in img) {
        await img.decode();
      }
    } catch {
      // Ignore image decode errors (e.g. invalid src or unsupported formats)
    }
  });
  await Promise.all(decodePromises);
}

/**
 * Captures an HTMLElement to a PNG data URL using the specified library.
 * Executes font and image readiness checks, and an optional warm-up pass.
 */
export async function capture(
  element: HTMLElement,
  options: CaptureOptions = {}
): Promise<string> {
  const {
    library = 'html-to-image',
    dimensions,
    pixelRatio = 1,
    warmUp = true,
  } = options;

  // 1. Ensure fonts & images are ready
  await fontsReady();
  await imagesReady(element);

  const width = dimensions?.width || element.offsetWidth;
  const height = dimensions?.height || element.offsetHeight;

  const htmlToImageOpts = {
    pixelRatio,
    width,
    height,
    canvasWidth: width,
    canvasHeight: height,
    skipAutoScale: true,
  };

  const modernScreenshotOpts = {
    scale: pixelRatio,
    width,
    height,
  };

  // 2. Warm-up capture pass to prevent first-render glitches (especially Safari)
  if (warmUp) {
    try {
      if (library === 'html-to-image') {
        await htmlToImage.toPng(element, htmlToImageOpts);
      } else {
        await modernScreenshot.domToPng(element, modernScreenshotOpts);
      }
    } catch (e) {
      console.warn('Warm-up capture failed, proceeding to real capture', e);
    }
  }

  // 3. Real capture pass
  if (library === 'html-to-image') {
    return await htmlToImage.toPng(element, htmlToImageOpts);
  } else {
    return await modernScreenshot.domToPng(element, modernScreenshotOpts);
  }
}
