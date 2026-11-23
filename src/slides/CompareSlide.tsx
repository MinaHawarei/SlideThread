import React from 'react';
import type { SlideProps } from './types';
import { RichTextRenderer } from './RichTextRenderer';

export const CompareSlide: React.FC<SlideProps> = ({ slide, aspectClass, textDir }) => {
  const { title, l1, t1, l2, t2 } = slide.fields;
  const is2Col = aspectClass === 'landscape' || aspectClass === 'square';
  const effectiveDir = textDir && textDir !== 'auto' ? textDir : 'auto';

  return (
    <div className="slide-content-area" style={{ justifyContent: 'center' }}>
      {title && (
        <h2 className="slide-title-h2" dir={effectiveDir}>
          <RichTextRenderer content={slide.richFields?.title ?? title} inline />
        </h2>
      )}
      <div className={is2Col ? 'compare-layout-2col' : 'compare-layout-stacked'} dir={effectiveDir}>
        <div className="compare-card-bad">
          <span className="compare-badge-bad">{l1 || '✗ Avoid'}</span>
          <div className="compare-text">
            <RichTextRenderer content={slide.richFields?.t1 ?? t1} />
          </div>
        </div>
        <div className="compare-card-ok">
          <span className="compare-badge-ok">{l2 || '✓ Prefer'}</span>
          <div className="compare-text">
            <RichTextRenderer content={slide.richFields?.t2 ?? t2} />
          </div>
        </div>
      </div>
    </div>
  );
};
