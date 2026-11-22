import React from 'react';
import type { SlideProps } from './types';

export const CodeSlide: React.FC<SlideProps> = ({ slide, textDir }) => {
  const { title, code, note } = slide.fields;
  const effectiveDir = textDir && textDir !== 'auto' ? textDir : 'auto';

  return (
    <div className="slide-content-area" style={{ justifyContent: 'center' }}>
      {title && (
        <h2 className="slide-title-h2" dir={effectiveDir}>
          {title}
        </h2>
      )}
      <div className="code-container" dir="ltr">
        <code>{code}</code>
      </div>
      {note && (
        <div style={{ marginTop: '20px', fontSize: '28px', color: 'var(--mute)' }} dir={effectiveDir}>
          {note}
        </div>
      )}
    </div>
  );
};
