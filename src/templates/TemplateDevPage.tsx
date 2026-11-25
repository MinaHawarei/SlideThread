import React, { useEffect, useMemo, useState } from 'react';
import type { AspectClass, Slide, ThemeMode, TemplateProjectSnapshot } from '../core/schema';
import { plainTextFieldsToRichText } from '../core/schema';
import { SlideRenderer } from '../slides/SlideRenderer';
import { loadTemplateProjectSnapshot, templateDefinitionFromSnapshot } from './projectSnapshot';
import { STARTER_TEMPLATE_IDS } from './starters';

const manifests = import.meta.glob<{ default: { id: string; name: { en: string; ar: string }; license: string } }>('./starters/*/template.json', { eager: true });
const manifestById = new Map(Object.values(manifests).map(({ default: manifest }) => [manifest.id, manifest]));
const aspects: AspectClass[] = ['landscape', 'square', 'portrait', 'tall'];
const dimensions: Record<AspectClass, { width: number; height: number }> = {
  landscape: { width: 1920, height: 1080 }, square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1350 }, tall: { width: 1080, height: 1920 },
};

function makeSampleSlide(locale: 'en' | 'ar', long: boolean, snapshot: TemplateProjectSnapshot, aspect: AspectClass): Slide {
  const fields = locale === 'ar'
    ? { tag: 'دليل التصميم', title: long ? 'حوّل الأفكار المعقّدة إلى شرائح واضحة وسهلة التصفّح' : 'حوّل أفكارك إلى شرائح واضحة', sub: long ? 'تجربة عربية كاملة من اليمين إلى اليسار مع مصطلحات تقنية مثل React و CSS و 2026.' : 'قالب قابل للتخصيص لمحتوى عربي مميز.', rule: 'إذا ظهرت مشكلة ← اشرح الحل خطوة بخطوة' }
    : { tag: 'DESIGN SYSTEMS', title: long ? 'Turn complex ideas into clear, memorable slides people can follow' : 'Make your next idea impossible to miss.', sub: long ? 'A responsive, creator-friendly template preview with mixed bidi text: Arabic العربية, React, CSS, and 2026.' : 'A flexible starter for your next carousel.', rule: 'IF the idea matters → THEN make it clear' };
  return { id: 'template-dev-sample', type: 'cover', fields: plainTextFieldsToRichText(fields), extras: snapshot.composition.cover?.[aspect]?.elements ?? [] };
}

export const TemplateDevPage: React.FC = () => {
  const params = new URLSearchParams(window.location.search);
  const [templateId, setTemplateId] = useState(params.get('id') ?? 'tech-mesh');
  const [locale, setLocale] = useState<'en' | 'ar'>(params.get('locale') === 'ar' ? 'ar' : 'en');
  const [mode, setMode] = useState<ThemeMode>(params.get('theme') === 'light' ? 'light' : 'dark');
  const requestedAspect = params.get('aspect') as AspectClass | null;
  const [aspectClass, setAspectClass] = useState<AspectClass>(requestedAspect && aspects.includes(requestedAspect) ? requestedAspect : 'portrait');
  const [long, setLong] = useState(params.get('stress') === '1');
  const [snapshot, setSnapshot] = useState<TemplateProjectSnapshot>();
  const [error, setError] = useState<string>();
  useEffect(() => {
    let active = true;
    setSnapshot(undefined); setError(undefined);
    loadTemplateProjectSnapshot(templateId, mode === 'dark' ? '#35D0E6' : '#0B7FA6')
      .then((value) => { if (active) setSnapshot(value); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : String(reason)); });
    return () => { active = false; };
  }, [templateId, mode]);
  const manifest = manifestById.get(templateId);
  const definition = useMemo(() => snapshot ? templateDefinitionFromSnapshot(snapshot) : undefined, [snapshot]);
  const slide = useMemo(() => snapshot ? makeSampleSlide(locale, long, snapshot, aspectClass) : undefined, [locale, long, snapshot, aspectClass]);
  const palette = snapshot?.paletteByMode[mode];
  const size = dimensions[aspectClass];
  const width = 864;
  const height = Math.round(width * size.height / size.width);

  return (
    <main style={{ minHeight: '100vh', padding: 24, background: '#f4f2ee', color: '#20242a', fontFamily: 'IBM Plex Sans, sans-serif' }}>
      <header style={{ maxWidth: 1120, margin: '0 auto 20px', display: 'flex', flexWrap: 'wrap', alignItems: 'end', gap: 12 }}>
        <div style={{ flex: '1 1 220px' }}><p style={{ margin: '0 0 4px', fontSize: 12, letterSpacing: 1.5 }}>SLIDETHREAD · TEMPLATE LAB</p><h1 style={{ margin: 0, fontSize: 24 }}>{manifest?.name[locale] ?? templateId}</h1></div>
        <label>Template <select aria-label="Template" value={templateId} onChange={(event) => setTemplateId(event.target.value)}>{STARTER_TEMPLATE_IDS.map((id) => <option key={id} value={id}>{id}</option>)}</select></label>
        <label>Language <select aria-label="Language" value={locale} onChange={(event) => setLocale(event.target.value as 'en' | 'ar')}><option value="en">English</option><option value="ar">العربية</option></select></label>
        <label>Theme <select aria-label="Theme" value={mode} onChange={(event) => setMode(event.target.value as ThemeMode)}><option value="dark">Dark</option><option value="light">Light</option></select></label>
        <label>Aspect <select aria-label="Aspect" value={aspectClass} onChange={(event) => setAspectClass(event.target.value as AspectClass)}>{aspects.map((aspect) => <option key={aspect} value={aspect}>{aspect}</option>)}</select></label>
        <label><input type="checkbox" checked={long} onChange={(event) => setLong(event.target.checked)} /> Stress copy</label>
      </header>
      {error ? <p role="alert">{error}</p> : !snapshot || !definition || !slide || !palette ? <p>Loading template package…</p> : <section style={{ maxWidth: 1120, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: 20, alignItems: 'start' }}>
        <article style={{ padding: 16, background: '#fff', borderRadius: 18, boxShadow: '0 8px 30px #17233318' }}>
          <p style={{ margin: '0 0 12px', fontSize: 13 }}>Sample slide · {locale.toUpperCase()} · {mode} · {aspectClass}</p>
          <div data-testid="template-dev-slide" data-preview-ready="true" style={{ width, height, overflow: 'hidden', borderRadius: 12, margin: '0 auto' }}><div style={{ width: size.width, height: size.height, transform: `scale(${width / size.width})`, transformOrigin: 'top left' }}>
            <SlideRenderer slide={slide} palette={palette as never} aspectClass={aspectClass} textDir={locale === 'ar' ? 'rtl' : 'ltr'} templateId={templateId} templateSnapshot={snapshot} themeMode={mode} dimensions={size} slideIndex={0} totalSlides={5} />
          </div></div>
        </article>
        <aside style={{ padding: 20, background: '#fff', borderRadius: 18, boxShadow: '0 8px 30px #17233318' }}><p style={{ marginTop: 0, fontSize: 12, letterSpacing: 1 }}>MANIFEST</p><dl style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 10, fontSize: 14 }}>
          <dt>Template ID</dt><dd>{manifest?.id ?? templateId}</dd><dt>License</dt><dd>{manifest?.license ?? 'Missing'}</dd><dt>English</dt><dd>{manifest?.name.en ?? '—'}</dd><dt>Arabic</dt><dd dir="rtl">{manifest?.name.ar ?? '—'}</dd>
        </dl><p style={{ color: '#606974', fontSize: 13, lineHeight: 1.6 }}>The lab preview uses the same package snapshot and shared renderer as the editor.</p></aside>
      </section>}
    </main>
  );
};
