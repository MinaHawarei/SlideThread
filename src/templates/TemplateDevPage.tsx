import React, { useMemo, useState } from 'react';
import { SlideRenderer } from '../slides/SlideRenderer';
import type { AspectClass, Slide, ThemeMode } from '../core/schema';
import { plainTextFieldsToRichText } from '../core/schema';
import { NETWORK_DARK_PALETTE, NETWORK_LIGHT_PALETTE } from '../core/palette';
import { FONT_REGISTRY } from '../fonts/registry';
import { getTemplate } from './index';
import { DECORATION_GENERATORS, generateDecoration, type DecorationId } from './decorations/generators';
import { resolveTemplatePalette, TemplateSchema } from './schema';
import type { TemplateBackgroundProps, TemplateDef } from './types';

type StarterManifest = {
  id: string;
  name: { en: string; ar: string };
  description?: { en?: string; ar?: string };
  license: string;
  colorFlexible: boolean;
  theme: { modes: Record<string, Record<string, string>>; fonts: { display: string; body: string; mono?: string }; typeScale?: TemplateDef['typeScale']; radius?: TemplateDef['radius'] };
  decor?: { background?: Record<string, unknown> };
};

const manifests = import.meta.glob<StarterManifest>('./starters/*/template.json', { eager: true, import: 'default' });
const manifestById = new Map(Object.values(manifests).map((manifest) => [manifest.id, manifest]));
const aspects: AspectClass[] = ['landscape', 'square', 'portrait', 'tall'];
const dimensions: Record<AspectClass, { width: number; height: number }> = {
  landscape: { width: 1920, height: 1080 },
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1350 },
  tall: { width: 1080, height: 1920 },
};

function makeDataTemplate(manifest: StarterManifest): TemplateDef {
  const data = TemplateSchema.parse(manifest);
  const resolvePalette = (mode: ThemeMode) => resolveTemplatePalette(data, mode, mode === 'dark' ? '#35D0E6' : '#0B7FA6');
  const backgroundRef = data.decor?.background;
  const decorationId = typeof backgroundRef?.id === 'string' && Object.hasOwn(DECORATION_GENERATORS, backgroundRef.id)
    ? backgroundRef.id as DecorationId
    : 'none';
  const parameters = backgroundRef?.params && typeof backgroundRef.params === 'object' && !Array.isArray(backgroundRef.params)
    ? backgroundRef.params as Record<string, unknown>
    : {};
  const intensity = typeof backgroundRef?.intensity === 'number' ? Math.max(0, Math.min(1, backgroundRef.intensity)) : 1;
  const Background: React.FC<TemplateBackgroundProps> = ({ index, count, width, height, tokens }) => {
    const fragment = generateDecoration(decorationId, { tileIndex: index, tileCount: Math.max(1, count), tileWidth: width, height, seed: 7, params: parameters, palette: tokens, intensity });
    return <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true" data-testid="template-data-decoration">
      {fragment.map((primitive, primitiveIndex) => {
        if (primitive.kind === 'line') return <line key={primitiveIndex} x1={primitive.x1} y1={primitive.y1} x2={primitive.x2} y2={primitive.y2} stroke={primitive.stroke} strokeWidth={primitive.strokeWidth} opacity={primitive.opacity} />;
        if (primitive.kind === 'polyline') return <polyline key={primitiveIndex} points={primitive.points.map(({ x, y }) => `${x},${y}`).join(' ')} fill={primitive.fill ?? 'none'} stroke={primitive.stroke} strokeWidth={primitive.strokeWidth} opacity={primitive.opacity} />;
        return <circle key={primitiveIndex} cx={primitive.cx} cy={primitive.cy} r={primitive.r} fill={primitive.fill} opacity={primitive.opacity} />;
      })}
    </svg>;
  };
  const staticTemplate = getTemplate(data.id);
  return {
    id: data.id,
    className: staticTemplate.id === data.id ? staticTemplate.className : 'template-data',
    nameKey: data.name.en,
    previewUrl: '',
    fonts: {
      display: `${FONT_REGISTRY[data.theme.fonts.display].family}, sans-serif`,
      body: `${FONT_REGISTRY[data.theme.fonts.body].family}, sans-serif`,
      mono: `${FONT_REGISTRY[data.theme.fonts.mono ?? 'jetbrains-mono'].family}, monospace`,
    },
    typeScale: { h1: 112, h2: 76, body: 44, small: 30, mono: 34, ...data.theme.typeScale },
    radius: { card: 24, chip: 9999, ...data.theme.radius },
    paletteByMode: { light: resolvePalette('light'), dark: resolvePalette('dark') },
    Background,
  };
}

function makeSampleSlide(locale: 'en' | 'ar', long: boolean): Slide {
  const fields = locale === 'ar'
    ? {
        tag: 'دليل التصميم',
        title: long ? 'حوّل الأفكار المعقّدة إلى شرائح واضحة وسهلة التصفّح' : 'حوّل أفكارك إلى شرائح واضحة',
        sub: long ? 'تجربة عربية كاملة من اليمين إلى اليسار مع مصطلحات تقنية مثل React و CSS و 2026.' : 'قالب قابل للتخصيص لمحتوى عربي مميز.',
        rule: 'إذا ظهرت مشكلة ← اشرح الحل خطوة بخطوة',
      }
    : {
        tag: 'DESIGN SYSTEMS',
        title: long ? 'Turn complex ideas into clear, memorable slides people can follow' : 'Make your next idea impossible to miss.',
        sub: long ? 'A responsive, creator-friendly template preview with mixed bidi text: Arabic العربية, React, CSS, and 2026.' : 'A flexible starter for your next carousel.',
        rule: 'IF the idea matters → THEN make it clear',
      };
  return { id: 'template-dev-sample', type: 'cover', fields: plainTextFieldsToRichText(fields) };
}

export const TemplateDevPage: React.FC = () => {
  const params = new URLSearchParams(window.location.search);
  const [templateId, setTemplateId] = useState(params.get('id') ?? 'tech-mesh');
  const [locale, setLocale] = useState<'en' | 'ar'>(params.get('locale') === 'ar' ? 'ar' : 'en');
  const [mode, setMode] = useState<ThemeMode>(params.get('theme') === 'light' ? 'light' : 'dark');
  const requestedAspect = params.get('aspect') as AspectClass | null;
  const [aspectClass, setAspectClass] = useState<AspectClass>(requestedAspect && aspects.includes(requestedAspect) ? requestedAspect : 'portrait');
  const [long, setLong] = useState(params.get('stress') === '1');
  const manifest = manifestById.get(templateId);
  const dataTemplate = useMemo(() => manifest ? makeDataTemplate(manifest) : undefined, [manifest]);
  const palette = dataTemplate?.paletteByMode?.[mode] ?? (mode === 'dark' ? NETWORK_DARK_PALETTE : NETWORK_LIGHT_PALETTE);
  const slide = useMemo(() => makeSampleSlide(locale, long), [locale, long]);
  const size = dimensions[aspectClass];
  const width = 864;
  const height = Math.round(width * size.height / size.width);

  return (
    <main style={{ minHeight: '100vh', padding: 24, background: '#f4f2ee', color: '#20242a', fontFamily: 'IBM Plex Sans, sans-serif' }}>
      <header style={{ maxWidth: 1120, margin: '0 auto 20px', display: 'flex', flexWrap: 'wrap', alignItems: 'end', gap: 12 }}>
        <div style={{ flex: '1 1 220px' }}>
          <p style={{ margin: '0 0 4px', fontSize: 12, letterSpacing: 1.5 }}>SLIDETHREAD · TEMPLATE LAB</p>
          <h1 style={{ margin: 0, fontSize: 24 }}>{manifest?.name[locale] ?? templateId}</h1>
        </div>
        <label>Template <select aria-label="Template" value={templateId} onChange={(event) => setTemplateId(event.target.value)}>{[...manifestById.values()].map((item) => <option key={item.id} value={item.id}>{item.id}</option>)}</select></label>
        <label>Language <select aria-label="Language" value={locale} onChange={(event) => setLocale(event.target.value as 'en' | 'ar')}><option value="en">English</option><option value="ar">العربية</option></select></label>
        <label>Theme <select aria-label="Theme" value={mode} onChange={(event) => setMode(event.target.value as ThemeMode)}><option value="dark">Dark</option><option value="light">Light</option></select></label>
        <label>Aspect <select aria-label="Aspect" value={aspectClass} onChange={(event) => setAspectClass(event.target.value as AspectClass)}>{aspects.map((aspect) => <option key={aspect} value={aspect}>{aspect}</option>)}</select></label>
        <label><input type="checkbox" checked={long} onChange={(event) => setLong(event.target.checked)} /> Stress copy</label>
      </header>
      <section style={{ maxWidth: 1120, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: 20, alignItems: 'start' }}>
        <article style={{ padding: 16, background: '#fff', borderRadius: 18, boxShadow: '0 8px 30px #17233318' }}>
          <p style={{ margin: '0 0 12px', fontSize: 13 }}>Sample slide · {locale.toUpperCase()} · {mode} · {aspectClass}</p>
          <div data-testid="template-dev-slide" data-preview-ready="true" style={{ width, height, overflow: 'hidden', borderRadius: 12, margin: '0 auto' }}>
            <div style={{ width: size.width, height: size.height, transform: `scale(${width / size.width})`, transformOrigin: 'top left' }}>
              <SlideRenderer slide={slide} palette={palette} aspectClass={aspectClass} textDir={locale === 'ar' ? 'rtl' : 'ltr'} templateId={templateId} templateOverride={dataTemplate} themeMode={mode} dimensions={size} slideIndex={0} totalSlides={5} />
            </div>
          </div>
        </article>
        <aside style={{ padding: 20, background: '#fff', borderRadius: 18, boxShadow: '0 8px 30px #17233318' }}>
          <p style={{ marginTop: 0, fontSize: 12, letterSpacing: 1 }}>MANIFEST</p>
          <dl style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 10, fontSize: 14 }}>
            <dt>Template ID</dt><dd>{manifest?.id ?? templateId}</dd>
            <dt>License</dt><dd>{manifest?.license ?? 'Missing'}</dd>
            <dt>English</dt><dd>{manifest?.name.en ?? '—'}</dd>
            <dt>Arabic</dt><dd dir="rtl">{manifest?.name.ar ?? '—'}</dd>
            <dt>Description</dt><dd>{manifest?.description?.en ?? 'No description supplied.'}</dd>
          </dl>
          <p style={{ color: '#606974', fontSize: 13, lineHeight: 1.6 }}>Edit this template manifest or its registered visual adapter. Vite hot reload keeps the preview in sync while both language samples remain available.</p>
        </aside>
      </section>
    </main>
  );
};
