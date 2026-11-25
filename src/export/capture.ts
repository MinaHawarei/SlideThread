import * as htmlToImage from 'html-to-image';
import * as modernScreenshot from 'modern-screenshot';
import { fontsReady, getFontRequirementsForText, type FontRequirement } from '../core/fonts';
import { FONT_REGISTRY, type FontId, type FontWeight, type FontStyle } from '../fonts/registry';

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
  const textFonts = getFontRequirementsForText(element.textContent || '');
  const usesMono = Boolean(element.querySelector('code, pre, .slide-mono-line, .code-container, .sig-counter-badge'));
  const monoFonts = usesMono
    ? FONT_REGISTRY['jetbrains-mono'].weights.map((weight) => ({
        id: 'jetbrains-mono' as const,
        family: FONT_REGISTRY['jetbrains-mono'].family,
        weight: weight as FontWeight,
      }))
    : [];

  // Inspect any explicit font family styles on child elements (e.g. rich text runs)
  const fontEls = Array.from(element.querySelectorAll<HTMLElement>('[style*="font-family"]'));
  const extraFontReqs: FontRequirement[] = [];
  for (const el of fontEls) {
    const computed = window.getComputedStyle(el);
    const fam = (el.style.fontFamily || computed.fontFamily).toLowerCase();
    const requestedWeight = Number(computed.fontWeight);
    const requestedStyle: FontStyle = computed.fontStyle === 'italic' ? 'italic' : 'normal';
    for (const [id, def] of Object.entries(FONT_REGISTRY)) {
      if (fam.includes(def.family.toLowerCase()) || fam.includes(id)) {
        const weight = def.weights.includes(requestedWeight) ? requestedWeight : def.weights[0]!;
        const style: FontStyle = def.styles.includes(requestedStyle) ? requestedStyle : 'normal';
        extraFontReqs.push({ id: id as FontId, family: def.family, weight: weight as FontWeight, style, sampleText: element.textContent || 'SlideThread' });
      }
    }
  }

  const allReqs = [...textFonts, ...monoFonts, ...extraFontReqs];
  const seen = new Set<string>();
  const uniqueReqs = allReqs.filter((req) => {
    const key = `${req.family}:${req.weight}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const areFontsReady = await fontsReady(uniqueReqs);
  if (!areFontsReady) throw new Error('Font loading timed out before export capture');
  await imagesReady(element);

  const width = dimensions?.width || element.offsetWidth;
  const height = dimensions?.height || element.offsetHeight;

  const excludeNoExport = (node: HTMLElement) =>
    !(node instanceof HTMLElement && node.dataset?.noExport === 'true');

  const htmlToImageOpts = {
    pixelRatio,
    width,
    height,
    canvasWidth: width,
    canvasHeight: height,
    skipAutoScale: true,
    filter: excludeNoExport,
  };

  const modernScreenshotOpts = {
    scale: pixelRatio,
    width,
    height,
    filter: (node: Node) =>
      !(node instanceof HTMLElement && node.dataset?.noExport === 'true'),
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
