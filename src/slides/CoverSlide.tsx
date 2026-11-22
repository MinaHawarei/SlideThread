import React from 'react';
import type { SlideProps } from './types';

export const CoverSlide: React.FC<SlideProps> = ({ slide, aspectClass, textDir }) => {
  const { tag, title, sub, rule } = slide.fields;
  const isLandscape = aspectClass === 'landscape';
  const effectiveDir = textDir && textDir !== 'auto' ? textDir : 'auto';

  return (
    <div className={`slide-content-area ${isLandscape ? 'cover-layout-landscape' : 'cover-layout-stacked'}`}>
      <div className="cover-title-group" dir={effectiveDir}>
        {tag && <div className="slide-tag">{tag}</div>}
        {title && <h1 className="slide-title-h1">{title}</h1>}
        {sub && <p className="slide-sub">{sub}</p>}
        {rule && <div className="slide-mono-line">{rule}</div>}
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
