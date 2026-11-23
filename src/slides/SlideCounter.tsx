import React from 'react';
import type { Anchor, CounterConfig, TextDir } from '../core/schema';
import type { AspectClass } from '../core/schema';
import type { Palette } from '../core/palette';
import { formatSlideCounterValue } from './counterUtils';

export interface SlideCounterProps {
  counterConfig?: CounterConfig;
  slideIndex?: number;
  totalSlides?: number;
  aspectClass?: AspectClass;
  palette?: Palette;
  textDir?: TextDir;
  signatureAnchor?: Anchor | 'free';
  isSignatureVisible?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const SlideCounter: React.FC<SlideCounterProps> = ({
  counterConfig,
  slideIndex = 0,
  totalSlides = 1,
  signatureAnchor = 'br',
  isSignatureVisible = true,
  className = '',
  style = {},
}) => {
  if (!counterConfig || counterConfig.show === false) return null;
  if (totalSlides <= 1) return null;
  if (counterConfig.hideOnFirst && slideIndex === 0) return null;
  if (counterConfig.hideOnLast && slideIndex === totalSlides - 1) return null;

  const anchor = counterConfig.anchor || 'br';
  const styleType = counterConfig.style || 'number';
  const format = counterConfig.format || 'nn/nn';

  // Collision handling (§5.4):
  // If counter and signature choose the same anchor and signature is visible,
  // apply automatic offset so layout never overlaps silently.
  const hasCollision = isSignatureVisible && anchor === signatureAnchor;

  // Anchor styling positions
  const getAnchorStyle = (): React.CSSProperties => {
    const baseMargin = 40;
    const horizontalMargin = 48;
    const offsetBottom = hasCollision ? 124 : baseMargin;
    const offsetTop = hasCollision ? 124 : baseMargin;

    switch (anchor) {
      case 'tl':
        return {
          top: offsetTop,
          left: horizontalMargin,
        };
      case 'tc':
        return {
          top: offsetTop,
          left: '50%',
          transform: 'translateX(-50%)',
        };
      case 'tr':
        return {
          top: offsetTop,
          right: horizontalMargin,
        };
      case 'bl':
        return {
          bottom: offsetBottom,
          left: horizontalMargin,
        };
      case 'bc':
        return {
          bottom: offsetBottom,
          left: '50%',
          transform: 'translateX(-50%)',
        };
      case 'br':
      default:
        return {
          bottom: offsetBottom,
          right: horizontalMargin,
        };
    }
  };

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    zIndex: 10,
    pointerEvents: 'none',
    ...getAnchorStyle(),
    ...style,
  };

  const progressPct = Math.min(100, Math.max(0, ((slideIndex + 1) / Math.max(totalSlides, 1)) * 100));

  return (
    <div
      className={`slide-counter-container ${className}`.trim()}
      style={containerStyle}
      data-anchor={anchor}
      data-style={styleType}
      data-collision={hasCollision ? 'true' : undefined}
      dir="ltr"
    >
      {styleType === 'bar' ? (
        <div
          className="slide-counter-bar-badge"
          data-testid="slide-counter"
          data-style="bar"
          role="progressbar"
          aria-valuenow={slideIndex + 1}
          aria-valuemin={1}
          aria-valuemax={totalSlides}
          aria-label={`Slide ${slideIndex + 1} of ${totalSlides}`}
        >
          <div className="slide-counter-bar-track">
            <div className="slide-counter-bar-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      ) : styleType === 'dots' ? (
        <div
          className="slide-counter-dots"
          data-testid="slide-counter"
          data-style="dots"
          role="navigation"
          aria-label={`Slide ${slideIndex + 1} of ${totalSlides}`}
        >
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <span
              key={idx}
              className={`slide-counter-dot ${idx === slideIndex ? 'slide-counter-dot-active' : ''}`}
              aria-hidden="true"
            />
          ))}
        </div>
      ) : (
        <div
          className="sig-counter-badge slide-counter-number"
          dir="ltr"
          data-testid="slide-counter"
          data-style="number"
        >
          {formatSlideCounterValue(slideIndex, totalSlides, format)}
        </div>
      )}
    </div>
  );
};
