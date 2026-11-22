import React from 'react';
import type { SlideProps } from './types';
import { MediaRenderer } from './MediaRenderer';

export const ExplainSlide: React.FC<SlideProps> = ({ slide, aspectClass, textDir }) => {
  const { title, body, imageUrl } = slide.fields;
  const { media } = slide;
  const isLandscape = aspectClass === 'landscape';
  const effectiveDir = textDir && textDir !== 'auto' ? textDir : 'auto';

  const isReplaceText = media?.placement === 'replace-text';
  const isTopMedia = media?.placement === 'top';
  const isSideMedia = media?.placement === 'side';

  const lines = (body || '').split('\n').filter((l) => l.trim().length > 0);

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
        {title && <h2 className="slide-title-h2">{title}</h2>}
      </div>

      {isTopMedia && renderMediaCard({ marginBottom: '32px' })}

      {isReplaceText ? (
        <div style={{ flex: 1, width: '100%', minHeight: '360px', position: 'relative' }}>
          {renderMediaCard({ height: '100%' })}
        </div>
      ) : isSideMedia ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'center' }}>
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
              return (
                <p key={idx} className="explain-paragraph">
                  {trimmed}
                </p>
              );
            })}
          </div>
          {renderMediaCard({ height: '400px' })}
        </div>
      ) : (
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
      )}
    </div>
  );
};

