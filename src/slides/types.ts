import type { Slide, AspectClass, TextDir, BrandSettings } from '../core/schema';
import type { Palette } from '../core/palette';

export interface SlideProps {
  slide: Slide;
  palette: Palette;
  aspectClass: AspectClass;
  textDir?: TextDir;
  isStory?: boolean;
  className?: string;
  brand?: BrandSettings;
  slideIndex?: number;
  totalSlides?: number;
  showCounter?: boolean;
}
