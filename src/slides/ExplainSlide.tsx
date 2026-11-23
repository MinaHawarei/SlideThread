import React from 'react';
import type { SlideProps } from './types';
import { MediaRenderer } from './MediaRenderer';
import { RichTextRenderer } from './RichTextRenderer';

export const ExplainSlide: React.FC<SlideProps> = ({ slide, aspectClass, textDir }) => {
  const { title, body, imageUrl } = slide.fields;
  const richBody = slide.richFields?.body ?? body ?? '';
  const richTitle = slide.richFields?.title ?? title;
  const { media } = slide;
  const isLandscape = aspectClass === 'landscape';
  const effectiveDir = textDir && textDir !== 'auto' ? textDir : 'auto';

  const isReplaceText = media?.placement === 'replace-text';
  const isTopMedia = media?.placement === 'top';
  const isSideMedia = media?.placement === 'side';

  const renderMediaCard = (style?: React.CSSProperties) => (
    <div
      className="slide-card"
      style={{
        width: '100%',
        height: '320px',
        overflow: 'hidden',
        padding: 0,
        position: 'relative',
        ...style,
      }}
    >
      <MediaRenderer media={media} imageUrl={imageUrl} />
    </div>
  );

  return (
    <div className={`slide-content-area ${isLandscape ? 'explain-layout-landscape' : 'explain-layout-stacked'}`}>
      <div className="explain-header" dir={effectiveDir}>
        {richTitle && (
          <h2 className="slide-title-h2">
            <RichTextRenderer content={richTitle} inline />
          </h2>
        )}
      </div>

      {isTopMedia && renderMediaCard({ marginBottom: '32px' })}

      {isReplaceText ? (
        <div style={{ flex: 1, width: '100%', minHeight: '360px', position: 'relative' }}>
          {renderMediaCard({ height: '100%' })}
        </div>
      ) : isSideMedia ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'center' }}>
          <div className="explain-body-list" dir={effectiveDir}>
            <RichTextRenderer content={richBody} />
          </div>
          {renderMediaCard({ height: '400px' })}
        </div>
      ) : (
        <div className="explain-body-list" dir={effectiveDir}>
          <RichTextRenderer content={richBody} />
        </div>
      )}
    </div>
  );
};

