import React from 'react';
import type { SlideProps } from './types';
import { MediaRenderer } from './MediaRenderer';

export const ImageSlide: React.FC<SlideProps> = ({ slide, textDir }) => {
  const { caption, imageUrl } = slide.fields;
  const { media } = slide;
  const effectiveDir = textDir && textDir !== 'auto' ? textDir : 'auto';

  const hasImage = Boolean(media?.assetId || imageUrl);

  return (
    <div className="slide-content-area" style={{ padding: 0 }}>
      <div className="image-fullbleed-wrapper">
        {hasImage ? (
          <MediaRenderer media={media} imageUrl={imageUrl} className="image-fullbleed-img" />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'radial-gradient(circle at 50% 40%, var(--bg2) 0%, var(--bg) 100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '24px',
            }}
          >
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="var(--acc)" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span style={{ fontSize: '32px', color: 'var(--mute)' }}>Full-Bleed Media</span>
          </div>
        )}
      </div>

      {caption && (
        <div className="image-caption-bar" dir={effectiveDir}>
          {caption}
        </div>
      )}
    </div>
  );
};
