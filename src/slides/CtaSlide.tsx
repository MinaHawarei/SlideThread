import React, { useState, useEffect } from 'react';
import type { SlideProps } from './types';
import { RichTextRenderer } from './RichTextRenderer';
import { useAvatarUpload } from '../ui/common/useAvatarUpload';
import { getAssetUrl } from '../core/assetStore';

export const CtaSlide: React.FC<SlideProps> = ({
  slide,
  aspectClass,
  textDir,
  brand,
  signatureConfig,
}) => {
  const { title, body, action, name, handle, imageUrl } = slide.fields;
  const isLandscape = aspectClass === 'landscape';
  const effectiveDir = textDir && textDir !== 'auto' ? textDir : 'auto';

  const [resolvedMediaUrl, setResolvedMediaUrl] = useState<string | undefined>();
  const { fileInputRef, handleFileChange } = useAvatarUpload();

  useEffect(() => {
    let active = true;
    if (slide.media?.assetId) {
      getAssetUrl(slide.media.assetId).then((url) => {
        if (active) setResolvedMediaUrl(url);
      });
    } else {
      setResolvedMediaUrl(undefined);
    }
    return () => {
      active = false;
    };
  }, [slide.media?.assetId]);

  const photoShape = signatureConfig?.photoShape || 'circle';
  const photoDataUrl = resolvedMediaUrl || (typeof imageUrl === 'string' && imageUrl ? imageUrl : brand?.photoDataUrl);
  const mediaOpacity = slide.overrides?.[aspectClass]?.['media']?.opacity ?? 1;
  const displayName = name || brand?.displayName || '';
  const displayHandle = handle || brand?.handle || '';
  const initial = (displayName || title || 'S').trim().charAt(0).toUpperCase();

  return (
    <div className="slide-content-area" style={{ justifyContent: 'center' }}>
      <div className={isLandscape ? 'cta-layout-landscape' : 'cta-layout-stacked'} dir={effectiveDir}>
        <div
          className={`cta-profile-group cta-shape-${photoShape}`}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
          <div
            className="cta-avatar-ring slide-media-element"
            data-testid="cta-avatar-ring"
            data-slot="media"
            data-shape={photoShape}
            role="button"
            tabIndex={0}
            aria-label={photoDataUrl ? 'Photo' : 'Empty photo placeholder'}
          >
            {photoDataUrl ? (
              <img
                src={photoDataUrl}
                alt={displayName || 'Avatar'}
                className="cta-avatar-img"
                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: mediaOpacity }}
                data-testid="cta-avatar-img"
              />
            ) : (
              <div
                className="cta-avatar-placeholder"
                data-testid="cta-avatar-placeholder"
                style={{ opacity: mediaOpacity }}
              >
                {initial}
                <span className="avatar-camera-badge cta-avatar-badge" aria-hidden="true">📷</span>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              data-testid="cta-avatar-input"
              onChange={handleFileChange}
              className="sr-only hidden"
              style={{ display: 'none' }}
            />
          </div>
          {(displayName || displayHandle) && (
            <div className="cta-profile-meta" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {displayName && (
                <div className="cta-name" style={{ fontSize: '36px', fontWeight: 700, color: 'var(--ink)' }}>
                  <RichTextRenderer content={slide.richFields?.name ?? displayName} inline />
                </div>
              )}
              {displayHandle && (
                <div className="cta-handle" style={{ fontSize: '28px', color: 'var(--mute)', marginTop: '4px' }}>
                  <RichTextRenderer content={slide.richFields?.handle ?? displayHandle} inline />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="cta-action-group" style={{ display: 'flex', flexDirection: 'column', alignItems: isLandscape ? 'flex-start' : 'center' }}>
          {title && (
            <h2 className="slide-title-h2" style={{ textAlign: isLandscape ? 'start' : 'center' }}>
              <RichTextRenderer content={slide.richFields?.title ?? title} inline />
            </h2>
          )}
          {body && (
            <div className="slide-sub" style={{ textAlign: isLandscape ? 'start' : 'center', marginBottom: 0 }}>
              <RichTextRenderer content={slide.richFields?.body ?? body} />
            </div>
          )}
          {action && (
            <button type="button" className="cta-action-button">
              <RichTextRenderer content={slide.richFields?.action ?? action} inline />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
