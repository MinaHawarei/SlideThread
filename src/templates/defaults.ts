import type { ThemeMode, CounterConfig, SignatureConfig } from '../core/schema';
import { DEFAULT_COUNTER_CONFIG, DEFAULT_SIGNATURE_CONFIG } from '../core/schema';
import { TEMPLATE_GALLERY_INDEX } from '../gallery/data';

/** Accent used when a template does not carry its own. Color-fixed templates ignore it. */
export const FALLBACK_PRIMARY_COLOR = '#35D0E6';

export interface TemplateDefaults {
  theme: ThemeMode;
  primaryColor: string;
  counter: CounterConfig;
  signature: SignatureConfig;
}

/**
 * The design owns its defaults. A user's settings never decide a template's theme, accent, counter or signature,
 * so choosing a template always gives the same starting point.
 * `modes` is the list of theme modes the template supports (gallery index or imported package manifest).
 */
export function getTemplateDefaultsFromModes(
  modes: readonly string[] | undefined,
  counterDefaultStyle?: CounterConfig['style'],
): TemplateDefaults {
  const theme: ThemeMode = !modes || modes.length === 0 || modes.includes('dark') ? 'dark' : 'light';
  return {
    theme,
    primaryColor: FALLBACK_PRIMARY_COLOR,
    counter: { ...DEFAULT_COUNTER_CONFIG, ...(counterDefaultStyle ? { style: counterDefaultStyle } : {}) },
    signature: { ...DEFAULT_SIGNATURE_CONFIG },
  };
}

export function getTemplateDefaults(templateId: string, importedModes?: readonly string[]): TemplateDefaults {
  const entry = TEMPLATE_GALLERY_INDEX.templates.find((template) => template.id === templateId);
  return getTemplateDefaultsFromModes(entry?.modes ?? importedModes);
}
