import type { Slide, AspectClass, TextDir, BrandSettings, TemplateId } from '../core/schema';
import type { Palette } from '../core/palette';

export interface SlideProps {
  slide: Omit<Slide, 'fields'> & { fields: Record<string, string> };
  palette: Palette;
  aspectClass: AspectClass;
  textDir?: TextDir;
  isStory?: boolean;
  className?: string;
  brand?: BrandSettings;
  slideIndex?: number;
  totalSlides?: number;
  showCounter?: boolean;
  showSafeZones?: boolean;
  templateId?: TemplateId;
  dimensions?: { width: number; height: number };
}

export type SchemaSlide = Slide;
