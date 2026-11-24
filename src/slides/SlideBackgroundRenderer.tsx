import React, { useEffect, useState } from 'react';
import type { SlideBackground } from '../core/schema';
import { getAssetUrl } from '../core/assetStore';
import { getShapeSvg, getIconSvg, getEmojiSvg, getStickerSvg } from '../assets';

export interface SlideBackgroundRendererProps {
  background?: SlideBackground;
  width?: number;
  height?: number;
}

export const SlideBackgroundRenderer: React.FC<SlideBackgroundRendererProps> = ({ background }) => {
  const [assetUrl, setAssetUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (background?.assetId) {
      getAssetUrl(background.assetId).then((url) => {
        if (active) setAssetUrl(url ?? null);
      });
    } else {
      setAssetUrl(null);
    }
    return () => {
      active = false;
    };
  }, [background?.assetId]);

  if (!background) return null;

  let bgUrl: string | null = null;
  if (background.assetId) {
    bgUrl = assetUrl;
  } else if (background.symbolId) {
    const svg =
      getShapeSvg(background.symbolId) ||
      getIconSvg(background.symbolId) ||
      getEmojiSvg(background.symbolId) ||
      getStickerSvg(background.symbolId);
    if (svg) {
      bgUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }
  }

  if (!bgUrl && !background.fillColor) return null;

  const mode = background.mode || 'fill';
  const opacity = background.opacity !== undefined ? background.opacity : 1;
  const focalX = (background.focal?.x ?? 0.5) * 100;
  const focalY = (background.focal?.y ?? 0.5) * 100;

  const style: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
    opacity,
    pointerEvents: 'none',
    overflow: 'hidden',
  };

  if (mode === 'fill') {
    style.backgroundImage = bgUrl ? `url("${bgUrl}")` : undefined;
    style.backgroundSize = 'cover';
    style.backgroundPosition = `${focalX}% ${focalY}%`;
    style.backgroundRepeat = 'no-repeat';
  } else if (mode === 'fit') {
    style.backgroundImage = bgUrl ? `url("${bgUrl}")` : undefined;
    style.backgroundSize = 'contain';
    style.backgroundPosition = 'center';
    style.backgroundRepeat = 'no-repeat';
    style.backgroundColor = background.fillColor || 'transparent';
  } else if (mode === 'repeat') {
    style.backgroundImage = bgUrl ? `url("${bgUrl}")` : undefined;
    style.backgroundRepeat = 'repeat';
    const tileSize = background.tileSize || 120;
    style.backgroundSize = `${tileSize}px ${tileSize}px`;
    style.backgroundPosition = '0 0';
    style.backgroundColor = background.fillColor || 'transparent';
  }

  return (
    <div
      className="slide-custom-background"
      data-testid="slide-custom-background"
      style={style}
    />
  );
};
