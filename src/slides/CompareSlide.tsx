import React from 'react';
import type { SlideProps } from './types';

export const CompareSlide: React.FC<SlideProps> = ({ slide, aspectClass, textDir }) => {
  const { title, l1, t1, l2, t2 } = slide.fields;
  const is2Col = aspectClass === 'landscape' || aspectClass === 'square';
  const effectiveDir = textDir && textDir !== 'auto' ? textDir : 'auto';

  return (
    <div className="slide-content-area" style={{ justifyContent: 'center' }}>
      {title && (
        <h2 className="slide-title-h2" dir={effectiveDir}>
          {title}
        </h2>
      )}
      <div className={is2Col ? 'compare-layout-2col' : 'compare-layout-stacked'} dir={effectiveDir}>
        <div className="compare-card-bad">
          <span className="compare-badge-bad">{l1 || '✗ Avoid'}</span>
          <p className="compare-text">{t1}</p>
        </div>
        <div className="compare-card-ok">
          <span className="compare-badge-ok">{l2 || '✓ Prefer'}</span>
          <p className="compare-text">{t2}</p>
        </div>
      </div>
    </div>
  );
};
