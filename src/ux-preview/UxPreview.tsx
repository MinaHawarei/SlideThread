import { useEffect, useState } from 'react';
import { useT } from '../i18n';
import { LanguageSwitcher } from '../ui/common/LanguageSwitcher';
import './ux-preview.css';

type Direction = 'atelier' | 'signal' | 'field';
type Page = 'home' | 'gallery' | 'editor';
type Theme = 'light' | 'dark';

const directions: Direction[] = ['atelier', 'signal', 'field'];
const pages: Page[] = ['home', 'gallery', 'editor'];

export function UxPreview() {
  const { t, dir } = useT();
  const [direction, setDirection] = useState<Direction>('atelier');
  const [page, setPage] = useState<Page>('home');
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    document.documentElement.dataset.uxPreview = 'true';
    return () => { delete document.documentElement.dataset.uxPreview; };
  }, []);

  return (
    <main className={`ux-preview direction-${direction} theme-${theme}`} dir={dir}>
      <header className="ux-review-bar">
        <div className="ux-brand"><span className="ux-mark">S</span><span>{t('ux.brand')}</span><small>{t('ux.preview')}</small></div>
        <div className="ux-controls">
          <div className="ux-control-group" aria-label={t('ux.direction')}>
            {directions.map((item, index) => <button key={item} className={direction === item ? 'selected' : ''} onClick={() => setDirection(item)} aria-pressed={direction === item}>{t(`ux.direction.${item}` as never)} <span>{String.fromCharCode(65 + index)}</span></button>)}
          </div>
          <div className="ux-control-group" aria-label={t('ux.page')}>
            {pages.map((item) => <button key={item} className={page === item ? 'selected' : ''} onClick={() => setPage(item)} aria-pressed={page === item}>{t(`ux.page.${item}` as never)}</button>)}
          </div>
          <button className="ux-theme-toggle" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>{theme === 'light' ? t('ux.dark') : t('ux.light')}</button>
          <LanguageSwitcher />
        </div>
      </header>

      <section className="ux-direction-note">
        <div><p className="ux-eyebrow">{t('ux.directionLabel')} · {String.fromCharCode(65 + directions.indexOf(direction))}</p><h1>{t(`ux.direction.${direction}` as never)}</h1><p>{t(`ux.summary.${direction}` as never)}</p></div>
        <div className="ux-token-list"><span>{t(`ux.type.${direction}` as never)}</span><span>{t(`ux.motion.${direction}` as never)}</span><span>{t(`ux.illustration.${direction}` as never)}</span></div>
      </section>

      <div className="ux-app-frame">
        <nav className="ux-app-nav" aria-label={t('ux.navigation')}>
          <div className="ux-app-logo"><span className="ux-mark">S</span><strong>PostForge</strong></div>
          <div className="ux-page-links">{pages.map((item) => <button key={item} onClick={() => setPage(item)} className={page === item ? 'active' : ''}>{t(`ux.page.${item}` as never)}</button>)}</div>
          <button className="ux-avatar" aria-label={t('ux.profile')}>M</button>
        </nav>
        {page === 'home' && <HomePage />}
        {page === 'gallery' && <GalleryPage />}
        {page === 'editor' && <EditorPage />}
      </div>
      <footer className="ux-direction-footer"><span>{t(`ux.tokens.${direction}` as never)}</span><span>{t(`ux.sample.${direction}` as never)}</span></footer>
    </main>
  );
}

function HomePage() {
  const { t } = useT();
  return <section className="ux-page ux-home">
    <div className="ux-home-copy"><p className="ux-eyebrow">{t('ux.home.eyebrow')}</p><h2>{t('ux.home.title')}</h2><p className="ux-lead">{t('ux.home.body')}</p><div className="ux-actions"><button className="ux-primary">{t('ux.home.start')}</button><button className="ux-secondary">{t('ux.home.explore')}</button></div><div className="ux-proof"><span className="ux-avatar">M</span><span>{t('ux.home.proof')}</span></div></div>
    <div className="ux-hero-art" aria-label={t('ux.home.art')}><div className="ux-art-orbit orbit-one"/><div className="ux-art-orbit orbit-two"/><div className="ux-demo-slide"><span className="ux-demo-kicker">{t('ux.home.cardKicker')}</span><strong>{t('ux.home.cardTitle')}</strong><p>{t('ux.home.cardBody')}</p><div className="ux-art-bars"><i/><i/><i/></div><small>01 / 05</small></div><span className="ux-spark spark-one">✳</span><span className="ux-spark spark-two">✦</span><div className="ux-float-label">{t('ux.home.float')}</div></div>
    <div className="ux-platform-row"><span>{t('ux.home.platforms')}</span><b>Instagram</b><b>LinkedIn</b><b>Facebook</b></div>
    <div className="ux-section-heading"><div><p className="ux-eyebrow">{t('ux.home.recentEyebrow')}</p><h3>{t('ux.home.recentTitle')}</h3></div><button className="ux-text-button">{t('ux.home.viewAll')}</button></div>
    <div className="ux-project-row"><ProjectCard variant="peach" title={t('ux.project.one')} /><ProjectCard variant="mint" title={t('ux.project.two')} /><ProjectCard variant="lilac" title={t('ux.project.three')} /></div>
  </section>;
}

function ProjectCard({ variant, title }: { variant: string; title: string }) {
  const { t } = useT();
  return <article className="ux-project-card"><div className={`ux-project-thumb ${variant}`}><span>{t('ux.project.slides')}</span><strong>{title}</strong><i/></div><div className="ux-project-meta"><strong>{title}</strong><span>{t('ux.project.edited')}</span></div></article>;
}

function GalleryPage() {
  const { t } = useT();
  const [state, setState] = useState<'templates' | 'empty' | 'loading' | 'error'>('templates');
  return <section className="ux-page ux-gallery"><div className="ux-gallery-heading"><div><p className="ux-eyebrow">{t('ux.gallery.eyebrow')}</p><h2>{t('ux.gallery.title')}</h2><p className="ux-lead">{t('ux.gallery.body')}</p></div><button className="ux-secondary">{t('ux.gallery.brand')}</button></div>
    <div className="ux-gallery-tools"><label className="ux-search"><span>⌕</span><input aria-label={t('ux.gallery.search')} placeholder={t('ux.gallery.search')} /></label><button className="ux-filter">☷ <span>{t('ux.gallery.filters')}</span></button></div>
    <div className="ux-chips">{['all','coding','marketing','education','personal'].map((tag, i) => <button key={tag} className={i === 0 ? 'active' : ''}>{t(`ux.category.${tag}` as never)}</button>)}</div>
    <div className="ux-state-preview" role="group" aria-label={t('ux.gallery.stateLabel')}>{(['templates','empty','loading','error'] as const).map((item) => <button key={item} className={state === item ? 'active' : ''} onClick={() => setState(item)} aria-pressed={state === item}>{t(`ux.gallery.state.${item}` as never)}</button>)}</div>
    {state === 'templates' && <div className="ux-template-grid">{['mesh','clean','bold','soft','heritage','story'].map((item, i) => <TemplateCard key={item} name={t(`ux.template.${item}` as never)} variant={item} number={i + 1} />)}</div>}
    {state === 'empty' && <div className="ux-state-card"><div className="ux-state-art empty-art"><i/><i/><i/></div><h3>{t('ux.gallery.emptyTitle')}</h3><p>{t('ux.gallery.emptyBody')}</p><button className="ux-primary">{t('ux.gallery.clearFilters')}</button></div>}
    {state === 'loading' && <div className="ux-state-card ux-skeleton-card"><div className="ux-skeleton-art"/><i/><i/><i/></div>}
    {state === 'error' && <div className="ux-state-card"><div className="ux-state-art error-art">!</div><h3>{t('ux.gallery.errorTitle')}</h3><p>{t('ux.gallery.errorBody')}</p><button className="ux-secondary">{t('ux.gallery.retry')}</button></div>}
  </section>;
}

function TemplateCard({ name, variant, number }: { name: string; variant: string; number: number }) {
  const { t } = useT();
  const categories = ['coding', 'personal', 'marketing', 'education', 'heritage', 'all'];
  const categoryKey = `ux.category.${categories[number - 1]}` as never;
  return <article className="ux-template-card"><div className={`ux-template-art art-${variant}`}><span className="ux-template-count">{t('ux.template.slides', { count: 5 })}</span><div className="ux-art-mini"><small>{t('ux.template.idea')} {String(number).padStart(2, '0')}</small><strong>{name}</strong><i/><i/><i/></div><button aria-label={t('ux.gallery.favorite')}>♡</button></div><div className="ux-template-info"><div><strong>{name}</strong><span>{t(categoryKey)}</span></div><button>{t('ux.gallery.use')}</button></div></article>;
}

function EditorPage() {
  const { t } = useT();
  return <section className="ux-page ux-editor"><div className="ux-editor-top"><div><p className="ux-eyebrow">{t('ux.editor.breadcrumb')}</p><h2>{t('ux.editor.title')}</h2></div><div className="ux-editor-actions"><button className="ux-secondary">{t('ux.editor.share')}</button><button className="ux-primary">{t('ux.editor.export')}</button></div></div>
    <div className="ux-editor-workspace"><aside className="ux-tool-rail" aria-label={t('ux.editor.tools')}>{['template','elements','text','uploads','brand','layout'].map((tool, i) => <button key={tool} className={i === 0 ? 'active' : ''}><span>{['▧','◇','T','↑','◉','▦'][i]}</span>{t(`ux.tool.${tool}` as never)}</button>)}</aside>
      <div className="ux-canvas-area"><div className="ux-canvas-toolbar"><span>{t('ux.editor.canvas')}</span><div><button>−</button><span>72%</span><button>＋</button><button>{t('ux.editor.fit')}</button></div></div><div className="ux-canvas-wrap"><div className="ux-slide-preview"><span className="ux-slide-label">{t('ux.editor.slideTag')}</span><h3>{t('ux.editor.slideTitle')}</h3><p>{t('ux.editor.slideBody')}</p><div className="ux-slide-graphic"><i/><i/><i/><i/></div><span className="ux-slide-counter">01 / 05</span></div></div><div className="ux-slide-strip">{[1,2,3,4,5].map((n) => <button key={n} className={n === 1 ? 'selected' : ''}><span>{String(n).padStart(2,'0')}</span><i/></button>)}<button className="ux-add-slide">＋</button></div></div>
      <aside className="ux-inspector"><div className="ux-inspector-tabs"><button className="active">{t('ux.editor.design')}</button><button>{t('ux.editor.content')}</button></div><h3>{t('ux.editor.template')}</h3><div className="ux-inspector-swatch"><span/><span/><span/><span/></div><label>{t('ux.editor.accent')}<div className="ux-color-input"><i/> #C65E46</div></label><label>{t('ux.editor.background')}<div className="ux-color-input"><i/> #F7F2E8</div></label><div className="ux-inspector-divider"/><div className="ux-inspector-label"><strong>{t('ux.editor.layers')}</strong><button>＋</button></div><div className="ux-layer">▣ <span>{t('ux.editor.layerTitle')}</span> <small>◉</small></div><div className="ux-layer">▧ <span>{t('ux.editor.layerShape')}</span> <small>◉</small></div></aside>
    </div>
  </section>;
}
