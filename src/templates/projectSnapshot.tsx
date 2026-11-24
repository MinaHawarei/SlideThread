import { TemplateProjectSnapshotSchema, type AspectClass, type TemplateProjectSnapshot, type TemplateProjectSnapshotInput, type ThemeMode } from '../core/schema';
import { FONT_REGISTRY } from '../fonts/registry';
import { getTemplate } from './index';
import type { TemplateDef } from './types';
import { DECORATION_GENERATORS, generateDecoration, type DecorationId } from './decorations/generators';
import { starterTemplateRuntime } from './starters';

const packageSvgSources = import.meta.glob<string>('./starters/*/assets/**/*.svg', { query: '?raw', import: 'default' });
const packageAssetUrls = import.meta.glob<string>('./starters/*/assets/**/*.{png,webp}', { query: '?inline', import: 'default' });
const templateDefinitionCache = new WeakMap<object, TemplateDef>();

function freezeSnapshot<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value as Record<string, unknown>).forEach((child) => freezeSnapshot(child));
    Object.freeze(value);
  }
  return value;
}

async function readAssetDataUrl(templateId: string, assetPath: string): Promise<string> {
  const key = `./starters/${templateId}/${assetPath.replace(/^\.\//, '')}`;
  const isSvg = assetPath.toLowerCase().endsWith('.svg');
  const loader = isSvg ? packageSvgSources[key] : packageAssetUrls[key];
  if (!loader) throw new Error(`Template ${templateId} declares an unavailable asset: ${assetPath}`);
  const url = await loader();
  if (isSvg && !url.startsWith('data:')) {
    const encoded = btoa(unescape(encodeURIComponent(url)));
    return `data:image/svg+xml;base64,${encoded}`;
  }
  if (url.startsWith('data:')) return url;
  const absoluteUrl = typeof window !== 'undefined' ? new URL(url, window.location.href).href : url;
  const response = await fetch(absoluteUrl);
  if (!response.ok) throw new Error(`Could not read template asset ${assetPath} (${response.status})`);
  const blob = await response.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error(`Could not encode ${assetPath}`));
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error(`Could not encode ${assetPath}`));
    reader.readAsDataURL(blob);
  });
}

export async function loadTemplateProjectSnapshot(templateId: string, primaryColor: string): Promise<TemplateProjectSnapshot> {
  const template = await starterTemplateRuntime.load(templateId);
  const paletteEntries = await Promise.all((['light', 'dark'] as const).map(async (mode) => {
    const runtime = await starterTemplateRuntime.resolve({
      templateId, mode, primaryColor, slideType: 'cover', aspectClass: 'portrait',
      decorationContext: { tileIndex: 0, tileCount: 1, tileWidth: 1080, height: 1350, seed: 7 },
    });
    return [mode, runtime.palette] as const;
  }));
  const paletteByMode = Object.fromEntries(paletteEntries) as unknown as Record<ThemeMode, Record<string, string>>;
  const assets: Record<string, string> = {};
  for (const [name, reference] of Object.entries(template.assets ?? {})) {
    if (reference.startsWith('pack:')) continue;
    assets[reference] = await readAssetDataUrl(templateId, reference);
    assets[name] = assets[reference]!;
  }

  const composition: TemplateProjectSnapshot['composition'] = {};
  for (const slideType of ['cover', 'explain', 'rule', 'code', 'compare', 'stat', 'quote', 'image', 'cta'] as const) {
    const aspects: Partial<Record<AspectClass, NonNullable<TemplateProjectSnapshot['composition'][typeof slideType]>[AspectClass]>> = {};
    for (const aspectClass of ['landscape', 'square', 'portrait', 'tall'] as const) {
      const runtime = await starterTemplateRuntime.resolve({
        templateId, mode: 'light', primaryColor, slideType, aspectClass,
        decorationContext: { tileIndex: 0, tileCount: 1, tileWidth: 1080, height: 1350, seed: 7 },
      });
      const elements = (runtime.composition?.elements ?? []).map((element) => {
        const asset = element.assetId ? assets[element.assetId] : undefined;
        const mediaAsset = element.media?.assetId ? assets[element.media.assetId] : undefined;
        return {
          ...element,
          ...(asset ? { assetId: asset } : {}),
          ...(element.media && mediaAsset ? { media: { ...element.media, assetId: mediaAsset } } : {}),
        };
      });
      aspects[aspectClass] = {
        slots: Object.fromEntries(runtime.layoutVariant.elements.map((frame) => [frame.id, {
          blockStart: frame.blockStart, inlineStart: frame.inlineStart, inlineSize: frame.inlineSize, blockSize: frame.blockSize, align: frame.align,
        }])),
        elements,
      };
    }
    composition[slideType] = aspects as NonNullable<TemplateProjectSnapshot['composition'][typeof slideType]>;
  }
  const background = template.decor?.background;
  const decorationId = typeof background?.id === 'string' && Object.hasOwn(DECORATION_GENERATORS, background.id) ? background.id : undefined;
  return freezeSnapshot({
    version: 1,
    id: template.id,
    paletteByMode,
    fonts: {
      display: `${FONT_REGISTRY[template.theme.fonts.display].family}, sans-serif`,
      body: `${FONT_REGISTRY[template.theme.fonts.body].family}, sans-serif`,
      mono: `${FONT_REGISTRY[template.theme.fonts.mono ?? 'jetbrains-mono'].family}, monospace`,
    },
    typeScale: { h1: 112, h2: 76, body: 44, small: 30, mono: 34, ...template.theme.typeScale },
    radius: { card: 24, chip: 9999, ...template.theme.radius },
    counter: template.counter,
    composition,
    assets,
    ...(decorationId ? { decoration: {
      id: decorationId,
      params: (background?.params && typeof background.params === 'object' && !Array.isArray(background.params) ? background.params : {}) as Record<string, unknown>,
      intensity: typeof background?.intensity === 'number' ? Math.max(0, Math.min(1, background.intensity)) : 1,
    } } : {}),
  });
}

export function templateDefinitionFromSnapshot(sourceSnapshot: TemplateProjectSnapshotInput): TemplateDef {
  const cached = templateDefinitionCache.get(sourceSnapshot as object);
  if (cached) return cached;
  const snapshot = TemplateProjectSnapshotSchema.parse(sourceSnapshot);
  let legacy: TemplateDef | undefined;
  try { legacy = getTemplate(snapshot.id); } catch { legacy = undefined; }
  const Background: TemplateDef['Background'] = legacy?.Background ?? (({ index, count, width, height, tokens }) => {
    const ref = snapshot.decoration;
    const fragments = ref ? generateDecoration(ref.id as DecorationId, {
      tileIndex: index, tileCount: Math.max(1, count), tileWidth: width, height, seed: 7,
      params: ref.params, palette: tokens, intensity: ref.intensity,
    }, true) : [];
    return <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      {fragments.map((item, i) => item.kind === 'line'
        ? <line key={i} x1={item.x1} y1={item.y1} x2={item.x2} y2={item.y2} stroke={item.stroke} strokeWidth={item.strokeWidth} opacity={item.opacity} />
        : item.kind === 'polyline'
          ? <polyline key={i} points={item.points.map(({ x, y }) => `${x},${y}`).join(' ')} fill={item.fill ?? 'none'} stroke={item.stroke} strokeWidth={item.strokeWidth} opacity={item.opacity} />
          : <circle key={i} cx={item.cx} cy={item.cy} r={item.r} fill={item.fill} opacity={item.opacity} />)}
    </svg>;
  });
  const definition: TemplateDef = {
    ...(legacy ?? {} as TemplateDef),
    id: snapshot.id,
    className: legacy?.className ?? 'template-data',
    nameKey: legacy?.nameKey ?? snapshot.id,
    previewUrl: legacy?.previewUrl ?? '',
    fonts: snapshot.fonts,
    typeScale: snapshot.typeScale,
    radius: snapshot.radius,
    counter: snapshot.counter,
    paletteByMode: snapshot.paletteByMode as unknown as Record<ThemeMode, NonNullable<TemplateDef['paletteByMode']>[ThemeMode]>,
    composition: snapshot.composition as TemplateDef['composition'],
    Background,
  };
  templateDefinitionCache.set(sourceSnapshot as object, definition);
  return definition;
}

