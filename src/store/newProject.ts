import type { ContentType, Orientation, PlatformId, Project, Slide } from '../core/schema';
import { CURRENT_SCHEMA_VERSION, plainTextFieldsToRichText } from '../core/schema';
import { aspectClass as calcAspectClass, getDimensions } from '../core/formats';
import { loadTemplateProjectSnapshot } from '../templates/projectSnapshot';
import { getTemplateDefaults } from '../templates/defaults';
import { createDefaultSlide } from './projectStore';

/** Sample text for a blank project: no tag, code line or tech wording. */
function blankSlide(slide: Slide, index: number): Slide {
  if (slide.type === 'cover') return { ...slide, fields: plainTextFieldsToRichText({ tag: '', title: 'Title', sub: '', rule: '' }) };
  return { ...slide, fields: plainTextFieldsToRichText({ title: `Slide ${index + 1}`, body: '' }) };
}

export interface NewProjectOptions {
  templateId: string;
  platform: PlatformId;
  contentType: ContentType;
  formatId: string;
  orientation: Orientation;
  textDir: 'ltr' | 'rtl';
  /** Theme modes of an imported template package, when the template is not a built-in. */
  importedModes?: readonly string[];
  /** A blank project: neutral light theme and no template sample content. */
  blank?: boolean;
}

/**
 * Builds a new project. Theme, accent, counter and signature come from the template, never from user settings,
 * so a user's settings can not change what a chosen design looks like.
 */
export async function buildNewProject(options: NewProjectOptions): Promise<Project> {
  const { templateId, platform, contentType, formatId, orientation, textDir } = options;
  const defaults = getTemplateDefaults(templateId, options.importedModes);
  const title = contentType === 'post' ? 'Untitled Post' : contentType === 'story' ? 'Untitled Story' : 'Untitled Carousel';
  let slides: Slide[] = contentType === 'post'
    ? [createDefaultSlide('cover', 0)]
    : [createDefaultSlide('cover', 0), createDefaultSlide('explain', 1)];

  if (options.blank) slides = slides.map(blankSlide);
  const templateSnapshot = await loadTemplateProjectSnapshot(templateId, defaults.primaryColor);
  const dimensions = getDimensions(formatId, orientation);
  const aspect = calcAspectClass(dimensions.width, dimensions.height);
  slides = slides.map((slide) => ({
    ...slide,
    extras: (templateSnapshot.composition[slide.type]?.[aspect]?.elements ?? []).map((element) => structuredClone(element)),
  }));

  const counterStyles = templateSnapshot.counter;
  const counterStyle = counterStyles && !counterStyles.styles.includes(defaults.counter.style) ? counterStyles.defaultStyle : defaults.counter.style;

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title,
    platform,
    contentType,
    formatId,
    orientation,
    templateId,
    templateSnapshot,
    primaryColor: defaults.primaryColor,
    theme: options.blank ? 'light' : defaults.theme,
    textDir,
    slides,
    counter: { ...defaults.counter, style: counterStyle, show: contentType === 'carousel' },
    signature: { ...defaults.signature },
    pattern: { enabled: templateId === 'tech-mesh', intensity: 1 },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
