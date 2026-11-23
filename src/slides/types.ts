import type {
  Slide,
  AspectClass,
  TextDir,
  BrandSettings,
  TemplateId,
  ThemeMode,
  RichText,
  CounterConfig,
  SignatureConfig,
} from '../core/schema';
import type { Palette } from '../core/palette';

export interface SlideProps {
  slide: Omit<Slide, 'fields'> & {
    fields: Record<string, string>;
    richFields?: Record<string, RichText>;
  };
  palette: Palette;
  aspectClass: AspectClass;
  textDir?: TextDir;
  isStory?: boolean;
  className?: string;
  brand?: BrandSettings;
  slideIndex?: number;
  totalSlides?: number;
  showCounter?: boolean;
  counterConfig?: CounterConfig;
  signatureConfig?: SignatureConfig;
  showSafeZones?: boolean;
  templateId?: TemplateId;
  themeMode?: ThemeMode;
  dimensions?: { width: number; height: number };
}

export type SchemaSlide = Slide;
