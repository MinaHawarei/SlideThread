import React, { useState } from 'react';
import { STARTER_TEMPLATE_IDS, STARTER_TEMPLATE_LOADERS } from '../templates/starters';
import { resolveTemplatePalette, type ValidatedTemplateData } from '../templates/schema';
import { loadFont } from '../fonts/loader';
import { FONT_REGISTRY, type FontId } from '../fonts/registry';
import { buildManifest, buildTemplateZip, uniqueTemplateId, validateBuilderInput, type TemplateBuilderInput } from '../templates/builder';
import { getTemplateDefaults } from '../templates/defaults';
import { importTemplateZip } from '../templates/importZip';
import { listUserTemplatePackages } from '../templates/userLibrary';

interface Props {
  onClose: () => void;
  onCreated: (name: string) => void;
}

const FONT_IDS = Object.keys(FONT_REGISTRY) as FontId[];

/** Preview drawn from the real resolved palette of the base template, the chosen heading font and the card radius. */
async function drawPreview(form: TemplateBuilderInput): Promise<Blob | undefined> {
  try {
    // A project made from a template starts with the template's own theme and accent, not the app's, so draw that.
    const { theme: mode, primaryColor: accent } = getTemplateDefaults(form.baseId);
    const loader = STARTER_TEMPLATE_LOADERS[form.baseId];
    if (!loader) return undefined;
    const base = (await loader()) as ValidatedTemplateData;
    const palette = resolveTemplatePalette(base, mode, accent);
    const font = FONT_REGISTRY[form.displayFont];
    const title = form.nameEn.trim().slice(0, 24);
    await loadFont(form.displayFont, 700).catch(() => undefined);
    // Make sure the face is really usable on the canvas before drawing, otherwise the browser draws a fallback font.
    await document.fonts.load(`700 34px "${font.family}"`, title).catch(() => undefined);
    const canvas = document.createElement('canvas');
    canvas.width = 320; canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    const gradient = ctx.createLinearGradient(0, 0, 320, 400);
    gradient.addColorStop(0, palette.bg); gradient.addColorStop(1, palette.bg2);
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 320, 400);
    const r = Math.min(form.cardRadius, 60) * (320 / 1080) * 3;
    ctx.fillStyle = palette.card;
    ctx.beginPath(); ctx.roundRect(24, 250, 272, 90, Math.min(r, 45)); ctx.fill();
    ctx.fillStyle = palette.acc; ctx.beginPath(); ctx.roundRect(24, 48, 84, 22, 11); ctx.fill();
    ctx.fillStyle = palette.ink; ctx.textBaseline = 'alphabetic';
    let size = 34;
    ctx.font = `700 ${size}px "${font.family}", sans-serif`;
    while (size > 14 && ctx.measureText(title).width > 272) { size -= 2; ctx.font = `700 ${size}px "${font.family}", sans-serif`; }
    ctx.fillText(title, 24, 130);
    ctx.font = `700 ${size}px "${font.family}", sans-serif`;
    ctx.fillText('Title', 24, 130 + size * 1.25);
    ctx.fillStyle = palette.mute; ctx.fillRect(24, 196, 220, 8); ctx.fillRect(24, 214, 170, 8);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.7));
    return blob && blob.type === 'image/webp' && blob.size < 38 * 1024 ? blob : undefined;
  } catch { return undefined; }
}

export const TemplateBuilderDialog: React.FC<Props> = ({ onClose, onCreated }) => {
  const [form, setForm] = useState<TemplateBuilderInput>({
    nameEn: '', nameAr: '', baseId: STARTER_TEMPLATE_IDS[0] ?? 'clean-minimal',
    displayFont: 'ibm-plex-sans', bodyFont: 'ibm-plex-sans-arabic', cardRadius: 24, chipRadius: 9999, authorName: '',
  });
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof TemplateBuilderInput>(key: K, value: TemplateBuilderInput[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(undefined);
    const problem = validateBuilderInput(form);
    if (problem) { setError(problem); return; }
    setBusy(true);
    try {
      const existing = await listUserTemplatePackages();
      const id = uniqueTemplateId(form.nameEn, existing.map((item) => item.id));
      const manifest = buildManifest(form, id);
      const preview = await drawPreview(form);
      const zip = await buildTemplateZip(manifest, preview);
      // The same import path as a hand-made ZIP: size limits, schema, contrast and full runtime resolution.
      await importTemplateZip(zip);
      onCreated(form.nameEn.trim());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setBusy(false);
    }
  };

  const field = 'w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 p-2 text-sm';
  return (
    <div role="dialog" aria-modal="true" aria-label="Template builder" data-testid="template-builder" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form onSubmit={(event) => void submit(event)} className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-stone-900 p-6 space-y-4 shadow-xl">
        <h3 className="text-lg font-bold">Create a template</h3>
        <p className="text-xs text-stone-500">Start from a shipped template and change its fonts and corner radius. Colors, background, layouts and element positions stay as the base template defines them. It is checked like an imported package and saved to Your templates.</p>
        <label className="block text-xs font-semibold">Name (English)
          <input data-testid="builder-name-en" className={field} value={form.nameEn} onChange={(e) => set('nameEn', e.target.value)} maxLength={60} />
        </label>
        <label className="block text-xs font-semibold">Name (Arabic, optional)
          <input data-testid="builder-name-ar" dir="rtl" className={field} value={form.nameAr} onChange={(e) => set('nameAr', e.target.value)} maxLength={60} />
        </label>
        <label className="block text-xs font-semibold">Base template
          <select data-testid="builder-base" className={field} value={form.baseId} onChange={(e) => set('baseId', e.target.value)}>
            {STARTER_TEMPLATE_IDS.map((id) => <option key={id} value={id}>{id}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-xs font-semibold">Heading font
            <select data-testid="builder-font-display" className={field} value={form.displayFont} onChange={(e) => set('displayFont', e.target.value as FontId)}>
              {FONT_IDS.map((id) => <option key={id} value={id}>{FONT_REGISTRY[id].family}</option>)}
            </select>
          </label>
          <label className="block text-xs font-semibold">Body font
            <select data-testid="builder-font-body" className={field} value={form.bodyFont} onChange={(e) => set('bodyFont', e.target.value as FontId)}>
              {FONT_IDS.map((id) => <option key={id} value={id}>{FONT_REGISTRY[id].family}</option>)}
            </select>
          </label>
        </div>
        <label className="block text-xs font-semibold">Card corner radius <span className="font-mono">{form.cardRadius}px</span>
          <input data-testid="builder-radius" type="range" min={0} max={120} value={form.cardRadius} onChange={(e) => set('cardRadius', Number(e.target.value))} className="w-full accent-amber-600" />
        </label>
        {error && <p role="alert" data-testid="builder-error" className="rounded-lg border border-red-300 bg-red-50 p-2 text-xs text-red-800">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" data-testid="builder-cancel" onClick={onClose} className="px-3 py-2 text-xs rounded-lg border">Cancel</button>
          <button type="submit" data-testid="builder-create" disabled={busy} className="px-4 py-2 text-xs font-bold rounded-lg bg-amber-600 text-white disabled:opacity-50">{busy ? 'Checking…' : 'Create template'}</button>
        </div>
      </form>
    </div>
  );
};
