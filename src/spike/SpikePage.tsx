import React, { useState } from 'react';
import { TestSlide } from './TestSlide';
import { SPIKE_FORMATS } from './types';

export const SpikePage: React.FC = () => {
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [scale, setScale] = useState<number>(0.35);

  const displayedFormats =
    selectedFormat === 'all'
      ? SPIKE_FORMATS
      : SPIKE_FORMATS.filter((f) => f.id === selectedFormat);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 flex flex-col gap-6">
      <header className="border-b border-slate-700 pb-4 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SlideThread — Phase 0 Export Spike</h1>
          <p className="text-sm text-slate-400">
            Fidelity verification matrix: Arabic ligatures &amp; diacritics, SVG network, code blocks, gradients &amp; shadows.
          </p>
        </div>

        <div className="flex items-center gap-4">
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
          visibility: 'hidden',
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
