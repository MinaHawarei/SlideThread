import React, { useId } from 'react';
import type { TemplateBackgroundProps } from './types';
import { DecorationBackground } from './DecorationBackground';

export const SoftGradientBackground: React.FC<TemplateBackgroundProps> = (props) => {
  const gradientId = `soft-gradient-${useId().replaceAll(':', '')}`;
  return (
    <>
      <svg width="100%" height="100%" viewBox={`${props.index * props.width} 0 ${props.width} ${props.height}`} preserveAspectRatio="none" aria-hidden="true" data-testid="soft-gradient-bg">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={props.tokens.bg2} />
            <stop offset="100%" stopColor={props.tokens.bg} />
          </linearGradient>
        </defs>
        <rect x={props.index * props.width} y="0" width={props.width} height={props.height} fill={`url(#${gradientId})`} />
      </svg>
      <DecorationBackground {...props} generator="blobs" intensity={0.5} params={{ count: 7 }} className="soft-gradient-blobs" />
    </>
  );
};
