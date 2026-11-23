import React, { useMemo } from 'react';
import type { DecorationId, DecorationPrimitive } from './decorations/generators';
import { generateDecoration } from './decorations/generators';
import type { TemplateBackgroundProps } from './types';

interface DecorationBackgroundProps extends TemplateBackgroundProps {
  generator: DecorationId;
  intensity?: number;
  params?: Readonly<Record<string, unknown>>;
  className?: string;
  testId?: string;
}

function renderPrimitive(primitive: DecorationPrimitive, index: number, offset: number, accent: string): React.ReactNode {
  if (primitive.kind === 'line') {
    return <line key={index} x1={primitive.x1 + offset} y1={primitive.y1} x2={primitive.x2 + offset} y2={primitive.y2} stroke={primitive.stroke} strokeWidth={primitive.strokeWidth} opacity={primitive.opacity} />;
  }
  if (primitive.kind === 'polyline') {
    const points = primitive.points.map(({ x, y }) => `${x + offset},${y}`).join(' ');
    return <polyline key={index} points={points} fill={primitive.fill ?? 'none'} stroke={primitive.stroke} strokeWidth={primitive.strokeWidth} opacity={primitive.opacity} />;
  }
  if (primitive.fill === accent) {
    return <g key={index} className="network-accent-node"><circle cx={primitive.cx + offset} cy={primitive.cy} r={primitive.r + 5} fill="none" stroke={primitive.fill} strokeWidth="2.5" opacity={primitive.opacity} /><circle cx={primitive.cx + offset} cy={primitive.cy} r={primitive.r} fill={primitive.fill} opacity={primitive.opacity} /></g>;
  }
  return <circle key={index} cx={primitive.cx + offset} cy={primitive.cy} r={primitive.r} fill={primitive.fill} opacity={primitive.opacity} className="network-regular-node" />;
}

export const DecorationBackground: React.FC<DecorationBackgroundProps> = ({
  generator,
  intensity = 1,
  params = {},
  className = '',
  testId,
  index,
  count,
  width,
  height,
  tokens,
}) => {
  const safeCount = Math.max(1, count);
  const primitives = useMemo(() => generateDecoration(generator, {
    tileIndex: index,
    tileCount: safeCount,
    tileWidth: width,
    height,
    seed: 7,
    params,
    palette: tokens,
    intensity,
  }), [generator, index, safeCount, width, height, params, tokens, intensity]);
  const offset = index * width;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`${offset} 0 ${width} ${height}`}
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'block', width: '100%', height: '100%' }}
      data-testid={testId}
      data-slide-index={index}
      data-slide-count={safeCount}
      aria-hidden="true"
    >
      {primitives.map((primitive, primitiveIndex) => renderPrimitive(primitive, primitiveIndex, offset, tokens.acc2))}
    </svg>
  );
};
