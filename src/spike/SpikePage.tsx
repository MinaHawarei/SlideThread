import React, { useState } from 'react';
import { TestSlide } from './TestSlide';
import { SPIKE_FORMATS } from './types';
import { capture, CaptureLibrary } from '../export/capture';
import { createPdfFromPngs } from '../export/pdf';
import { createZipFromPngs } from '../export/zip';

interface CaptureResult {
  library: CaptureLibrary;
  formatId: string;
  durationMs: number;
  dataUrl: string;
}

export const SpikePage: React.FC = () => {
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [scale, setScale] = useState<number>(0.35);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<CaptureResult | null>(null);
  const [exportUrl, setExportUrl] = useState<{ url: string; name: string } | null>(null);
  const [captureLog, setCaptureLog] = useState<string[]>([]);

  const displayedFormats =
    selectedFormat === 'all'
      ? SPIKE_FORMATS
      : SPIKE_FORMATS.filter((f) => f.id === selectedFormat);

  const handleCapture = async (library: CaptureLibrary) => {
    setIsCapturing(true);
    const targetFormat = displayedFormats[0] || SPIKE_FORMATS[0]!;
    const elementId = `stage-slide-${targetFormat.width}x${targetFormat.height}`;
    const element = document.getElementById(elementId);

    if (!element) {
      setCaptureLog((prev) => [...prev, `[Error] Element #${elementId} not found`]);
      setIsCapturing(false);
      return;
    }

    try {
      const startTime = performance.now();
      const dataUrl = await capture(element, {
        library,
        dimensions: { width: targetFormat.width, height: targetFormat.height },
        warmUp: true,
      });
      const durationMs = Math.round(performance.now() - startTime);

      setLastResult({ library, formatId: targetFormat.id, durationMs, dataUrl });
      setCaptureLog((prev) => [
        ...prev,
        `[${library}] Captured ${targetFormat.name} (${targetFormat.width}×${targetFormat.height}) in ${durationMs}ms`,
      ]);
    } catch (err) {
      setCaptureLog((prev) => [
        ...prev,
        `[${library}] Error capturing: ${err instanceof Error ? err.message : String(err)}`,
      ]);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleExportPdf = async () => {
    setIsCapturing(true);
    try {
      const slidePngs = [];
      for (const fmt of displayedFormats) {
        const el = document.getElementById(`stage-slide-${fmt.width}x${fmt.height}`);
        if (!el) continue;
        const dataUrl = await capture(el, {
          library: 'html-to-image',
          dimensions: { width: fmt.width, height: fmt.height },
          warmUp: false,
        });
        slidePngs.push({ dataUrl, width: fmt.width, height: fmt.height });
      }

      const pdfBlob = await createPdfFromPngs(slidePngs, 'slidethread-spike');
      const url = URL.createObjectURL(pdfBlob);
      setExportUrl({ url, name: 'slidethread-spike.pdf' });
      setCaptureLog((prev) => [
        ...prev,
        `[PDF] Successfully generated PDF (${Math.round(pdfBlob.size / 1024)} KB) with ${slidePngs.length} page(s)`,
      ]);
    } catch (err) {
      setCaptureLog((prev) => [
        ...prev,
        `[PDF Error] ${err instanceof Error ? err.message : String(err)}`,
      ]);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleExportZip = async () => {
    setIsCapturing(true);
    try {
      const zipEntries = [];
      for (const fmt of displayedFormats) {
        const el = document.getElementById(`stage-slide-${fmt.width}x${fmt.height}`);
        if (!el) continue;
        const dataUrl = await capture(el, {
          library: 'html-to-image',
          dimensions: { width: fmt.width, height: fmt.height },
          warmUp: false,
        });
        zipEntries.push({ dataUrl, filename: `slide-${fmt.width}x${fmt.height}.png` });
      }

      const zipBlob = await createZipFromPngs(zipEntries, 'slidethread-spike');
      const url = URL.createObjectURL(zipBlob);
      setExportUrl({ url, name: 'slidethread-spike.zip' });
      setCaptureLog((prev) => [
        ...prev,
        `[ZIP] Successfully generated ZIP archive (${Math.round(zipBlob.size / 1024)} KB) with ${zipEntries.length} file(s)`,
      ]);
    } catch (err) {
      setCaptureLog((prev) => [
        ...prev,
        `[ZIP Error] ${err instanceof Error ? err.message : String(err)}`,
      ]);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 flex flex-col gap-6">
      <header className="border-b border-slate-700 pb-4 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SlideThread — Phase 0 Export Spike</h1>
          <p className="text-sm text-slate-400">
            Fidelity verification matrix: Arabic ligatures &amp; diacritics, SVG network, code blocks, gradients &amp; shadows.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            data-testid="btn-capture-html-to-image"
            disabled={isCapturing}
            onClick={() => handleCapture('html-to-image')}
            className="bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-medium px-3 py-1.5 rounded text-sm transition"
          >
            {isCapturing ? 'Capturing...' : 'Capture (html-to-image)'}
          </button>

          <button
            data-testid="btn-capture-modern-screenshot"
            disabled={isCapturing}
            onClick={() => handleCapture('modern-screenshot')}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium px-3 py-1.5 rounded text-sm transition"
          >
            {isCapturing ? 'Capturing...' : 'Capture (modern-screenshot)'}
          </button>

          <button
            data-testid="btn-export-pdf"
            disabled={isCapturing}
            onClick={handleExportPdf}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium px-3 py-1.5 rounded text-sm transition"
          >
            Export PDF
          </button>

          <button
            data-testid="btn-export-zip"
            disabled={isCapturing}
            onClick={handleExportZip}
            className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-medium px-3 py-1.5 rounded text-sm transition"
          >
            Export ZIP
          </button>

          <div className="h-6 w-px bg-slate-700 mx-1" />

          <label className="text-sm font-medium">Format:</label>
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm"
          >
            <option value="all">All Formats</option>
            {SPIKE_FORMATS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.width}×{f.height})
              </option>
            ))}
          </select>

          <label className="text-sm font-medium">Zoom:</label>
          <input
            type="range"
            min="0.2"
            max="1"
            step="0.05"
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            className="w-24 accent-sky-400"
          />
          <span className="text-xs text-slate-400 w-10">{Math.round(scale * 100)}%</span>
        </div>
      </header>

      {/* Capture status and log bar */}
      {captureLog.length > 0 && (
        <section className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Capture Diagnostics &amp; Log
            </span>
            <div className="flex items-center gap-3">
              {lastResult && (
                <span data-testid="capture-status" className="text-xs text-emerald-400 font-mono">
                  Last: {lastResult.library} in {lastResult.durationMs}ms
                </span>
              )}
              {exportUrl && (
                <a
                  data-testid="download-export-link"
                  href={exportUrl.url}
                  download={exportUrl.name}
                  className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded"
                >
                  Download {exportUrl.name}
                </a>
              )}
            </div>
          </div>
          <div className="font-mono text-xs text-slate-300 max-h-24 overflow-y-auto space-y-1">
            {captureLog.slice(-4).map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>
          {lastResult && (
            <div className="mt-2 pt-2 border-t border-slate-800 flex items-center gap-4">
              <span className="text-xs text-slate-400">Captured Output:</span>
              <img
                data-testid="captured-image-preview"
                src={lastResult.dataUrl}
                alt="Captured Output"
                className="h-16 w-auto border border-slate-700 rounded shadow"
              />
            </div>
          )}
        </section>
      )}

      <main className="flex-1 flex flex-wrap gap-8 justify-center items-start overflow-auto py-4">
        {displayedFormats.map((format) => (
          <div
            key={format.id}
            className="flex flex-col gap-2 items-center bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-xl"
          >
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {format.name} — {format.width}×{format.height}
            </div>

            <TestSlide
              id={`spike-slide-${format.width}x${format.height}`}
              width={format.width}
              height={format.height}
              scale={scale}
            />
          </div>
        ))}
      </main>

      {/* Hidden 1:1 offscreen container for capture evaluation */}
      <div
        id="spike-offscreen-stage"
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          pointerEvents: 'none',
        }}
      >
        {SPIKE_FORMATS.map((f) => (
          <TestSlide
            key={`offscreen-${f.id}`}
            id={`stage-slide-${f.width}x${f.height}`}
            width={f.width}
            height={f.height}
            scale={1}
          />
        ))}
      </div>
    </div>
  );
};

export default SpikePage;
