import React from 'react';
import type { SlideProps } from './types';

export const StatSlide: React.FC<SlideProps> = ({ slide, aspectClass, textDir }) => {
  const { value, label, note } = slide.fields;
  const isLandscape = aspectClass === 'landscape';
  const effectiveDir = textDir && textDir !== 'auto' ? textDir : 'auto';

  return (
    <div className="slide-content-area" style={{ justifyContent: 'center' }}>
      <div className={isLandscape ? 'stat-layout-landscape' : 'stat-layout-stacked'} dir={effectiveDir}>
        <div className="stat-big-value">{value}</div>
        <div className="stat-desc-group">
          {label && <h2 className="stat-label">{label}</h2>}
          {note && <p style={{ fontSize: '28px', color: 'var(--mute)', margin: 0 }}>{note}</p>}
        </div>
      </div>
    </div>
  );
};
