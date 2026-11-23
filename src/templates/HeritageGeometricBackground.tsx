import React from 'react';
import type { TemplateBackgroundProps } from './types';
import { DecorationBackground } from './DecorationBackground';

export const HeritageGeometricBackground: React.FC<TemplateBackgroundProps> = (props) => (
  <DecorationBackground {...props} generator="geometric" intensity={0.42} params={{ rows: 4, columns: 5 }} className="heritage-geometric-bg" testId="heritage-geometric-bg" />
);
