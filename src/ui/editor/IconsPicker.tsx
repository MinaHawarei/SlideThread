import React, { useState } from 'react';
import { useT } from '../../i18n';
import { useProjectStore, useActiveSlide } from '../../store/projectStore';
import { useSelectionStore } from '../../store/selectionStore';
import { ICONS_ITEMS, getIconSvg } from '../../assets';
import type { ExtraElement } from '../../core/schema';

const ICON_PALETTE_COLORS = [
  '#0891b2', // Cyan
  '#0284c7', // Sky
  '#6366f1', // Indigo
  '#a855f7', // Purple
  '#f43f5e', // Rose
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#0f172a', // Slate Ink
  '#ffffff', // White
];

export const IconsPicker: React.FC = () => {
  const { t, locale } = useT();
  const project = useProjectStore((state) => state.project);
  const activeSlide = useActiveSlide();
  const addExtraElement = useProjectStore((state) => state.addExtraElement);
  const updateExtraElement = useProjectStore((state) => state.updateExtraElement);
  const deleteExtraElement = useProjectStore((state) => state.deleteExtraElement);
  const selectedElementId = useSelectionStore((state) => state.selectedElementId);
  const selectElement = useSelectionStore((state) => state.selectElement);

  const [isOpen, setIsOpen] = useState(true);

  if (!activeSlide) return null;

  // Check if an icon extra on this slide is selected
  const selectedExtra = activeSlide.extras?.find(
    (extra) =>
      extra.id === selectedElementId &&
      extra.kind === 'shape' &&
      extra.assetId &&
      ICONS_ITEMS.some((i) => i.id === extra.assetId)
  );

  const handleAddIcon = (iconId: string) => {
    const item = ICONS_ITEMS.find((i) => i.id === iconId);
    if (!item) return;

    const baseSize = 0.15; // Square icon aspect ratio

    const newExtra: ExtraElement = {
      id: `icon_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      kind: 'shape',
      assetId: item.id,
      x: Math.max(0.05, 0.5 - baseSize / 2),
      y: Math.max(0.05, 0.5 - baseSize / 2),
      w: baseSize,
      h: baseSize,
      rotation: 0,
      z: (activeSlide.extras?.length ?? 0) + 1,
      locked: false,
      fill: project.primaryColor || '#0891b2',
    };

    addExtraElement(activeSlide.id, newExtra);
    selectElement(newExtra.id);
  };

  const handleColorChange = (color: string) => {
    if (!selectedExtra) return;
    updateExtraElement(activeSlide.id, {
      ...selectedExtra,
      fill: color,
    });
  };

  const handleDelete = () => {
    if (!selectedExtra) return;
    deleteExtraElement(activeSlide.id, selectedExtra.id);
    selectElement(undefined);
  };

  return (
    <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-4" data-testid="icons-picker">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
          >
            <span>{t('assets.iconsTitle')}</span>
            <span className="text-[10px] text-slate-400 font-mono">({ICONS_ITEMS.length})</span>
            <span className="text-[10px] text-slate-400">{isOpen ? '▼' : '▶'}</span>
          </button>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
          ISC License
        </span>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
        {t('assets.iconsDesc')}
      </p>

      {isOpen && (
        <div className="space-y-3">
          {/* Icons Grid */}
          <div className="grid grid-cols-5 gap-1.5 p-1 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
            {ICONS_ITEMS.map((item) => {
              const svg = getIconSvg(item.id);
              const isSelected = selectedExtra?.assetId === item.id;
              const name = locale === 'ar' ? item.name.ar : item.name.en;

              return (
                <button
                  key={item.id}
                  type="button"
                  data-testid={`add-icon-${item.id}`}
                  title={name}
                  onClick={() => handleAddIcon(item.id)}
                  className={`flex flex-col items-center justify-center p-2 rounded transition-colors group relative ${
                    isSelected
                      ? 'bg-amber-50 dark:bg-amber-950/40 ring-1 ring-amber-500 text-amber-600 dark:text-amber-400'
                      : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div
                    className="w-5 h-5 flex items-center justify-center pointer-events-none"
                    dangerouslySetInnerHTML={{ __html: svg || '' }}
                  />
                  <span className="sr-only">{name}</span>
                </button>
              );
            })}
          </div>

          {/* Color & Controls for Selected Icon */}
          {selectedExtra && (
            <div
              data-testid="selected-icon-controls"
              className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {t('assets.selectedIcon')}
                </span>
                <button
                  type="button"
                  data-testid="delete-selected-icon"
                  onClick={handleDelete}
                  className="text-xs text-rose-500 hover:text-rose-600 font-medium transition-colors"
                >
                  {t('assets.deleteIcon')}
                </button>
              </div>

              {/* Palette swatches */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {ICON_PALETTE_COLORS.map((color) => {
                  const isActive = (selectedExtra.fill || '').toLowerCase() === color.toLowerCase();
                  return (
                    <button
                      key={color}
                      type="button"
                      data-testid={`icon-palette-color-${color}`}
                      title={color}
                      onClick={() => handleColorChange(color)}
                      style={{ backgroundColor: color }}
                      className={`w-5 h-5 rounded-full border border-black/10 transition-transform ${
                        isActive ? 'scale-125 ring-2 ring-amber-500 ring-offset-1' : 'hover:scale-110'
                      }`}
                    />
                  );
                })}

                {/* Custom Color Picker */}
                <label
                  title={t('assets.customColor')}
                  className="w-5 h-5 rounded-full border border-dashed border-slate-400 flex items-center justify-center cursor-pointer hover:border-slate-600 overflow-hidden relative"
                >
                  <input
                    type="color"
                    data-testid="icon-color-input"
                    value={selectedExtra.fill || '#0891b2'}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-500 font-bold">+</span>
                </label>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
