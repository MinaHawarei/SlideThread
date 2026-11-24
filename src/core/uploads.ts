import { saveAsset } from './assetStore';
import { downscaleImage, MAX_IMAGE_LONG_SIDE } from './media';
import { validateAssetSvg } from '../assets/validator';

export interface ProcessedUpload {
  assetId: string;
  mimeType: string;
  width?: number;
  height?: number;
  isSvg: boolean;
}

/**
 * Validates and processes a user-uploaded file (Image or SVG).
 * - Images (JPEG, PNG, WebP) are downscaled client-side to max 2400 px long side.
 * - SVGs are validated against malicious scripts/handlers and sanitized via DOMPurify.
 * - Resulting clean Blob is stored in IndexedDB under a unique assetId.
 */
export async function processUserUpload(file: File | Blob, customAssetId?: string): Promise<ProcessedUpload> {
  const assetId = customAssetId || `upload_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const isSvg = file.type === 'image/svg+xml' || (file instanceof File && file.name.endsWith('.svg'));

  if (isSvg) {
    const text = await file.text();
    const validation = validateAssetSvg(text);
    if (!validation.success) {
      throw new Error(`Malicious or invalid SVG upload rejected: ${validation.errors.join(', ')}`);
    }

    const cleanSvg = validation.data;
    const blob = new Blob([cleanSvg], { type: 'image/svg+xml' });
    await saveAsset(assetId, blob);

    return {
      assetId,
      mimeType: 'image/svg+xml',
      isSvg: true,
    };
  }

  // Handle standard raster images (PNG, JPEG, WebP)
  const downscaled = await downscaleImage(file, MAX_IMAGE_LONG_SIDE);
  await saveAsset(assetId, downscaled.blob);

  return {
    assetId,
    mimeType: downscaled.mimeType,
    width: downscaled.width,
    height: downscaled.height,
    isSvg: false,
  };
}

/**
 * Replaces an existing media asset in IndexedDB with a new uploaded file.
 */
export async function replaceUserUpload(existingAssetId: string, file: File | Blob): Promise<ProcessedUpload> {
  return processUserUpload(file, existingAssetId);
}
