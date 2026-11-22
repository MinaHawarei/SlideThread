import React from 'react';
import type { SlideProps } from './types';

export const RuleSlide: React.FC<SlideProps> = ({ slide, aspectClass, textDir }) => {
  const { title, cond, res, note, condLabel, resLabel } = slide.fields;
  const isLandscape = aspectClass === 'landscape';
  const effectiveDir = textDir && textDir !== 'auto' ? textDir : 'auto';
  const isRtl = textDir === 'rtl';

  const ifText = condLabel || (isRtl ? 'إذا' : 'IF');
  const thenText = resLabel || (isRtl ? 'إذن' : 'THEN');
  const arrowChar = isRtl ? '←' : '→';

  return (
    <div className="slide-content-area" style={{ justifyContent: 'center' }}>
      {title && (
        <h2 className="slide-title-h2" dir={effectiveDir}>
          {title}
        </h2>
      )}
      <div className={isLandscape ? 'rule-layout-landscape' : 'rule-layout-stacked'} dir={effectiveDir}>
        <div className="rule-card">
          <span className="rule-badge">{ifText}</span>
          <p className="rule-card-text">{cond}</p>
        </div>

        <div className={isLandscape ? 'rule-connector-h' : 'rule-connector-v'}>
          {isLandscape ? arrowChar : '↓'}
        </div>

        <div className="rule-card">
          <span className="rule-badge">{thenText}</span>
          <p className="rule-card-text">{res}</p>
        </div>
      </div>
      {note && (
        <div className="rule-note" dir={effectiveDir}>
          {note}
        </div>
      )}
    </div>
  );
};
