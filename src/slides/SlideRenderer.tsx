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
import './slides.css';

export interface SlideRendererProps extends SlideProps {
  style?: React.CSSProperties;
}

export const SlideRenderer: React.FC<SlideRendererProps> = (props) => {
  const { slide, palette, aspectClass, textDir, className = '', style = {} } = props;

  const paletteStyle: React.CSSProperties = {
    '--bg': palette.bg,
    '--bg2': palette.bg2,
    '--ink': palette.ink,
    '--mute': palette.mute,
    '--acc': palette.acc,
    '--acc2': palette.acc2,
    '--line': palette.line,
    '--card': palette.card,
    '--ok': palette.ok,
    '--bad': palette.bad,
    '--on-acc': palette.onAcc,
    direction: textDir && textDir !== 'auto' ? textDir : undefined,
    ...style,
  } as React.CSSProperties;

  const renderComponent = () => {
    switch (slide.type) {
      case 'cover':
        return <CoverSlide {...props} />;
      case 'explain':
        return <ExplainSlide {...props} />;
      case 'rule':
        return <RuleSlide {...props} />;
      case 'compare':
        return <CompareSlide {...props} />;
      case 'code':
        return <CodeSlide {...props} />;
      case 'stat':
        return <StatSlide {...props} />;
      case 'quote':
        return <QuoteSlide {...props} />;
      case 'image':
        return <ImageSlide {...props} />;
      case 'cta':
        return <CtaSlide {...props} />;
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
      className={`slide-canvas aspect-${aspectClass} ${className}`.trim()}
      style={paletteStyle}
      data-slide-id={slide.id}
      data-slide-type={slide.type}
      data-aspect-class={aspectClass}
    >
      {slide.media?.placement === 'background' && (
        <div
          className="slide-bg-media"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            zIndex: 1,
            opacity: 0.22,
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
          <MediaRenderer media={slide.media} imageUrl={slide.fields.imageUrl} />
        </div>
      )}
      {renderComponent()}
    </div>
  );
};
