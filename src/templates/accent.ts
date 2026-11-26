import { generatePalette } from '../core/palette';
import type { TemplateProjectSnapshot, ThemeMode } from '../core/schema';
import { templatePackageRuntime } from './starters';
import { loadTemplateProjectSnapshot } from './projectSnapshot';

const MODES: ThemeMode[] = ['dark', 'light'];

/**
 * Recolors a project's template with the user's chosen main color, the same way for every template.
 * - Color-flexible templates: the palette is regenerated from the color (as at creation).
 * - Fixed-palette templates (including built-in and imported packs): the color replaces the accent
 *   (and its readable on-accent text color); every other palette entry stays as the template defines it.
 * Everything drawn with the accent (stat values, bars, pills, and hand-built text that uses the "acc" token) follows.
 */
export async function recolorTemplateSnapshot(
  templateId: string,
  current: TemplateProjectSnapshot | undefined,
  primaryColor: string,
): Promise<TemplateProjectSnapshot> {
  const fresh = await loadTemplateProjectSnapshot(templateId, primaryColor);
  const base = current ?? fresh;
  const template = await templatePackageRuntime.load(templateId);
  const paletteByMode = { ...(current && !template.colorFlexible ? current.paletteByMode : fresh.paletteByMode) } as Record<ThemeMode, Record<string, string>>;
  if (!template.colorFlexible) {
    for (const mode of MODES) {
      const generated = generatePalette(primaryColor, mode);
      paletteByMode[mode] = { ...(paletteByMode[mode] ?? fresh.paletteByMode[mode]), acc: primaryColor, onAcc: generated.onAcc };
    }
  }
  return { ...base, paletteByMode };
}

/** The accent the user currently sees for a project: the snapshot palette when present, else the stored primary color. */
export function currentAccent(snapshot: TemplateProjectSnapshot | undefined, mode: ThemeMode, primaryColor: string): string {
  return snapshot?.paletteByMode?.[mode]?.acc ?? primaryColor;
}
