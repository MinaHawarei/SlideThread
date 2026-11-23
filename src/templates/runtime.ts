import type { ThemeMode, SlideType, AspectClass } from '../core/schema';
import type { Palette } from '../core/palette';
import { generateDecoration, DECORATION_GENERATORS, type DecorationContext, type DecorationId, type SvgFragment } from './decorations/generators';
import { getLayoutArchetype, type LayoutArchetype } from './layouts/registry';
import { resolveTemplate, resolveTemplatePalette, TemplateSchema, type ValidatedTemplateData } from './schema';

export interface TemplateRuntimeTokens {
  palette: Palette;
  fonts: ValidatedTemplateData['theme']['fonts'];
  typeScale: Required<NonNullable<ValidatedTemplateData['theme']['typeScale']>>;
  radius: Required<NonNullable<ValidatedTemplateData['theme']['radius']>>;
}

const DEFAULT_TYPE_SCALE = { h1: 112, h2: 76, body: 44, small: 30, mono: 34 };
const DEFAULT_RADIUS = { card: 24, chip: 9999 };

export type TemplateDataLoader = () => Promise<unknown>;
export type TemplateDataLoaders = Readonly<Record<string, TemplateDataLoader>>;

export interface TemplateRuntimeRequest {
  templateId: string;
  mode: ThemeMode;
  primaryColor: string;
  slideType: SlideType;
  aspectClass: AspectClass;
  decorationContext: Omit<DecorationContext, 'palette' | 'params' | 'intensity'>;
  customCssText?: string;
  decorationsEnabled?: boolean;
}

export interface ResolvedTemplateRuntime {
  template: ValidatedTemplateData;
  palette: Palette;
  tokens: TemplateRuntimeTokens;
  layout: LayoutArchetype;
  layoutVariant: LayoutArchetype['variants'][AspectClass];
  layoutFallback: boolean;
  decoration: SvgFragment;
  customCss?: string;
}

function defaultLayout(slideType: SlideType): LayoutArchetype {
  const preferred = getLayoutArchetype(`${slideType}-editorial`);
  if (preferred) return preferred;
  const fallback = getLayoutArchetype(`${slideType}-centered`);
  if (fallback) return fallback;
  throw new Error(`No fallback layout is registered for slide type: ${slideType}`);
}

interface ResolvedDecorationRef {
  id: DecorationId;
  params: Record<string, unknown>;
  intensity: number;
  enabled: boolean;
}

function parseDecorationRef(ref: Record<string, unknown>): ResolvedDecorationRef | undefined {
  const id = ref.id;
  if (typeof id !== 'string' || !Object.hasOwn(DECORATION_GENERATORS, id)) return undefined;
  const params = ref.params && typeof ref.params === 'object' && !Array.isArray(ref.params)
    ? ref.params as Record<string, unknown>
    : {};
  return {
    id: id as DecorationId,
    params,
    intensity: typeof ref.intensity === 'number' && Number.isFinite(ref.intensity) ? Math.max(0, Math.min(1, ref.intensity)) : 1,
    enabled: ref.enabled !== false,
  };
}

function decorationRefs(template: ValidatedTemplateData): ResolvedDecorationRef[] {
  const refs = [template.decor?.background, ...(template.decor?.overlay ?? [])];
  return refs.flatMap((ref) => ref ? [parseDecorationRef(ref)].filter((parsed): parsed is ResolvedDecorationRef => Boolean(parsed)) : []);
}

export function createTemplateRuntime(loaders: TemplateDataLoaders) {
  const loadCache = new Map<string, Promise<ValidatedTemplateData>>();
  const dataCache = new Map<string, ValidatedTemplateData>();

  const load = (id: string, ancestors: readonly string[] = []): Promise<ValidatedTemplateData> => {
    if (ancestors.includes(id)) {
      return Promise.reject(new Error(`Template inheritance cycle: ${[...ancestors, id].join(' → ')}`));
    }
    const cachedData = dataCache.get(id);
    if (cachedData) return Promise.resolve(cachedData);
    const cachedPromise = loadCache.get(id);
    if (cachedPromise) return cachedPromise;
    const loader = loaders[id];
    if (!loader) return Promise.reject(new Error(`Unknown template: ${id}`));

    const pending = (async () => {
      const loaded = await loader();
      const source = typeof loaded === 'object' && loaded !== null && 'default' in loaded ? loaded.default : loaded;
      const parsed = TemplateSchema.parse(source);
      const allTemplates = [parsed];
      if (parsed.extends) allTemplates.unshift(await load(parsed.extends, [...ancestors, id]));
      const resolved = resolveTemplate(id, allTemplates);
      dataCache.set(id, resolved);
      return resolved;
    })();
    loadCache.set(id, pending);
    pending.catch(() => loadCache.delete(id));
    return pending;
  };

  const resolve = async (request: TemplateRuntimeRequest): Promise<ResolvedTemplateRuntime> => {
    const template = await load(request.templateId);
    const palette = resolveTemplatePalette(template, request.mode, request.primaryColor);
    const tokens: TemplateRuntimeTokens = {
      palette,
      fonts: template.theme.fonts,
      typeScale: { ...DEFAULT_TYPE_SCALE, ...template.theme.typeScale },
      radius: { ...DEFAULT_RADIUS, ...template.theme.radius },
    };
    const selectedId = template.layouts[request.slideType];
    const selectedLayout = selectedId ? getLayoutArchetype(selectedId) : undefined;
    const matchingLayout = selectedLayout?.slideType === request.slideType ? selectedLayout : undefined;
    const layout = matchingLayout ?? defaultLayout(request.slideType);
    const decoration = decorationRefs(template).flatMap((decor) => generateDecoration(decor.id, {
        ...request.decorationContext,
        palette,
        params: decor.params,
        intensity: decor.intensity,
      }, (request.decorationsEnabled ?? true) && decor.enabled));
    const customCss = template.customCss && request.customCssText
      ? (await import('./security/sanitizers')).sanitizeTemplateCss(request.customCssText, template.id)
      : undefined;

    return {
      template,
      palette,
      tokens,
      layout,
      layoutVariant: layout.variants[request.aspectClass],
      layoutFallback: !matchingLayout,
      decoration,
      ...(customCss ? { customCss } : {}),
    };
  };

  return { load, resolve };
}
