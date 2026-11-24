import React from 'react';
import type { ExtraElement } from '../core/schema';
import { MediaRenderer } from './MediaRenderer';
import { RichTextRenderer } from './RichTextRenderer';
import { getShapeSvg, getIconSvg } from '../assets';

export interface ExtrasRendererProps {
  extras?: readonly ExtraElement[];
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

      // Check if this extra references a vector asset from the shapes or icons pack
      if (extra.assetId) {
        const svgContent = getShapeSvg(extra.assetId) || getIconSvg(extra.assetId);
        if (svgContent) {
          return (
            <div
              data-testid={`shape-asset-${extra.id}`}
              className="shape-asset-svg icon-asset-svg"
              style={{
                width: '100%',
                height: '100%',
                color: fill,
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
            style={{ width: '100%', height: '100%', backgroundColor: fill, borderRadius: '50%' }}
          />
        );
      }
      if (extra.shape === 'line') {
        return (
          <div
            data-testid={`shape-line-${extra.id}`}
            style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}
          >
            <div style={{ width: '100%', height: 4, backgroundColor: fill }} />
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
            <polygon points="0,35 60,35 60,10 100,50 60,90 60,65 0,65" />
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
            borderRadius: 'var(--card-radius, 8px)',
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
            fontSize: 'calc(var(--ts-body, 24px))',
            lineHeight: 1.4,
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {extra.text ? <RichTextRenderer content={extra.text} inline={true} /> : null}
        </div>
      );
    }
    case 'image':
    case 'sticker': {
      return (
        <MediaRenderer
          media={extra.media}
          imageUrl={
            extra.assetId?.startsWith('http') ||
            extra.assetId?.startsWith('data:') ||
            extra.assetId?.startsWith('blob:')
              ? extra.assetId
              : undefined
          }
          style={{ width: '100%', height: '100%', objectFit: extra.media?.fit || 'contain' }}
        />
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
