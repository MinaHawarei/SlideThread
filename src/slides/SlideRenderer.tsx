import React from 'react';
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
import { StorySafeZoneOverlay } from './StorySafeZoneOverlay';
import { getTemplate } from '../templates';
import { richTextFieldsToPlainText, type AspectClass, type Slide } from '../core/schema';
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
}

export const SlideRenderer: React.FC<SlideRendererProps> = React.memo((props) => {
  const {
    slide,
    palette,
    aspectClass,
    textDir,
    brand,
    slideIndex,
    totalSlides,
    showCounter = true,
    showSafeZones = false,
    isStory = false,
    templateId = 'network',
    themeMode = 'dark',
    dimensions,
    className = '',
    style = {},
  } = props;

  const template = getTemplate(templateId);
  const templatePalette = {
    ...(template.paletteByMode?.[themeMode] ?? palette),
    ...template.paletteOverridesByMode?.[themeMode],
  } as typeof palette;
  const renderProps: SlideProps = {
    ...props,
    slide: { ...slide, fields: richTextFieldsToPlainText(slide.fields) },
  };
  const slideDims = dimensions || DEFAULT_DIMENSIONS[aspectClass];

  const shouldRenderSignature =
    slide.type !== 'cta' &&
    !slide.hideSignature &&
    Boolean(brand && brand.showSignature !== false);

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
      {shouldRenderSignature && (
        <div className="slide-signature-container">
          <SignatureBar
            brand={brand}
            slideIndex={slideIndex}
            totalSlides={totalSlides}
            showCounter={showCounter}
          />
        </div>
      )}
      {(showSafeZones || isStory) && (aspectClass === 'tall' || isStory) && (
        <StorySafeZoneOverlay height={slideDims.height} />
      )}
    </div>
  );
});

SlideRenderer.displayName = 'SlideRenderer';
