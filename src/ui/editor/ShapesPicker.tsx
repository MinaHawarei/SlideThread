import React, { useState } from 'react';
import { useT } from '../../i18n';
import { useProjectStore, useActiveSlide } from '../../store/projectStore';
import { useSelectionStore } from '../../store/selectionStore';
import { SHAPES_ITEMS, getShapeSvg } from '../../assets';
import type { ExtraElement } from '../../core/schema';
import { getDimensions } from '../../core/formats';
import { createDefaultPath } from '../../core/vectorPath';
import { SHAPE_PALETTE_COLORS } from './shapePalette';
import { ChevronDownIcon, ChevronUpIcon, RulerIcon, StarIcon } from '../common/icons';


export const ShapesPicker: React.FC = () => {
  const { t, locale } = useT();
  const project = useProjectStore((state) => state.project);
  const activeSlide = useActiveSlide();
  const addExtraElement = useProjectStore((state) => state.addExtraElement);
  const updateExtraElement = useProjectStore((state) => state.updateExtraElement);
  const deleteExtraElement = useProjectStore((state) => state.deleteExtraElement);
  const selectedElementId = useSelectionStore((state) => state.selectedElementId);
  const selectElement = useSelectionStore((state) => state.selectElement);

  const penMode = useSelectionStore((state) => state.penMode);
  const setPenMode = useSelectionStore((state) => state.setPenMode);
  const [isOpen, setIsOpen] = useState(true);

  if (!activeSlide) return null;

  // Check if a shape extra on this slide is selected
  const selectedExtra = activeSlide.extras?.find(
    (extra) => extra.id === selectedElementId && extra.kind === 'shape'
  );

  const handleAddShape = (shapeId: string) => {
    const item = SHAPES_ITEMS.find((i) => i.id === shapeId);
    if (!item) return;

    const baseWidth = item.defaultWidth ? Math.min(0.4, item.defaultWidth / 500) : 0.2;
    // Sizes are slide fractions: derive the height from the shape's own aspect so it is not stretched on a 4:5 slide.
    const dims = getDimensions(project.formatId, project.orientation);
    const itemAspect = item.defaultWidth && item.defaultHeight ? item.defaultWidth / item.defaultHeight : 1;
    const baseHeight = Math.min(0.9, (baseWidth * (dims.width / dims.height)) / itemAspect);

    const newExtra: ExtraElement = {
      id: `shape_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      kind: 'shape',
      assetId: item.id,
      x: Math.max(0.05, 0.5 - baseWidth / 2),
      y: Math.max(0.05, 0.5 - baseHeight / 2),
      w: baseWidth,
      h: baseHeight,
      rotation: 0,
      z: (activeSlide.extras?.length ?? 0) + 1,
      locked: false,
      fill: project.primaryColor || '#0891b2',
    };

    addExtraElement(activeSlide.id, newExtra);
    selectElement(newExtra.id);
  };

  const handleAddPath = () => {
    const newExtra: ExtraElement = {
      id: `path_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      kind: 'shape',
      shape: 'path',
      path: createDefaultPath(),
      x: 0.2, y: 0.35, w: 0.6, h: 0.3,
      rotation: 0,
      z: (activeSlide.extras?.length ?? 0) + 1,
      locked: false,
      fill: project.primaryColor || '#0891b2',
      strokeWidth: 6,
    };
    addExtraElement(activeSlide.id, newExtra);
    selectElement(newExtra.id);
  };

  const handleColorChange = (newColor: string) => {
    if (!selectedExtra) return;
    updateExtraElement(activeSlide.id, {
      ...selectedExtra,
      fill: newColor,
    });
  };

  const handleDeleteSelected = () => {
    if (!selectedExtra) return;
    deleteExtraElement(activeSlide.id, selectedExtra.id);
    selectElement();
  };

  return (
    <div data-testid="shapes-picker" className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <RulerIcon size={16} />
          <span>{t('assets.shapesTitle')}</span>
        </label>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          aria-expanded={isOpen}
        >
          {isOpen ? <ChevronUpIcon size={12} /> : <ChevronDownIcon size={12} />}
        </button>
      </div>

      <p className="text-[11px] text-slate-500 dark:text-slate-400">
        {t('assets.shapesDesc')}
      </p>

      {/* Selected Shape Color & Actions (Visible when a shape is selected) */}
      {selectedExtra && (
        <div
          data-testid="selected-shape-controls"
          className="p-3 bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 rounded-xl space-y-2.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-900 dark:text-cyan-300">
              {t('assets.selectedShape')}
            </span>
            <button
              type="button"
              data-testid="delete-shape-btn"
              onClick={handleDeleteSelected}
              className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
            >
              {t('assets.deleteShape')}
            </button>
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block">
              {t('assets.shapeColor')}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {SHAPE_PALETTE_COLORS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  data-testid={`shape-palette-color-${hex}`}
                  onClick={() => handleColorChange(hex)}
                  style={{ backgroundColor: hex }}
                  className={`w-6 h-6 rounded-md border transition-transform cursor-pointer ${
                    selectedExtra.fill === hex
                      ? 'scale-110 border-cyan-500 ring-2 ring-cyan-400/50'
                      : 'border-slate-300 dark:border-slate-700 hover:scale-105'
                  }`}
                  aria-label={hex}
                />
              ))}
              <input
                type="color"
                data-testid="shape-color-input"
                value={selectedExtra.fill?.startsWith('#') ? selectedExtra.fill : '#0891b2'}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-7 h-7 p-0 rounded-md border border-slate-300 dark:border-slate-700 cursor-pointer"
                title="Custom color"
              />
            </div>
          </div>
        </div>
      )}

      {/* Shapes Grid */}
      {isOpen && (
        <div className="grid grid-cols-4 gap-2 pt-1" data-testid="shapes-grid">
          <button type="button" data-testid="pen-tool" aria-pressed={penMode === 'pencil'} onClick={() => setPenMode(penMode === 'pencil' ? 'off' : 'pencil')} title="Pencil: draw a freehand shape on the slide (Esc to stop)" aria-label="Pencil tool" className={`p-2 h-14 rounded-xl border bg-white dark:bg-slate-800 flex flex-col items-center justify-center cursor-pointer text-[10px] gap-0.5 ${penMode === 'pencil' ? 'border-cyan-500 ring-2 ring-cyan-400/50' : 'border-slate-200 dark:border-slate-800 hover:border-cyan-500'}`}>
            <svg viewBox="0 0 32 32" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M6 26l2-7L22 5l5 5L13 24z M19 8l5 5" /></svg>
            {penMode === 'pencil' ? 'Drawing…' : 'Pencil'}
          </button>
          <button type="button" data-testid="bezier-tool" aria-pressed={penMode === 'pen'} onClick={() => setPenMode(penMode === 'pen' ? 'off' : 'pen')} title="Pen: click points, drag to curve, Enter to finish" aria-label="Pen tool" className={`p-2 h-14 rounded-xl border bg-white dark:bg-slate-800 flex flex-col items-center justify-center cursor-pointer text-[10px] gap-0.5 ${penMode === 'pen' ? 'border-cyan-500 ring-2 ring-cyan-400/50' : 'border-slate-200 dark:border-slate-800 hover:border-cyan-500'}`}>
            <svg viewBox="0 0 32 32" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M6 26l2-7L22 5l5 5L13 24z M19 8l5 5" /></svg>
            {penMode === 'pen' ? 'Pen on' : 'Pen'}
          </button>
          <button type="button" data-testid="add-path-shape" onClick={handleAddPath} title={t('assets.addPath')} aria-label={t('assets.addPath')} className="p-2 h-14 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-cyan-500 flex items-center justify-center cursor-pointer">
            <svg viewBox="0 0 32 32" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 24 C 10 4, 18 28, 28 8" /></svg>
          </button>
          {SHAPES_ITEMS.map((item) => {
            const displayName = locale === 'ar' ? item.name.ar : item.name.en;
            const svgContent = getShapeSvg(item.id);

            return (
              <button
                key={item.id}
                type="button"
                data-testid={`add-shape-${item.id}`}
                onClick={() => handleAddShape(item.id)}
                title={displayName}
                aria-label={displayName}
                className="p-2 h-14 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-cyan-500 hover:bg-cyan-50/50 dark:hover:bg-slate-750 flex items-center justify-center text-slate-700 dark:text-slate-200 transition-all shadow-xs group cursor-pointer"
              >
                {svgContent ? (
                  <div
                    className="w-8 h-8 flex items-center justify-center text-current group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors"
                    dangerouslySetInnerHTML={{ __html: svgContent }}
                  />
                ) : (
                  <StarIcon size={13} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
