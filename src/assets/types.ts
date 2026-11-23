/**
 * Asset Pack Types and Interfaces (Spec §5.6, REQ-10)
 */

export const ALLOWED_ASSET_LICENSES = [
  'CC0-1.0',
  'CC0',
  'MIT',
  'ISC',
  'Apache-2.0',
  'CC-BY-4.0',
  'CC-BY',
] as const;

export type AssetLicense = typeof ALLOWED_ASSET_LICENSES[number];

export const ASSET_PACK_KINDS = [
  'shapes',
  'icons',
  'emoji',
  'stickers',
] as const;

export type AssetPackKind = typeof ASSET_PACK_KINDS[number];

export interface AssetItem {
  id: string;
  name: {
    en: string;
    ar: string;
  };
  tags: {
    en: string[];
    ar: string[];
  };
  file: string;
  recolorable: boolean;
  defaultWidth?: number;
  defaultHeight?: number;
}

export interface AssetPack {
  id: string;
  name: {
    en: string;
    ar: string;
  };
  description?: {
    en: string;
    ar: string;
  };
  kind: AssetPackKind;
  version: string;
  license: AssetLicense;
  sourceUrl?: string;
  author: string;
  attribution?: string;
  items: AssetItem[];
}

export interface AssetPackSummary {
  id: string;
  name: {
    en: string;
    ar: string;
  };
  description?: {
    en: string;
    ar: string;
  };
  kind: AssetPackKind;
  version: string;
  license: AssetLicense;
  author: string;
  itemCount: number;
}

export interface LoadedAssetItem extends AssetItem {
  packId: string;
  svgContent: string;
}

export interface LoadedAssetPack extends AssetPack {
  svgs: Record<string, string>; // itemId -> sanitized SVG string
}

export interface ValidationSuccess<T> {
  success: true;
  data: T;
}

export interface ValidationFailure {
  success: false;
  errors: string[];
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;
