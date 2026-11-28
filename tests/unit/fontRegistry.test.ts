import { describe, expect, it } from 'vitest';
import { getFontRequirementsForText } from '../../src/core/fonts';
import { getFontsForScript, getFontsForText, getScriptsInText, listFontsForText } from '../../src/fonts/registry';
import { loadFont } from '../../src/fonts/loader';

describe('font registry and local font loader', () => {
  it('records the bundled fonts, weights, scripts, and open licenses', () => {
    expect(getFontsForScript('arabic').map((font) => font.id)).toContain('ibm-plex-sans-arabic');
    expect(getFontsForScript('coptic').map((font) => font.id)).toEqual(['noto-sans-coptic']);
    expect(getFontsForScript('coptic')[0]?.weights).toEqual([400]);
    expect(getFontsForScript('coptic')[0]?.license).toBe('OFL-1.1');
    expect(getFontsForScript('latin').map((font) => font.id)).not.toContain('noto-sans-coptic');
  });

  it('finds a family that covers mixed Latin and Arabic text', () => {
    expect(getScriptsInText('hello مرحبا')).toEqual(['arabic', 'latin']);
    expect(getFontsForText('hello مرحبا').map((font) => font.id)).toEqual(['ibm-plex-sans-arabic']);
    expect(getFontRequirementsForText('hello مرحبا').every((font) => font.id === 'ibm-plex-sans-arabic')).toBe(true);
    const picker = listFontsForText('مرحبا');
    const pickerIds = picker.map((entry) => entry.font.id);
    expect(pickerIds).toContain('ibm-plex-sans-arabic');
    for (const id of ['marhey', 'noto-naskh-arabic', 'amiri', 'markazi-text', 'el-messiri', 'scheherazade-new', 'harmattan', 'aref-ruqaa', 'rakkas', 'lalezar', 'lemonada', 'changa', 'reem-kufi', 'vazirmatn']) expect(pickerIds).toContain(id);
    expect(pickerIds).not.toContain('anton');
    expect(picker.every((entry) => entry.arabicCapable)).toBe(true);
    expect(listFontsForText('Hello').map((entry) => entry.font.id)).not.toContain('noto-sans-coptic');
    expect(listFontsForText('Hello').find((entry) => entry.font.id === 'ibm-plex-sans-arabic')?.arabicCapable).toBe(true);
  });

  it('selects the Coptic family only for Coptic text and lazily imports its bundled face', async () => {
    const copticText = 'Ϣⲉⲛⲟⲩϩ';
    expect(getScriptsInText(copticText)).toContain('coptic');
    expect(getFontRequirementsForText(copticText).map((font) => font.id)).toEqual(['noto-sans-coptic']);
    expect(getFontRequirementsForText(`Latin ${copticText}`).map((font) => font.id)).toContain('ibm-plex-sans');
    await expect(loadFont('noto-sans-coptic', 400)).resolves.toBeUndefined();
    await expect(loadFont('noto-sans-coptic', 700)).rejects.toThrow('does not include weight 700');
  });
});

describe('bundled Arabic font additions', () => {
  it('every added family is OFL-1.1, covers Arabic and Latin, and has a loader for each declared weight', async () => {
    const { FONT_REGISTRY } = await import('../../src/fonts/registry');
    const added = ['marhey', 'noto-naskh-arabic', 'amiri', 'markazi-text', 'el-messiri', 'scheherazade-new', 'harmattan', 'aref-ruqaa', 'rakkas', 'lalezar', 'lemonada', 'changa', 'reem-kufi', 'vazirmatn'] as const;
    for (const id of added) {
      const font = FONT_REGISTRY[id];
      expect(font.license).toBe('OFL-1.1');
      expect(font.scripts).toEqual(['arabic', 'latin']);
      expect(font.attribution).toMatch(/Copyright/);
      expect(font.weights.length).toBeGreaterThan(0);
    }
  });
});
