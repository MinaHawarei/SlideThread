import React from 'react';
import type { SlideProps } from './types';
import { RichTextRenderer } from './RichTextRenderer';

export const QuoteSlide: React.FC<SlideProps> = ({ slide, textDir }) => {
  const { text, author } = slide.fields;
  const effectiveDir = textDir && textDir !== 'auto' ? textDir : 'auto';

  return (
    <div className="slide-content-area" style={{ justifyContent: 'center' }}>
      <div className="quote-layout" dir={effectiveDir}>
        <div className="quote-mark">“</div>
        {text && (
          <blockquote className="quote-text">
            <RichTextRenderer content={slide.richFields?.text ?? text} />
          </blockquote>
        )}
        {author && (
          <cite className="quote-author">
            — <RichTextRenderer content={slide.richFields?.author ?? author} inline />
          </cite>
        )}
      </div>
    </div>
  );
};
