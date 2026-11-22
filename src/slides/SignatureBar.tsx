import React from 'react';
import type { BrandSettings, SocialPlatform } from '../core/schema';
import { formatSlideCounter } from './signatureUtils';

export interface SignatureBarProps {
  brand?: Partial<BrandSettings>;
  slideIndex?: number; // 0-based
  totalSlides?: number;
  showCounter?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const SocialIcon: React.FC<{
  platform: SocialPlatform;
  size?: number;
  className?: string;
}> = ({ platform, size = 20, className = '' }) => {
  const style: React.CSSProperties = {
    width: size,
    height: size,
    display: 'inline-block',
    flexShrink: 0,
    verticalAlign: 'middle',
  };

  switch (platform) {
    case 'instagram':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={style}
          className={className}
          aria-hidden="true"
        >
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          style={style}
          className={className}
          aria-hidden="true"
        >
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.53 1.53 0 0 0 0-3.06 1.53 1.53 0 0 0 0 3.06m1.4 9.74V9.93H5.06v8.57h2.8z" />
        </svg>
      );
    case 'facebook':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          style={style}
          className={className}
          aria-hidden="true"
        >
          <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95C18.05 21.45 22 17.19 22 12z" />
        </svg>
      );
    case 'x':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          style={style}
          className={className}
          aria-hidden="true"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case 'github':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          style={style}
          className={className}
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
          />
        </svg>
      );
    case 'youtube':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          style={style}
          className={className}
          aria-hidden="true"
        >
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          style={style}
          className={className}
          aria-hidden="true"
        >
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.42a6.34 6.34 0 0 0-.86-.06 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34-6.34 6.34 6.34 0 0 0 6.34-6.34V8.71a8.28 8.28 0 0 0 4.77 1.48V6.74c-.4-.01-.79-.03-1.04-.05z" />
        </svg>
      );
    case 'website':
    default:
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={style}
          className={className}
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );
  }
};

export const SignatureBar: React.FC<SignatureBarProps> = ({
  brand,
  slideIndex,
  totalSlides,
  showCounter = true,
  className = '',
  style = {},
}) => {
  if (brand?.showSignature === false) {
    return null;
  }

  const displayName = brand?.displayName || '';
  const handle = brand?.handle || '';
  const photoDataUrl = brand?.photoDataUrl;
  const showSocials = brand?.showSocials === true;
  const rawSocials = brand?.socials || [];

  // Spec §6.2: max 3 shown, the rest collapsed, never overflowing
  const visibleSocials = rawSocials.slice(0, 3);
  const extraSocialsCount = rawSocials.length - 3;

  // Initial for avatar placeholder
  const initial = displayName.trim().charAt(0).toUpperCase() || '?';

  // Counter check
  const shouldShowCounter =
    showCounter &&
    typeof slideIndex === 'number' &&
    typeof totalSlides === 'number' &&
    totalSlides > 0;

  const counterText = shouldShowCounter
    ? formatSlideCounter(slideIndex + 1, totalSlides)
    : '';

  return (
    <div
      className={`slide-signature-bar ${className}`.trim()}
      style={style}
      data-testid="signature-bar"
    >
      <div className="sig-author-section">
        <div className="sig-avatar-ring">
          {photoDataUrl ? (
            <img
              src={photoDataUrl}
              alt={displayName || 'Avatar'}
              className="sig-avatar-img"
            />
          ) : (
            <div className="sig-avatar-placeholder">{initial}</div>
          )}
        </div>

        <div className="sig-text-block">
          <div className="sig-names-row">
            {displayName && <span className="sig-display-name">{displayName}</span>}
            {handle && <span className="sig-handle">{handle}</span>}
          </div>

          {showSocials && visibleSocials.length > 0 && (
            <div className="sig-socials-row">
              {visibleSocials.map((s, idx) => (
                <div key={idx} className="sig-social-pill">
                  <SocialIcon platform={s.platform} size={20} />
                  <span className="sig-social-handle">{s.handle}</span>
                </div>
              ))}
              {extraSocialsCount > 0 && (
                <span className="sig-social-more">+{extraSocialsCount}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {shouldShowCounter && (
        <div className="sig-counter-badge" dir="ltr" data-testid="slide-counter">
          {counterText}
        </div>
      )}
    </div>
  );
};
