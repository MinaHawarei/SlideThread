import type { Palette } from '../core/palette';
import type { TemplateId } from '../core/schema';

export interface TemplateBackgroundProps {
  index: number;
  count: number;
  width: number;
  height: number;
  tokens: Palette;
}

export interface TemplateDef {
  id: TemplateId;
  nameKey: string;
  fonts: { display: string; body: string; mono: string };
  typeScale: Record<'h1' | 'h2' | 'body' | 'small' | 'mono', number>; // px at 1080 short side
  radius: { card: number; chip: number };
  Background: React.FC<TemplateBackgroundProps>;
}
