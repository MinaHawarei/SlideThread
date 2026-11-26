import React, { useMemo, useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { getDimensions, aspectClass as calcAspectClass } from '../../core/formats';
import { previewDesignCapture } from '../../templates/saveDesign';
import { saveProjectDesignAsTemplate } from '../../templates/saveDesign';

const REASONS: Record<string, string> = {
  image: 'photo or media element (cannot be packaged)',
  asset: 'element that uses an uploaded or bundled asset (cannot be packaged)',
  kind: 'icon or sticker (templates only carry text and shapes)',
  invalid: 'element that failed validation',
};

export const SaveDesignDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const project = useProjectStore((s) => s.project);
  const dims = getDimensions(project.formatId, project.orientation);
  const aspect = calcAspectClass(dims.width, dims.height);
  const [name, setName] = useState('');
  const [chosen, setChosen] = useState<Record<string, number>>({});
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<string>();
  const report = useMemo(() => previewDesignCapture(project, aspect, chosen), [project, aspect, chosen]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(undefined); setBusy(true);
    try { await saveProjectDesignAsTemplate(project, aspect, name, chosen); setSaved(name.trim()); }
    catch (reason) { setError(reason instanceof Error ? reason.message : String(reason)); }
    finally { setBusy(false); }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Save design as template" data-testid="save-design-dialog" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form onSubmit={(e) => void submit(e)} className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-stone-900 p-6 space-y-3 shadow-xl text-stone-900 dark:text-stone-100">
        <h3 className="text-lg font-bold">Save this design as a template</h3>
        {saved ? (
          <>
            <p data-testid="save-design-done" className="text-sm">Saved “{saved}” to Your templates. Pick it in the gallery to start a new project with this design.</p>
            <div className="flex justify-end"><button type="button" data-testid="save-design-close" onClick={onClose} className="px-3 py-2 text-xs rounded-lg border">Close</button></div>
          </>
        ) : (
          <>
            <p className="text-xs text-stone-500">Saves layout positions, hidden parts, shapes and text boxes for the <b data-testid="save-design-aspect">{aspect}</b> shape only, on top of the project's base template. Your slide text is not copied, except text boxes you added.</p>
            <label className="block text-xs font-semibold">Template name
              <input data-testid="save-design-name" className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 p-2 text-sm" value={name} onChange={(e) => { setName(e.target.value); setError(undefined); }} maxLength={60} />
            </label>
            <ul data-testid="save-design-types" className="text-xs space-y-1">
              {report.types.map((item) => (
                <li key={item.type} data-testid={`save-design-type-${item.type}`} className="flex items-center justify-between gap-2">
                  <span><b>{item.type}</b>: design taken from slide {item.used}</span>
                  {item.candidates.length > 1 && (
                    <label className="flex items-center gap-1">use slide
                      <select data-testid={`save-design-pick-${item.type}`} value={item.used} onChange={(e) => setChosen((prev) => ({ ...prev, [item.type]: Number(e.target.value) }))} className="rounded border p-1 bg-white dark:bg-stone-900">
                        {item.candidates.map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </label>
                  )}
                </li>
              ))}
            </ul>
            {report.types.some((t) => t.candidates.length > 1) && (
              <p data-testid="save-design-repeats" className="text-xs text-stone-500">A template keeps one design per slide type. Other slides of the same type are not captured.</p>
            )}
            <p className="text-xs">Captured: {report.capturedSlotCount} moved or resized parts, {report.capturedElementCount} added elements{report.bundledAssets.length > 0 ? ` (${report.bundledAssets.length} built-in shape${report.bundledAssets.length > 1 ? 's' : ''} bundled into the template)` : ''}.</p>
            {report.skipped.length > 0 && (
              <div data-testid="save-design-skipped" className="rounded-lg border border-amber-300 bg-amber-50 text-amber-900 p-2 text-xs space-y-1">
                <p className="font-semibold">Not included ({report.skipped.length}):</p>
                <ul className="list-disc ps-4">
                  {report.skipped.map((s) => <li key={`${s.slideNumber}-${s.id}`}>Slide {s.slideNumber} ({s.slideType}): {REASONS[s.reason]}</li>)}
                </ul>
              </div>
            )}
            {error && <p role="alert" data-testid="save-design-error" className="rounded-lg border border-red-300 bg-red-50 p-2 text-xs text-red-800">{error}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" data-testid="save-design-cancel" onClick={onClose} className="px-3 py-2 text-xs rounded-lg border">Cancel</button>
              <button type="submit" data-testid="save-design-submit" disabled={busy} className="px-4 py-2 text-xs font-bold rounded-lg bg-amber-600 text-white disabled:opacity-50">{busy ? 'Saving…' : 'Save template'}</button>
            </div>
          </>
        )}
      </form>
    </div>
  );
};
