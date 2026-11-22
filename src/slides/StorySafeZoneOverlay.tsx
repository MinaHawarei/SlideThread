import React from 'react';
import { getStorySafeZoneInsets } from '../core/storySafeZones';

export interface StorySafeZoneOverlayProps {
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const StorySafeZoneOverlay: React.FC<StorySafeZoneOverlayProps> = ({
  height = 1920,
  className = '',
  style = {},
}) => {
  const insets = getStorySafeZoneInsets(height);

  return (
    <div
      className={`story-safe-zone-overlay ${className}`.trim()}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 50,
        boxSizing: 'border-box',
        ...style,
      }}
      data-testid="story-safe-zone-overlay"
      data-no-export="true"
      aria-hidden="true"
    >
      {/* Top Unsafe Region */}
      <div
        className="story-unsafe-zone-top"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: `${insets.top}px`,
          background: 'rgba(239, 68, 68, 0.15)',
          borderBottom: '2.5px dashed rgba(239, 68, 68, 0.8)',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}
      >
        <span
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            color: '#fca5a5',
            padding: '6px 16px',
            borderRadius: '9999px',
            fontSize: '18px',
            fontWeight: 700,
            letterSpacing: '0.5px',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
          }}
        >
          ⚠️ Top Safe Zone (14% / {insets.top}px) · Profile & Story Header
        </span>
      </div>

      {/* Bottom Unsafe Region */}
      <div
        className="story-unsafe-zone-bottom"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: `${insets.bottom}px`,
          background: 'rgba(239, 68, 68, 0.15)',
          borderTop: '2.5px dashed rgba(239, 68, 68, 0.8)',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}
      >
        <span
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            color: '#fca5a5',
            padding: '6px 16px',
            borderRadius: '9999px',
            fontSize: '18px',
            fontWeight: 700,
            letterSpacing: '0.5px',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
          }}
        >
          ⚠️ Bottom Safe Zone (14% / {insets.bottom}px) · Reply & Actions Bar
        </span>
      </div>
    </div>
  );
};
