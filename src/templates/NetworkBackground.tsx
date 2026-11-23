import React from 'react';
import type { TemplateBackgroundProps } from './types';
import { DecorationBackground } from './DecorationBackground';

export const NetworkBackground: React.FC<TemplateBackgroundProps> = ({
  index,
  count,
  width,
  height,
  tokens,
}) => {
  return (
    <DecorationBackground
      {...{ index, count, width, height, tokens }}
      generator="mesh"
      intensity={0.85}
      params={{ nodesPerTile: 9 }}
      className="network-template-bg"
      testId="network-bg-svg"
    />
  );
};
