import React from 'react';
import type { SlideProps } from './types';

export const ExplainSlide: React.FC<SlideProps> = ({ slide, aspectClass, textDir }) => {
  const { title, body } = slide.fields;
  const isLandscape = aspectClass === 'landscape';
  const effectiveDir = textDir && textDir !== 'auto' ? textDir : 'auto';

  const lines = (body || '').split('\n').filter((l) => l.trim().length > 0);

  return (
    <div className={`slide-content-area ${isLandscape ? 'explain-layout-landscape' : 'explain-layout-stacked'}`}>
      <div className="explain-header" dir={effectiveDir}>
        {title && <h2 className="slide-title-h2">{title}</h2>}
      </div>
      <div className="explain-body-list" dir={effectiveDir}>
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('- ')) {
            return (
              <div key={idx} className="explain-bullet-item">
                <span className="explain-bullet-node" />
                <span>{trimmed.substring(2)}</span>
              </div>
            );
          }
          const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
          if (numMatch) {
            return (
              <div key={idx} className="explain-bullet-item">
                <span className="explain-number-node">{numMatch[1]}</span>
                <span>{numMatch[2]}</span>
              </div>
            );
          }
          return (
            <p key={idx} className="explain-paragraph">
              {trimmed}
            </p>
          );
        })}
      </div>
    </div>
  );
};
