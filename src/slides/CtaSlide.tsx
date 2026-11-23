import React from 'react';
import type { SlideProps } from './types';
import { RichTextRenderer } from './RichTextRenderer';

export const CtaSlide: React.FC<SlideProps> = ({ slide, aspectClass, textDir }) => {
  const { title, body, action, name, handle } = slide.fields;
  const isLandscape = aspectClass === 'landscape';
  const effectiveDir = textDir && textDir !== 'auto' ? textDir : 'auto';

  const initial = (name || title || 'S').trim().charAt(0).toUpperCase();

  return (
    <div className="slide-content-area" style={{ justifyContent: 'center' }}>
      <div className={isLandscape ? 'cta-layout-landscape' : 'cta-layout-stacked'} dir={effectiveDir}>
        <div className="cta-profile-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="cta-avatar-ring">
            <div className="cta-avatar-placeholder">{initial}</div>
          </div>
          {name && (
            <div style={{ fontSize: '36px', fontWeight: 700, color: 'var(--ink)' }}>
              <RichTextRenderer content={slide.richFields?.name ?? name} inline />
            </div>
          )}
          {handle && (
            <div style={{ fontSize: '28px', color: 'var(--mute)', marginTop: '4px' }}>
              <RichTextRenderer content={slide.richFields?.handle ?? handle} inline />
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
