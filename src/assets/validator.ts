import { AssetPackSchema } from './schema';
import { sanitizeSvg } from '../templates/security/sanitizers';
import type {
  AssetPack,
  LoadedAssetPack,
  ValidationResult,
} from './types';

export function validateAssetPackJson(data: unknown): ValidationResult<AssetPack> {
  const result = AssetPackSchema.safeParse(data);
  if (!result.success) {
    const errors = result.error.issues.map(
      (err) => `${err.path.join('.') || 'root'}: ${err.message}`
    );
    return { success: false, errors };
  }
  return { success: true, data: result.data };
}

export function validateAssetSvg(svgSource: string): ValidationResult<string> {
  if (!svgSource || typeof svgSource !== 'string' || !svgSource.trim()) {
    return { success: false, errors: ['SVG source is empty'] };
  }

  // Must contain an <svg element
  if (!/<svg[\s>]/i.test(svgSource)) {
    return { success: false, errors: ['Missing root <svg> element'] };
  }

  // Reject explicit script tags or event handlers immediately
  if (/<script[\s>]/i.test(svgSource) || /\bon[a-z]+\s*=/i.test(svgSource)) {
    return { success: false, errors: ['Dangerous scripts or event handlers detected in SVG'] };
  }

  try {
    const sanitized = sanitizeSvg(svgSource);
    if (!sanitized || !/<svg[\s>]/i.test(sanitized)) {
      return { success: false, errors: ['SVG sanitization failed: resulting SVG is invalid or empty'] };
    }
    return { success: true, data: sanitized };
  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Invalid SVG content'],
    };
  }
}

export function validateCompleteAssetPack(
  packJson: unknown,
  svgFiles: Record<string, string>
): ValidationResult<LoadedAssetPack> {
  const packResult = validateAssetPackJson(packJson);
  if (!packResult.success) {
    return { success: false, errors: packResult.errors };
  }

  const pack = packResult.data;
  const errors: string[] = [];
  const sanitizedSvgs: Record<string, string> = {};

  for (const item of pack.items) {
    const svgContent = svgFiles[item.file];
    if (svgContent === undefined) {
      errors.push(`Missing SVG file '${item.file}' for item '${item.id}'`);
      continue;
    }

    const svgResult = validateAssetSvg(svgContent);
    if (!svgResult.success) {
      errors.push(`Invalid SVG in '${item.file}' (${item.id}): ${svgResult.errors.join(', ')}`);
      continue;
    }

    sanitizedSvgs[item.id] = svgResult.data;
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      ...pack,
      svgs: sanitizedSvgs,
    },
  };
}
