import { useState } from 'react';
import { useT } from '../../i18n';
import {
  Button,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
  MenuContent,
  MenuItem,
  MenuRoot,
  MenuSeparator,
  MenuTrigger,
  PopoverContent,
  PopoverRoot,
  PopoverTrigger,
  SliderRange,
  SliderRoot,
  SliderThumb,
  SliderTrack,
  TabsContent,
  TabsList,
  TabsRoot,
  TabsTrigger,
  TextField,
  ToastDescription,
  ToastProvider,
  ToastRoot,
  ToastTitle,
  ToastViewport,
  TooltipContent,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from './components';
import './kit.css';

const COLORS = ['#bd5d43', '#28251f', '#d6b69a', '#78907a'];

export function KitPage() {
  const { t } = useT();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');
  const [toastOpen, setToastOpen] = useState(false);
  const [intensity, setIntensity] = useState([62]);
  const [color, setColor] = useState(COLORS[0]!);

  return (
    <ToastProvider swipeDirection="right">
      <div className="atelier-kit" data-theme={theme} dir={direction}>
        <header className="kit-topbar">
          <a className="kit-brand" href="/" aria-label={t('kit.home')}>
            <span className="kit-mark">S</span>
            <span>{t('app.name')}</span>
            <span className="kit-version">{t('kit.gallery')}</span>
          </a>
          <div className="kit-top-controls">
            <div className="kit-toggle-group" aria-label={t('kit.appearance')}>
              <Button variant={theme === 'light' ? 'primary' : 'quiet'} onClick={() => setTheme('light')}>{t('kit.light')}</Button>
              <Button variant={theme === 'dark' ? 'primary' : 'quiet'} onClick={() => setTheme('dark')}>{t('kit.dark')}</Button>
            </div>
            <div className="kit-toggle-group" aria-label={t('kit.direction')}>
              <Button variant={direction === 'ltr' ? 'primary' : 'quiet'} onClick={() => setDirection('ltr')}>LTR</Button>
              <Button variant={direction === 'rtl' ? 'primary' : 'quiet'} onClick={() => setDirection('rtl')}>RTL</Button>
            </div>
          </div>
        </header>

        <main className="kit-main">
          <section className="kit-intro">
            <div>
              <p className="kit-eyebrow">{t('kit.eyebrow')}</p>
              <h1>{t('kit.title')}</h1>
              <p>{t('kit.description')}</p>
            </div>
            <div className="kit-stamp" aria-hidden="true">✳</div>
          </section>

          <section className="kit-grid" aria-label={t('kit.components')}>
            <article className="kit-card kit-card-buttons">
              <SectionHeading title={t('kit.buttons')} detail={t('kit.buttonsDetail')} />
              <div className="kit-row kit-wrap">
                <Button>{t('kit.primary')}</Button>
                <Button variant="secondary">{t('kit.secondary')}</Button>
                <Button variant="quiet">{t('kit.quiet')}</Button>
                <Button variant="danger">{t('kit.delete')}</Button>
              </div>
              <div className="kit-row kit-wrap"><Button disabled>{t('kit.disabled')}</Button><Button aria-label={t('kit.add')} className="kit-icon-button">＋</Button></div>
            </article>

            <article className="kit-card">
              <SectionHeading title={t('kit.fields')} detail={t('kit.fieldsDetail')} />
              <label className="kit-label">{t('kit.projectName')}<TextField placeholder={t('kit.projectPlaceholder')} /></label>
              <label className="kit-label">{t('kit.email')}<TextField type="email" placeholder="name@example.com" /></label>
              <label className="kit-label">{t('kit.accentColor')}<div className="kit-color-field"><input type="color" value={color} onChange={(event) => setColor(event.target.value)} aria-label={t('kit.accentColor')} /><code>{color.toUpperCase()}</code></div></label>
            </article>

            <article className="kit-card">
              <SectionHeading title={t('kit.tabs')} detail={t('kit.tabsDetail')} />
              <TabsRoot defaultValue="design" className="kit-tabs">
                <TabsList className="kit-tabs-list" aria-label={t('kit.editorPanels')}>
                  <TabsTrigger className="kit-tabs-trigger" value="design">{t('kit.design')}</TabsTrigger>
                  <TabsTrigger className="kit-tabs-trigger" value="content">{t('kit.content')}</TabsTrigger>
                  <TabsTrigger className="kit-tabs-trigger" value="brand">{t('kit.brand')}</TabsTrigger>
                </TabsList>
                <TabsContent className="kit-tab-content" value="design">{t('kit.designCopy')}</TabsContent>
                <TabsContent className="kit-tab-content" value="content">{t('kit.contentCopy')}</TabsContent>
                <TabsContent className="kit-tab-content" value="brand">{t('kit.brandCopy')}</TabsContent>
              </TabsRoot>
            </article>

            <article className="kit-card">
              <SectionHeading title={t('kit.slider')} detail={t('kit.sliderDetail')} />
              <div className="kit-slider-label"><span>{t('kit.patternIntensity')}</span><output>{intensity[0]}%</output></div>
              <SliderRoot className="kit-slider" value={intensity} onValueChange={setIntensity} max={100} step={1} aria-label={t('kit.patternIntensity')}>
                <SliderTrack className="kit-slider-track"><SliderRange className="kit-slider-range" /></SliderTrack><SliderThumb className="kit-slider-thumb" />
              </SliderRoot>
              <p className="kit-hint">{t('kit.sliderHint')}</p>
            </article>

            <article className="kit-card">
              <SectionHeading title={t('kit.dialogs')} detail={t('kit.dialogsDetail')} />
              <div className="kit-row kit-wrap">
                <DialogRoot>
                  <DialogTrigger asChild><Button variant="secondary">{t('kit.openDialog')}</Button></DialogTrigger>
                  <DialogPortal><DialogOverlay className="kit-dialog-overlay" /><DialogContent className="kit-dialog-content">
                    <DialogTitle className="kit-dialog-title">{t('kit.dialogTitle')}</DialogTitle>
                    <DialogDescription className="kit-dialog-description">{t('kit.dialogCopy')}</DialogDescription>
                    <div className="kit-dialog-actions"><DialogClose asChild><Button variant="secondary">{t('kit.cancel')}</Button></DialogClose><DialogClose asChild><Button>{t('kit.confirm')}</Button></DialogClose></div>
                  </DialogContent></DialogPortal>
                </DialogRoot>
                <PopoverRoot>
                  <PopoverTrigger asChild><Button variant="quiet">{t('kit.popover')}</Button></PopoverTrigger>
                  <PopoverContent className="kit-popover" sideOffset={8}><strong>{t('kit.quickColor')}</strong><div className="kit-swatch-row">{COLORS.map((swatch) => <button key={swatch} className="kit-swatch" style={{ backgroundColor: swatch }} aria-label={`${t('kit.chooseColor')} ${swatch}`} onClick={() => setColor(swatch)} />)}</div></PopoverContent>
                </PopoverRoot>
              </div>
            </article>

            <article className="kit-card">
              <SectionHeading title={t('kit.menus')} detail={t('kit.menusDetail')} />
              <div className="kit-row kit-wrap">
                <MenuRoot>
                  <MenuTrigger asChild><Button variant="secondary">{t('kit.moreActions')} <span aria-hidden="true">⌄</span></Button></MenuTrigger>
                  <MenuContent className="kit-menu" align="start" sideOffset={7}>
                    <MenuItem className="kit-menu-item">{t('kit.duplicate')}</MenuItem>
                    <MenuItem className="kit-menu-item">{t('kit.rename')}</MenuItem>
                    <MenuSeparator className="kit-menu-separator" />
                    <MenuItem className="kit-menu-item kit-menu-danger">{t('kit.delete')}</MenuItem>
                  </MenuContent>
                </MenuRoot>
                <TooltipProvider delayDuration={250}>
                  <TooltipRoot><TooltipTrigger asChild><Button variant="quiet" className="kit-help-button" aria-label={t('kit.help')}>?</Button></TooltipTrigger><TooltipContent className="kit-tooltip" sideOffset={7}>{t('kit.helpCopy')}</TooltipContent></TooltipRoot>
                </TooltipProvider>
                <Button variant="quiet" onClick={() => setToastOpen(true)}>{t('kit.showToast')}</Button>
              </div>
            </article>
          </section>
          <p className="kit-footnote">{t('kit.footer')}</p>
        </main>

        <ToastRoot className="kit-toast" open={toastOpen} onOpenChange={setToastOpen} duration={3500}>
          <div><ToastTitle className="kit-toast-title">{t('kit.toastTitle')}</ToastTitle><ToastDescription className="kit-toast-description">{t('kit.toastCopy')}</ToastDescription></div>
          <button className="kit-toast-close" onClick={() => setToastOpen(false)} aria-label={t('kit.dismiss')}>×</button>
        </ToastRoot>
        <ToastViewport className="kit-toast-viewport" />
      </div>
    </ToastProvider>
  );
}

function SectionHeading({ title, detail }: { title: string; detail: string }) {
  return <div className="kit-section-heading"><div><h2>{title}</h2><p>{detail}</p></div><span aria-hidden="true">✦</span></div>;
}
