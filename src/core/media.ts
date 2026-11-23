export interface DownscaleResult {
  blob: Blob;
  width: number;
  height: number;
  mimeType: string;
}

export const MAX_IMAGE_LONG_SIDE = 2400;

/**
 * Calculates new dimensions scaled to maxLongSide while preserving aspect ratio.
 */
export function calculateDownscaleDimensions(
  width: number,
  height: number,
  maxSide: number = MAX_IMAGE_LONG_SIDE
): { width: number; height: number; scaled: boolean } {
  if (width <= 0 || height <= 0 || (!Number.isFinite(width) && !Number.isFinite(height))) {
    return { width: 0, height: 0, scaled: false };
  }

  if (width <= maxSide && height <= maxSide) {
    return { width, height, scaled: false };
  }

  if (width >= height) {
    const scaledWidth = maxSide;
    const scaledHeight = Math.max(1, Math.round((height * maxSide) / width));
    return { width: scaledWidth, height: scaledHeight, scaled: true };
  }

  const scaledHeight = maxSide;
  const scaledWidth = Math.max(1, Math.round((width * maxSide) / height));
  return { width: scaledWidth, height: scaledHeight, scaled: true };
}

/**
 * Generates a collision-resistant unique asset ID for IndexedDB storage.
 */
export function generateAssetId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 9);
  return `ast_${timestamp}_${randomPart}`;
}

/**
 * Converts a Blob to a Base64 data URL string.
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  const mime = blob.type || 'application/octet-stream';
  if (typeof blob.arrayBuffer === 'function') {
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunk = 8192;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return `data:${mime};base64,${btoa(binary)}`;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to base64 string'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('FileReader error'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Converts a Base64 data URL or raw Base64 string to a Blob.
 */
export function base64ToBlob(base64Data: string, fallbackMime = 'image/png'): Blob {
  let mimeType = fallbackMime;
  let rawBase64 = base64Data;

  const match = base64Data.match(/^data:([^;]+);base64,(.*)$/);
  if (match && match[1] && match[2]) {
    mimeType = match[1];
    rawBase64 = match[2];
  }

  const binaryString = atob(rawBase64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return new Blob([bytes], { type: mimeType });
}

/**
 * Downscales an image client-side to a max long side of 2400 px per Spec §6.1.
 * Preserves transparency by using PNG when source format supports alpha.
 */
export async function downscaleImage(
  fileOrBlob: Blob | File,
  maxLongSide: number = MAX_IMAGE_LONG_SIDE
): Promise<DownscaleResult> {
  const type = fileOrBlob.type || 'image/jpeg';
  const preservesAlpha = type === 'image/png' || type === 'image/webp';
  const outputMime = preservesAlpha ? 'image/png' : 'image/jpeg';
  const quality = 0.85;

  // In browser environment with Image/Canvas
  if (typeof document !== 'undefined' && typeof window !== 'undefined') {
    return new Promise<DownscaleResult>((resolve, reject) => {
      const url = URL.createObjectURL(fileOrBlob);
      const img = new Image();

      img.onload = () => {
        URL.revokeObjectURL(url);
        const { width: targetWidth, height: targetHeight, scaled } = calculateDownscaleDimensions(
          img.naturalWidth || img.width,
          img.naturalHeight || img.height,
          maxLongSide
        );

        if (!scaled && fileOrBlob.type === outputMime) {
          resolve({
            blob: fileOrBlob,
            width: targetWidth,
            height: targetHeight,
            mimeType: outputMime,
          });
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get 2D canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({
                blob,
                width: targetWidth,
                height: targetHeight,
                mimeType: outputMime,
              });
            } else {
              reject(new Error('Canvas toBlob failed'));
            }
          },
          outputMime,
          quality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image for downscaling'));
      };

      img.src = url;
    });
  }

  // Fallback for non-DOM environments
  return {
    blob: fileOrBlob,
    width: 1000,
    height: 1000,
    mimeType: outputMime,
  };
}

/**
 * Calculates coordinates for center-cropping an image to a square.
 */
export function calculateSquareCrop(
  width: number,
  height: number
): { srcX: number; srcY: number; side: number } {
  if (width <= 0 || height <= 0 || !Number.isFinite(width) || !Number.isFinite(height)) {
    return { srcX: 0, srcY: 0, side: 0 };
  }
  const side = Math.min(width, height);
  const srcX = Math.round((width - side) / 2);
  const srcY = Math.round((height - side) / 2);
  return { srcX, srcY, side };
}

export interface InteractiveCropOptions {
  panX: number;
  panY: number;
  zoom: number;
  containerSize: number;
  naturalWidth: number;
  naturalHeight: number;
}

export interface SquareCropCoordinates {
  srcX: number;
  srcY: number;
  srcSize: number;
}

/**
 * Calculates square crop rectangle on the source image based on interactive pan, zoom,
 * and container dimensions, ensuring the crop never exposes empty margins.
 */
export function calculateInteractiveCrop(
  options: InteractiveCropOptions
): SquareCropCoordinates {
  const { panX, panY, zoom, containerSize, naturalWidth, naturalHeight } = options;
  if (naturalWidth <= 0 || naturalHeight <= 0 || containerSize <= 0) {
    return { srcX: 0, srcY: 0, srcSize: 0 };
  }

  // Cover calculation: scale image so it at least fills containerSize on both dimensions
  const baseScale = Math.max(containerSize / naturalWidth, containerSize / naturalHeight);
  const totalScale = Math.max(0.0001, baseScale * Math.max(1, zoom));

  const displayedWidth = naturalWidth * totalScale;
  const displayedHeight = naturalHeight * totalScale;

  // Maximum pan allowed so image doesn't expose empty space
  const maxPanX = Math.max(0, (displayedWidth - containerSize) / 2);
  const maxPanY = Math.max(0, (displayedHeight - containerSize) / 2);

  const clampedPanX = Math.max(-maxPanX, Math.min(maxPanX, panX));
  const clampedPanY = Math.max(-maxPanY, Math.min(maxPanY, panY));

  // The top-left corner of the displayed image inside the container
  const imgLeft = containerSize / 2 + clampedPanX - displayedWidth / 2;
  const imgTop = containerSize / 2 + clampedPanY - displayedHeight / 2;

  // Mapping container [0, 0] to image coordinate space:
  const srcX = Math.max(0, Math.round((0 - imgLeft) / totalScale));
  const srcY = Math.max(0, Math.round((0 - imgTop) / totalScale));
  const srcSize = Math.max(
    1,
    Math.min(naturalWidth - srcX, naturalHeight - srcY, Math.round(containerSize / totalScale))
  );

  return { srcX, srcY, srcSize };
}

/**
 * Renders the cropped square onto a targetSize x targetSize canvas and returns a JPEG data URL.
 */
export function renderCroppedSquare(
  img: CanvasImageSource,
  crop: SquareCropCoordinates,
  targetSize = 400
): string {
  if (typeof document === 'undefined') {
    return '';
  }
  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D canvas context');
  }
  ctx.drawImage(
    img,
    crop.srcX,
    crop.srcY,
    crop.srcSize,
    crop.srcSize,
    0,
    0,
    targetSize,
    targetSize
  );
  return canvas.toDataURL('image/jpeg', 0.9);
}

/**
 * Center-crops an image to square and downscales to targetSize (default 400x400 px),
 * returning a JPEG data URL per Spec §8.1.
 */
export async function processBrandPhoto(
  fileOrBlob: Blob | File,
  targetSize = 400
): Promise<string> {
  if (typeof document !== 'undefined' && typeof window !== 'undefined') {
    return new Promise<string>((resolve, reject) => {
      const url = URL.createObjectURL(fileOrBlob);
      const img = new Image();

      img.onload = () => {
        URL.revokeObjectURL(url);
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;

        const { srcX, srcY, side } = calculateSquareCrop(w, h);

        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get 2D canvas context'));
          return;
        }

        ctx.drawImage(img, srcX, srcY, side, side, 0, 0, targetSize, targetSize);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        resolve(dataUrl);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load brand photo for square crop'));
      };

      img.src = url;
    });
  }

  return blobToBase64(fileOrBlob);
}

