import React from 'react';
import type { ExtraElement } from '../core/schema';
import { MediaRenderer } from './MediaRenderer';
import { RichTextRenderer } from './RichTextRenderer';
import { getShapeSvg, getIconSvg, getEmojiSvg, getStickerSvg } from '../assets';
import { buildExtraImageFilter } from '../core/extraStyles';
import { textStyleToCss } from '../core/textStyle';

export interface ExtrasRendererProps {
  extras?: readonly ExtraElement[];
}

function borderStyle(extra: ExtraElement): React.CSSProperties {
  if (!extra.strokeColor || !extra.strokeWidth || extra.strokeWidth <= 0) return {};
  return { border: `${extra.strokeWidth}px ${extra.strokeStyle ?? 'solid'} ${extra.strokeColor}`, boxSizing: 'border-box' };
}

export const ExtrasRenderer: React.FC<ExtrasRendererProps> = ({ extras }) => {
  if (!extras || extras.length === 0) return null;

  return (
    <div
      className="slide-extras-container"
      data-testid="slide-extras-container"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 5,
      }}
    >
      {extras.map((extra) => {
        if (extra.hidden) return null;

        return (
          <div
            key={extra.id}
            data-testid={`extra-element-${extra.id}`}
            data-extra-id={extra.id}
            data-extra-kind={extra.kind}
            style={{
              position: 'absolute',
              left: `${extra.x * 100}%`,
              top: `${extra.y * 100}%`,
              width: `${extra.w * 100}%`,
              height: `${extra.h * 100}%`,
              transform: `rotate(${extra.rotation}deg)`,
              transformOrigin: 'center',
              opacity: extra.opacity !== undefined ? extra.opacity : 1,
              zIndex: extra.z,
              boxSizing: 'border-box',
              overflow: 'hidden',
            }}
          >
            {renderExtraContent(extra)}
          </div>
        );
      })}
    </div>
  );
};

function renderExtraContent(extra: ExtraElement): React.ReactNode {
  switch (extra.kind) {
    case 'shape': {
      const fill = extra.fill || 'var(--acc, #0891b2)';

      // Check if this extra references a vector asset from shapes, icons, emoji, or stickers pack
      if (extra.assetId) {
        const svgContent =
          getShapeSvg(extra.assetId) ||
          getIconSvg(extra.assetId) ||
          getEmojiSvg(extra.assetId) ||
          getStickerSvg(extra.assetId);

        if (svgContent) {
          const isRecolorable = !getEmojiSvg(extra.assetId) && !getStickerSvg(extra.assetId);
          return (
            <div
              data-testid={`shape-asset-${extra.id}`}
              className="shape-asset-svg icon-asset-svg"
              style={{
                width: '100%',
                height: '100%',
                color: isRecolorable ? fill : undefined,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          );
        }
      }

      if (extra.shape === 'ellipse') {
        return (
          <div
            data-testid={`shape-ellipse-${extra.id}`}
            style={{ width: '100%', height: '100%', backgroundColor: fill, borderRadius: '50%', ...borderStyle(extra) }}
          />
        );
      }
      if (extra.shape === 'line') {
        return (
          <div
            data-testid={`shape-line-${extra.id}`}
            style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}
          >
            <div style={{ width: '100%', height: extra.strokeWidth ?? 4, backgroundColor: fill, ...(extra.strokeStyle === 'dashed' ? { background: `repeating-linear-gradient(90deg, ${fill} 0 8px, transparent 8px 14px)` } : extra.strokeStyle === 'dotted' ? { background: `radial-gradient(circle, ${fill} 0 2px, transparent 2.5px) 0 50% / 8px 6px repeat-x` } : {}) }} />
          </div>
        );
      }
      if (extra.shape === 'arrow') {
        return (
          <svg
            data-testid={`shape-arrow-${extra.id}`}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ width: '100%', height: '100%', fill }}
          >
            <polygon points="0,35 60,35 60,10 100,50 60,90 60,65 0,65" fill={fill} stroke={extra.strokeWidth ? extra.strokeColor : undefined} strokeWidth={extra.strokeWidth} strokeDasharray={extra.strokeStyle === 'dashed' ? '6 4' : extra.strokeStyle === 'dotted' ? '1 4' : undefined} vectorEffect="non-scaling-stroke" />
          </svg>
        );
      }
      // Default rectangle
      return (
        <div
          data-testid={`shape-rectangle-${extra.id}`}
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: fill,
            borderRadius: extra.cornerRadius === undefined ? 'var(--card-radius, 8px)' : `${extra.cornerRadius}px`,
            ...borderStyle(extra),
          }}
        />
      );
    }
    case 'text': {
      const color = extra.fill || 'var(--ink, #0f172a)';
      return (
        <div
          data-testid={`text-extra-${extra.id}`}
          style={{
            width: '100%',
            height: '100%',
            color,
            backgroundColor: extra.backgroundColor,
            borderRadius: extra.backgroundColor ? `${extra.cornerRadius ?? 8}px` : undefined,
            border: extra.backgroundColor && extra.strokeColor && extra.strokeWidth ? `${extra.strokeWidth}px ${extra.strokeStyle ?? 'solid'} ${extra.strokeColor}` : undefined,
            padding: extra.backgroundColor ? '0.12em 0.35em' : undefined,
            boxSizing: 'border-box',
            fontSize: 'calc(var(--ts-body, 24px))',
            lineHeight: 1.4,
        ...textStyleToCss(extra.textStyle),
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {extra.text ? <RichTextRenderer content={extra.text} inline={true} inheritBlockTypography /> : null}
        </div>
      );
    }
    case 'image':
    case 'sticker': {
      let borderRadius = '0px';
      if (extra.shape === 'ellipse') {
        borderRadius = '50%';
      } else if (extra.shape === 'rectangle') {
        borderRadius = extra.cornerRadius === undefined ? '16px' : `${extra.cornerRadius}px`;
      } else if (extra.kind === 'image' && extra.cornerRadius !== undefined) {
        borderRadius = `${extra.cornerRadius}px`;
      }

      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius,
            overflow: 'hidden',
            position: 'relative',
          }}
          data-testid={`image-extra-mask-${extra.id}`}
        >
          <MediaRenderer
            media={extra.media}
            imageUrl={
              extra.assetId?.startsWith('http') ||
                extra.assetId?.startsWith('data:') ||
                extra.assetId?.startsWith('blob:')
                ? extra.assetId
                : undefined
            }
            style={{ width: '100%', height: '100%', objectFit: extra.media?.fit || 'cover', filter: buildExtraImageFilter(extra.filters) }}
          />
          {extra.kind === 'image' && extra.strokeColor && extra.strokeWidth ? <div aria-hidden="true" data-testid={`image-extra-stroke-${extra.id}`} style={{ position: 'absolute', inset: 0, borderRadius, border: `${extra.strokeWidth}px ${extra.strokeStyle ?? 'solid'} ${extra.strokeColor}`, boxSizing: 'border-box', pointerEvents: 'none' }} /> : null}
        </div>
      );
    }
    case 'icon': {
      return (
        <div
          data-testid={`icon-extra-${extra.id}`}
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: extra.fill || 'var(--ink, #0f172a)',
            fontSize: 'calc(var(--ts-h2, 48px))',
          }}
        >
          {extra.assetId || '★'}
        </div>
      );
    }
    default:
      return null;
  }
}
