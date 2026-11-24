import type { Project } from './schema';
import { migrate } from './migrate';
import { getAsset, saveAsset } from './assetStore';

export const LARGE_PROJECT_SIZE_THRESHOLD_BYTES = 5 * 1024 * 1024; // 5 MB per Spec §8.2 & Plan §4

export interface ExportedProjectBundle {
  schemaVersion: number;
  project: Project;
  assets?: Record<string, string>; // assetId -> data URL base64
  exportedAt: number;
}

/**
 * Converts a Blob to a base64 Data URL.
 */
export async function blobToDataUrl(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  let base64 = '';
  if (typeof Buffer !== 'undefined') {
    base64 = Buffer.from(buffer).toString('base64');
  } else {
    const bytes = new Uint8Array(buffer);
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      base64 += String.fromCharCode.apply(null, chunk as unknown as number[]);
    }
    base64 = btoa(base64);
  }
  const mime = blob.type || 'application/octet-stream';
  return `data:${mime};base64,${base64}`;
}

/**
 * Converts a base64 Data URL to a Blob.
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0]?.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  const base64Data = parts[1] || '';

  if (typeof atob === 'function') {
    const binaryStr = atob(base64Data);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return new Blob([bytes], { type: mime });
  }

  // Fallback for Node / Vitest environments without browser atob
  const buffer = Buffer.from(base64Data, 'base64');
  return new Blob([buffer], { type: mime });
}

/**
 * Sanitizes project title for a friendly export filename.
 */
export function getExportFilename(title?: string): string {
  const base = title && title.trim() ? title : 'slidethread-project';
  const sanitized = base
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const dateStr = new Date().toISOString().slice(0, 10);
  return `${sanitized || 'slidethread-project'}-${dateStr}.json`;
}

/**
 * Serializes a Project to an ExportedProjectBundle JSON string with all referenced
 * media images embedded as base64 data URLs.
 */
export async function exportProjectToJSON(project: Project): Promise<{
  json: string;
  sizeBytes: number;
  isLarge: boolean;
  sizeMB: string;
}> {
  const assets: Record<string, string> = {};

  // Find all assets referenced in slides and extras
  for (const slide of project.slides) {
    if (slide.media && slide.media.assetId) {
      const assetId = slide.media.assetId;
      if (!assets[assetId]) {
        try {
          const blob = await getAsset(assetId);
          if (blob) {
            const dataUrl = await blobToDataUrl(blob);
            assets[assetId] = dataUrl;
          }
        } catch (err) {
          console.warn(`[ProjectIO] Failed to embed asset ${assetId}:`, err);
        }
      }
    }

    // Also collect assets from slide extras (images/uploads)
    if (slide.extras) {
      for (const extra of slide.extras) {
        if (extra.media?.assetId) {
          const assetId = extra.media.assetId;
          if (!assets[assetId]) {
            try {
              const blob = await getAsset(assetId);
              if (blob) {
                const dataUrl = await blobToDataUrl(blob);
                assets[assetId] = dataUrl;
              }
            } catch (err) {
              console.warn(`[ProjectIO] Failed to embed extra asset ${assetId}:`, err);
            }
          }
        }
      }
    }
  }

  const bundle: ExportedProjectBundle = {
    schemaVersion: project.schemaVersion,
    project,
    assets: Object.keys(assets).length > 0 ? assets : undefined,
    exportedAt: Date.now(),
  };

  const json = JSON.stringify(bundle, null, 2);
  const sizeBytes = typeof Blob !== 'undefined' ? new Blob([json]).size : Buffer.byteLength(json, 'utf8');
  const isLarge = sizeBytes > LARGE_PROJECT_SIZE_THRESHOLD_BYTES;
  const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(1);

  return {
    json,
    sizeBytes,
    isLarge,
    sizeMB,
  };
}

/**
 * Triggers a browser file download of the exported project JSON.
 */
export function triggerJsonDownload(json: string, filename: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Orchestrates project export: checks size threshold and invokes optional warning callback
 * if the bundle exceeds 5 MB.
 */
export async function handleExportProject(
  project: Project,
  onLargeWarning?: (sizeMB: string, proceed: () => void) => void
): Promise<boolean> {
  const { json, isLarge, sizeMB } = await exportProjectToJSON(project);
  const filename = getExportFilename(project.title);

  const doDownload = () => {
    triggerJsonDownload(json, filename);
  };

  if (isLarge && onLargeWarning) {
    onLargeWarning(sizeMB, doDownload);
    return false;
  }

  doDownload();
  return true;
}

/**
 * Imports a project from raw JSON text.
 * 1. Parses JSON.
 * 2. Unpacks embedded base64 image assets into IndexedDB.
 * 3. Migrates and validates the Project schema.
 */
export async function importProjectFromJSON(jsonString: string): Promise<Project> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error('File content is not valid JSON');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Malformed project file: expected a JSON object');
  }

  const rawObj = parsed as Record<string, unknown>;

  // Detect whether file is an ExportedProjectBundle or a raw Project object
  const isBundle = 'project' in rawObj && typeof rawObj['project'] === 'object' && rawObj['project'] !== null;
  const projectData = isBundle ? rawObj['project'] : rawObj;
  const assets = (isBundle ? (rawObj['assets'] as Record<string, string> | undefined) : undefined) ||
    ((rawObj['assets'] as Record<string, string> | undefined) || undefined);

  // Restore embedded image assets into IndexedDB
  if (assets && typeof assets === 'object') {
    for (const [assetId, dataUrl] of Object.entries(assets)) {
      if (typeof dataUrl === 'string' && dataUrl.startsWith('data:')) {
        try {
          const blob = dataUrlToBlob(dataUrl);
          await saveAsset(assetId, blob);
        } catch (err) {
          console.warn(`[ProjectIO] Failed to restore asset ${assetId} to IndexedDB:`, err);
        }
      }
    }
  }

  // Validate and migrate schema
  return migrate(projectData);
}
