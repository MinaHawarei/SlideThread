import React from 'react';
import type { SlideProps } from './types';
import { RichTextRenderer } from './RichTextRenderer';

export const StatSlide: React.FC<SlideProps> = ({ slide, aspectClass, textDir }) => {
  const { value, label, note } = slide.fields;
  const isLandscape = aspectClass === 'landscape';
  const effectiveDir = textDir && textDir !== 'auto' ? textDir : 'auto';

  return (
    <div className="slide-content-area" style={{ justifyContent: 'center' }}>
      <div className={isLandscape ? 'stat-layout-landscape' : 'stat-layout-stacked'} dir={effectiveDir}>
        <div className="stat-big-value">
          <RichTextRenderer content={slide.richFields?.value ?? value} inline />
        </div>
        <div className="stat-desc-group">
          {label && (
            <h2 className="stat-label">
              <RichTextRenderer content={slide.richFields?.label ?? label} inline />
            </h2>
          )}
          {note && (
            <p className="stat-note" style={{ fontSize: '28px', color: 'var(--mute)', margin: 0 }}>
              <RichTextRenderer content={slide.richFields?.note ?? note} inline />
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
