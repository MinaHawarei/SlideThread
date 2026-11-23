import React from 'react';
import type { SlideProps } from './types';
import { RichTextRenderer } from './RichTextRenderer';

export const CoverSlide: React.FC<SlideProps> = ({ slide, aspectClass, textDir }) => {
  const { tag, title, sub, rule } = slide.fields;
  const isLandscape = aspectClass === 'landscape';
  const effectiveDir = textDir && textDir !== 'auto' ? textDir : 'auto';

  return (
    <div className={`slide-content-area ${isLandscape ? 'cover-layout-landscape' : 'cover-layout-stacked'}`}>
      <div className="cover-title-group" dir={effectiveDir}>
        {tag && (
          <div className="slide-tag">
            <RichTextRenderer content={slide.richFields?.tag ?? tag} inline />
          </div>
        )}
        {title && (
          <h1 className="slide-title-h1">
            <RichTextRenderer content={slide.richFields?.title ?? title} inline />
          </h1>
        )}
        {sub && (
          <p className="slide-sub">
            <RichTextRenderer content={slide.richFields?.sub ?? sub} inline />
          </p>
        )}
        {rule && (
          <div className="slide-mono-line">
            <RichTextRenderer content={slide.richFields?.rule ?? rule} inline />
          </div>
        )}
      </div>
      {isLandscape && (
        <div className="cover-visual-group">
          {/* Visual card motif for landscape */}
          <div className="slide-card">
            <div style={{ fontSize: '32px', color: 'var(--acc)', fontWeight: 600 }}>
              ✦ SlideThread
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
