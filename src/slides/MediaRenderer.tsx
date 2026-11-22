import React, { useEffect, useState } from 'react';
import type { MediaRef } from '../core/schema';
import { getAssetUrl } from '../core/assetStore';

export interface MediaRendererProps {
  media?: MediaRef;
  imageUrl?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const MediaRenderer: React.FC<MediaRendererProps> = ({
  media,
  imageUrl,
  className = '',
  style = {},
}) => {
  const [resolvedUrl, setResolvedUrl] = useState<string | undefined>(imageUrl);

  useEffect(() => {
    if (imageUrl) {
      setResolvedUrl(imageUrl);
      return;
    }
    if (media?.assetId) {
      let isMounted = true;
      getAssetUrl(media.assetId).then((url) => {
        if (isMounted && url) {
          setResolvedUrl(url);
        }
      });
      return () => {
        isMounted = false;
      };
    }
  }, [media?.assetId, imageUrl]);

  if (!media && !resolvedUrl) {
    return null;
  }

  const fit = media?.fit || 'cover';
  const focalX = media?.focal ? `${media.focal.x * 100}%` : '50%';
  const focalY = media?.focal ? `${media.focal.y * 100}%` : '50%';

  const imgStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: fit,
    objectPosition: `${focalX} ${focalY}`,
    display: 'block',
    ...style,
  };

  if (!resolvedUrl) {
    return (
      <div
        className={`media-placeholder ${className}`.trim()}
        style={{
          width: '100%',
          height: '100%',
          background: 'var(--card)',
          border: '1.5px dashed var(--line)',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--mute)',
          fontSize: '24px',
          ...style,
        }}
      >
        Media Placeholder
      </div>
    );
  }

  return (
    <img
      src={resolvedUrl}
      alt="Slide media"
      className={`slide-media-element ${className}`.trim()}
      style={imgStyle}
    />
  );
};
