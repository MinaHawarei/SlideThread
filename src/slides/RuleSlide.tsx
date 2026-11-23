import React from 'react';
import type { SlideProps } from './types';
import { RichTextRenderer } from './RichTextRenderer';

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
          <RichTextRenderer content={slide.richFields?.title ?? title} inline />
        </h2>
      )}
      <div className={isLandscape ? 'rule-layout-landscape' : 'rule-layout-stacked'} dir={effectiveDir}>
        <div className="rule-card">
          <span className="rule-badge">{ifText}</span>
          <div className="rule-card-text">
            <RichTextRenderer content={slide.richFields?.cond ?? cond} />
          </div>
        </div>

        <div className={isLandscape ? 'rule-connector-h' : 'rule-connector-v'}>
          {isLandscape ? arrowChar : '↓'}
        </div>

        <div className="rule-card">
          <span className="rule-badge">{thenText}</span>
          <div className="rule-card-text">
            <RichTextRenderer content={slide.richFields?.res ?? res} />
          </div>
        </div>
      </div>
      {note && (
        <div className="rule-note" dir={effectiveDir}>
          <RichTextRenderer content={slide.richFields?.note ?? note} />
        </div>
      )}
    </div>
  );
};
