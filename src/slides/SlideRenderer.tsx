import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { SlideProps } from './types';
import { CoverSlide } from './CoverSlide';
import { ExplainSlide } from './ExplainSlide';
import { RuleSlide } from './RuleSlide';
import { CompareSlide } from './CompareSlide';
import { CodeSlide } from './CodeSlide';
import { StatSlide } from './StatSlide';
import { QuoteSlide } from './QuoteSlide';
import { ImageSlide } from './ImageSlide';
import { CtaSlide } from './CtaSlide';
import { MediaRenderer } from './MediaRenderer';
import { SignatureBar } from './SignatureBar';
import { SlideCounter } from './SlideCounter';
import { StorySafeZoneOverlay } from './StorySafeZoneOverlay';
import { ExtrasRenderer } from './ExtrasRenderer';
import { SlideBackgroundRenderer } from './SlideBackgroundRenderer';
import type { TemplateDef } from '../templates';
import {
  richTextFieldsToPlainText,
  DEFAULT_COUNTER_CONFIG,
  DEFAULT_SIGNATURE_CONFIG,
  type AspectClass,
  type Slide,
  type SlideBackground,
  type CounterConfig,
  type SignatureConfig,
  type TemplateProjectSnapshotInput,
} from '../core/schema';
import { SLOT_SELECTORS } from '../core/elementModel';
import { loadTemplateProjectSnapshot, templateDefinitionFromSnapshot } from '../templates/projectSnapshot';
import './slides.css';

const DEFAULT_DIMENSIONS: Record<AspectClass, { width: number; height: number }> = {
  landscape: { width: 1920, height: 1080 },
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1350 },
  tall: { width: 1080, height: 1920 },
};

export interface SlideRendererProps extends Omit<SlideProps, 'slide'> {
  slide: Slide;
  style?: React.CSSProperties;
  templateOverride?: TemplateDef;
  templateSnapshot?: TemplateProjectSnapshotInput;
  counterConfig?: CounterConfig;
  signatureConfig?: SignatureConfig;
  projectBackground?: SlideBackground;
}

export const SlideRenderer: React.FC<SlideRendererProps> = React.memo((props) => {
  const [resolvedSnapshot, setResolvedSnapshot] = useState<TemplateProjectSnapshotInput>();
  const {
    slide,
    palette,
    aspectClass,
    textDir,
    brand,
    slideIndex,
    totalSlides,
    showCounter = true,
    counterConfig,
    signatureConfig,
    showSafeZones = false,
    isStory = false,
    templateId = 'tech-mesh',
    themeMode = 'dark',
    dimensions,
    className = '',
    style = {},
    templateOverride,
    templateSnapshot,
  } = props;

  useEffect(() => {
    if (templateOverride || templateSnapshot) { setResolvedSnapshot(undefined); return; }
    let active = true;
    loadTemplateProjectSnapshot(templateId, palette.acc).then((snapshot) => { if (active) setResolvedSnapshot(snapshot); }).catch((error) => {
      console.error(`Could not load template package ${templateId}`, error);
    });
    return () => { active = false; };
  }, [templateId, palette.acc, templateOverride, templateSnapshot]);

  const effectiveSnapshot = templateSnapshot ?? resolvedSnapshot;
  const template = templateOverride ?? (effectiveSnapshot ? templateDefinitionFromSnapshot(effectiveSnapshot) : undefined);
  const slideDims = dimensions || DEFAULT_DIMENSIONS[aspectClass];
  const canvasRef = useRef<HTMLDivElement>(null);
  const overrides = slide.overrides?.[aspectClass];

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const manipulated: Array<{
      el: HTMLElement;
      visibility: string;
      zIndex: string;
      position: string;
      transform: string;
      transformOrigin: string;
      opacity: string;
    }> = [];

    if (overrides) {
      for (const [slotId, override] of Object.entries(overrides)) {
        const selector = SLOT_SELECTORS[slotId];
        if (!selector) continue;
        const nodes = canvas.querySelectorAll<HTMLElement>(selector);
        for (const node of nodes) {
          manipulated.push({
            el: node,
            visibility: node.style.visibility,
            zIndex: node.style.zIndex,
            position: node.style.position,
            transform: node.style.transform,
            transformOrigin: node.style.transformOrigin,
            opacity: node.style.opacity,
          });

          if (override.hidden !== undefined) {
            node.style.visibility = override.hidden ? 'hidden' : 'visible';
          }
          if (override.opacity !== undefined) {
            node.style.opacity = String(override.opacity);
          }
          if (override.z !== undefined) {
            node.style.zIndex = String(override.z);
            if (typeof window !== 'undefined' && window.getComputedStyle(node).position === 'static') {
              node.style.position = 'relative';
            }
          }
          const tx = (override.dx || 0) * slideDims.width;
          const ty = (override.dy || 0) * slideDims.height;
          const scale = override.scale ?? 1;
          const rot = override.rotation ?? 0;
          if (tx !== 0 || ty !== 0 || scale !== 1 || rot !== 0) {
            const rotPart = rot !== 0 ? ` rotate(${rot}deg)` : '';
            node.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})${rotPart}`;
            node.style.transformOrigin = 'center';
            if (typeof window !== 'undefined' && window.getComputedStyle(node).position === 'static') {
              node.style.position = 'relative';
            }
          }
        }
      }
    }

    return () => {
      for (const item of manipulated) {
        item.el.style.visibility = item.visibility;
        item.el.style.zIndex = item.zIndex;
        item.el.style.position = item.position;
        item.el.style.transform = item.transform;
        item.el.style.transformOrigin = item.transformOrigin;
        item.el.style.opacity = item.opacity;
      }
    };
  }, [template, overrides, aspectClass, slideDims.width, slideDims.height]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const frames = template?.composition?.[slide.type]?.[aspectClass]?.slots;
    if (!canvas || !template || !frames) return;
    const restored: Array<{ element: HTMLElement; values: Record<string, string> }> = [];
    const setManagedStyle = (element: HTMLElement, styles: Record<string, string>) => {
      const values = Object.fromEntries(
        Object.keys(styles).map((name) => [name, (element.style as unknown as Record<string, string>)[name] ?? ''])
      );
      restored.push({ element, values });
      for (const [name, value] of Object.entries(styles)) {
        (element.style as unknown as Record<string, string>)[name] = value;
      }
    };
    for (const [slotId, frame] of Object.entries(frames)) {
      const selector = SLOT_SELECTORS[slotId];
      if (!selector) continue;
      for (const element of canvas.querySelectorAll<HTMLElement>(selector)) {
        setManagedStyle(element, {
          position: 'absolute',
          insetInlineStart: `${frame.inlineStart * slideDims.width}px`,
          insetBlockStart: `${frame.blockStart * slideDims.height}px`,
          width: `${frame.inlineSize * slideDims.width}px`,
          height: `${frame.blockSize * slideDims.height}px`,
          textAlign: frame.align === 'start' ? (textDir === 'rtl' ? 'right' : 'left') : frame.align === 'end' ? (textDir === 'rtl' ? 'left' : 'right') : 'center',
        });
      }
    }
    if (slide.type === 'cover') {
      if (frames.title) {
        for (const el of canvas.querySelectorAll<HTMLElement>('.slide-tag')) {
          setManagedStyle(el, {
            position: 'absolute',
            insetBlockStart: `${Math.max(0.115, frames.title.blockStart - 0.068) * slideDims.height}px`,
            marginBlockEnd: '0px',
            ...(frames.title.align === 'center'
              ? { left: '50%', transform: 'translateX(-50%)' }
              : { insetInlineStart: `${frames.title.inlineStart * slideDims.width}px` }),
          });
        }
      }
      if (frames.body) {
        for (const el of canvas.querySelectorAll<HTMLElement>('.slide-mono-line')) {
          setManagedStyle(el, {
            position: 'absolute',
            insetBlockStart: `${(frames.body.blockStart + frames.body.blockSize + 0.025) * slideDims.height}px`,
            maxWidth: `${frames.body.inlineSize * slideDims.width}px`,
            ...(frames.body.align === 'center'
              ? { left: '50%', transform: 'translateX(-50%)' }
              : { insetInlineStart: `${frames.body.inlineStart * slideDims.width}px` }),
          });
        }
      }
    }
    if (slide.type === 'cta') {
      if (frames.media) {
        const mediaAtBottom = frames.media.blockStart >= 0.65;
        for (const el of canvas.querySelectorAll<HTMLElement>('.cta-profile-meta')) {
          setManagedStyle(el, mediaAtBottom
            ? {
                position: 'absolute',
                insetBlockStart: `${(frames.media.blockStart + 0.02) * slideDims.height}px`,
                insetInlineStart: `${(frames.media.inlineStart + frames.media.inlineSize + 0.03) * slideDims.width}px`,
                width: `${0.26 * slideDims.width}px`,
                alignItems: 'flex-start',
                textAlign: textDir === 'rtl' ? 'right' : 'left',
              }
            : {
                position: 'absolute',
                insetBlockStart: `${(frames.media.blockStart + frames.media.blockSize + 0.015) * slideDims.height}px`,
                insetInlineStart: `${frames.media.inlineStart * slideDims.width}px`,
                width: `${frames.media.inlineSize * slideDims.width}px`,
                alignItems: frames.media.align === 'center' ? 'center' : 'flex-start',
                textAlign: frames.media.align === 'center' ? 'center' : (textDir === 'rtl' ? 'right' : 'left'),
              });
        }
      }
      if (frames.body) {
        const mediaAtBottom = Boolean(frames.media && frames.media.blockStart >= 0.65);
        for (const el of canvas.querySelectorAll<HTMLElement>('.cta-action-button')) {
          setManagedStyle(el, {
            position: 'absolute',
            marginBlockStart: '0px',
            insetBlockStart: `${(mediaAtBottom
              ? Math.max((frames.media?.blockStart ?? 0.72) + 0.02, frames.body.blockStart + frames.body.blockSize + 0.03)
              : frames.body.blockStart + frames.body.blockSize + 0.03) * slideDims.height}px`,
            ...(mediaAtBottom
              ? { insetInlineEnd: `${0.08 * slideDims.width}px` }
              : frames.body.align === 'center'
                ? { left: '50%', transform: 'translateX(-50%)' }
                : { insetInlineStart: `${frames.body.inlineStart * slideDims.width}px` }),
          });
        }
      }
    }
    return () => restored.forEach(({ element, values }) => {
      for (const [name, value] of Object.entries(values)) (element.style as unknown as Record<string, string>)[name] = value;
    });
  }, [template, slide.type, aspectClass, slideDims.width, slideDims.height, textDir]);

  if (!template) return <div className={`slide-canvas aspect-${aspectClass} template-loading ${className}`.trim()} style={{ width: dimensions?.width, height: dimensions?.height, ...style }} aria-busy="true" />;
  const templatePalette = {
    ...(template.paletteByMode?.[themeMode] ?? palette),
    ...template.paletteOverridesByMode?.[themeMode],
  } as typeof palette;

  const shouldRenderSignature =
    slide.type !== 'cta' &&
    !slide.hideSignature &&
    Boolean(brand && brand.showSignature !== false && signatureConfig?.show !== false);

  const effectiveSignatureConfig =
    signatureConfig ?? brand?.defaultSignature ?? DEFAULT_SIGNATURE_CONFIG;
  const signatureAnchor = effectiveSignatureConfig.anchor ?? 'bc';

  const renderProps: SlideProps = {
    ...props,
    signatureConfig: effectiveSignatureConfig,
    slide: {
      ...slide,
      fields: richTextFieldsToPlainText(slide.fields),
      richFields: slide.fields,
    },
  };
  const getSignatureContainerStyle = (): React.CSSProperties => {
    if (signatureAnchor === 'free') {
      return {};
    }
    const isTall = aspectClass === 'tall' || isStory;
    const bottomDist = isTall ? 268 : 40;
    const topDist = 40;
    const hDist = 48;

    const base: React.CSSProperties = {
      position: 'absolute',
      zIndex: 20,
      width: 'auto',
      maxWidth: 'calc(100% - 96px)',
      boxSizing: 'border-box',
    };

    switch (signatureAnchor) {
      case 'tl':
        return { ...base, top: topDist, left: hDist };
      case 'tc':
        return { ...base, top: topDist, left: '50%', transform: 'translateX(-50%)' };
      case 'tr':
        return { ...base, top: topDist, right: hDist };
      case 'bl':
        return { ...base, bottom: bottomDist, left: hDist };
      case 'bc':
        return { ...base, bottom: bottomDist, left: '50%', transform: 'translateX(-50%)' };
      case 'br':
      default:
        return { ...base, bottom: bottomDist, right: hDist };
    }
  };

  const effectiveCounterConfig: CounterConfig = counterConfig ?? {
    ...DEFAULT_COUNTER_CONFIG,
    show: (brand?.showCounter !== false) && (showCounter !== false),
  };

  const paletteStyle: React.CSSProperties = {
    '--bg': templatePalette.bg,
    '--bg2': templatePalette.bg2,
    '--ink': templatePalette.ink,
    '--mute': templatePalette.mute,
    '--acc': templatePalette.acc,
    '--acc2': templatePalette.acc2,
    '--line': templatePalette.line,
    '--card': templatePalette.card,
    '--ok': templatePalette.ok,
    '--bad': templatePalette.bad,
    '--on-acc': templatePalette.onAcc,
    '--card-radius': `${template.radius.card}px`,
    '--chip-radius': `${template.radius.chip}px`,
    '--ts-h1': `${template.typeScale.h1}px`,
    '--ts-h2': `${template.typeScale.h2}px`,
    '--ts-body': `${template.typeScale.body}px`,
    '--ts-small': `${template.typeScale.small}px`,
    '--ts-mono': `${template.typeScale.mono}px`,
    '--template-progress': `${(((slideIndex ?? 0) + 1) / Math.max(totalSlides ?? 1, 1)) * 100}%`,
    direction: textDir && textDir !== 'auto' ? textDir : undefined,
    ...style,
  } as React.CSSProperties;

  const renderComponent = () => {
    switch (slide.type) {
      case 'cover':
        return <CoverSlide {...renderProps} />;
      case 'explain':
        return <ExplainSlide {...renderProps} />;
      case 'rule':
        return <RuleSlide {...renderProps} />;
      case 'compare':
        return <CompareSlide {...renderProps} />;
      case 'code':
        return <CodeSlide {...renderProps} />;
      case 'stat':
        return <StatSlide {...renderProps} />;
      case 'quote':
        return <QuoteSlide {...renderProps} />;
      case 'image':
        return <ImageSlide {...renderProps} />;
      case 'cta':
        return <CtaSlide {...renderProps} />;
      default:
        return (
          <div className="slide-content-area" style={{ justifyContent: 'center', alignItems: 'center' }}>
            <p>Unsupported slide type: {(slide as { type: string }).type}</p>
          </div>
        );
    }
  };

  return (
    <div
      ref={canvasRef}
      className={`slide-canvas aspect-${aspectClass} template-${template.className} ${className}`.trim()}
      style={paletteStyle}
      data-slide-id={slide.id}
      data-slide-type={slide.type}
      data-aspect-class={aspectClass}
      data-template-id={templateId}
    >
      <div
        className="slide-template-bg"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      >
        <template.Background
          index={slideIndex ?? 0}
          count={totalSlides ?? 1}
          width={slideDims.width}
          height={slideDims.height}
          tokens={templatePalette}
        />
      </div>

      <SlideBackgroundRenderer
        background={slide.background ?? props.projectBackground}
        width={slideDims.width}
        height={slideDims.height}
      />

      {slide.media?.placement === 'background' && (
        <div
          className="slide-bg-media"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            zIndex: 2,
            opacity: 0.22,
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
          <MediaRenderer media={slide.media} imageUrl={renderProps.slide.fields.imageUrl} />
        </div>
      )}
      {renderComponent()}
      <ExtrasRenderer extras={slide.extras} />
      {shouldRenderSignature && (
        <div
          className={`slide-signature-container sig-anchor-${signatureAnchor}`}
          style={getSignatureContainerStyle()}
          data-slot="signature"
          data-element-id="signature"
        >
          <SignatureBar
            brand={brand}
            signatureConfig={effectiveSignatureConfig}
            slideIndex={slideIndex}
            totalSlides={totalSlides}
            showCounter={false}
          />
        </div>
      )}
      <SlideCounter
        counterConfig={effectiveCounterConfig}
        slideIndex={slideIndex}
        totalSlides={totalSlides}
        aspectClass={aspectClass}
        palette={templatePalette}
        textDir={textDir}
        signatureAnchor={signatureAnchor}
        isSignatureVisible={shouldRenderSignature}
      />
      {showSafeZones && (aspectClass === 'tall' || isStory) && (
        <StorySafeZoneOverlay height={slideDims.height} />
      )}
    </div>
  );
});

SlideRenderer.displayName = 'SlideRenderer';
