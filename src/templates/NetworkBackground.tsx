import React, { useMemo } from 'react';
import type { TemplateBackgroundProps } from './types';
import { generateCarouselNetwork, type NetworkGraph } from '../core/network';

// In-memory cache for generated carousel network graphs
const networkCache = new Map<string, NetworkGraph>();

export const NetworkBackground: React.FC<TemplateBackgroundProps> = ({
  index,
  count,
  width,
  height,
  tokens,
}) => {
  const safeCount = Math.max(1, count);
  const cacheKey = `${width}_${height}_${safeCount}_7`;

  const graph = useMemo(() => {
    let cached = networkCache.get(cacheKey);
    if (!cached) {
      cached = generateCarouselNetwork(width, height, safeCount, 7);
      networkCache.set(cacheKey, cached);
    }
    return cached;
  }, [width, height, safeCount, cacheKey]);

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`${index * width} 0 ${width} ${height}`}
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      className="network-template-bg"
      style={{ display: 'block', width: '100%', height: '100%' }}
      data-testid="network-bg-svg"
      data-slide-index={index}
      data-slide-count={safeCount}
    >
      {/* Network Lines */}
      {graph.lines.map((l, idx) => (
        <line
          key={`l-${idx}`}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke={tokens.line}
          strokeWidth="2.5"
        />
      ))}

      {/* Network Nodes */}
      {graph.nodes.map((n, idx) =>
        n.isAccent ? (
          <g key={`n-${idx}`} className="network-accent-node">
            <circle
              cx={n.x}
              cy={n.y}
              r="10"
              fill="none"
              stroke={tokens.acc2}
              strokeWidth="2.5"
            />
            <circle cx={n.x} cy={n.y} r="4" fill={tokens.acc2} />
          </g>
        ) : (
          <circle
            key={`n-${idx}`}
            cx={n.x}
            cy={n.y}
            r="4"
            fill={tokens.acc}
            fillOpacity="0.5"
            className="network-regular-node"
          />
        )
      )}
    </svg>
  );
};
