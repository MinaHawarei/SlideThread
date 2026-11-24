import React, { useMemo } from 'react';
import { useT } from '../../i18n';
import { useProjectStore, useActiveSlide } from '../../store/projectStore';
import { useSelectionStore } from '../../store/selectionStore';
import { getLayoutArchetype } from '../../templates/layouts/registry';
import { resolveSlideElements } from '../../core/elementModel';
import { aspectClass as calcAspectClass, getDimensions } from '../../core/formats';

export interface ElementPropertiesPanelProps {
  onClose?: () => void;
}

export const ElementPropertiesPanel: React.FC<ElementPropertiesPanelProps> = ({ onClose }) => {
  const { t } = useT();
  const project = useProjectStore((state) => state.project);
  const activeSlide = useActiveSlide();
  const slide = activeSlide || project.slides[0];
  const selectedId = useSelectionStore((state) => state.selectedElementId);
  const selectElement = useSelectionStore((state) => state.selectElement);

  const updateSlotOverride = useProjectStore((state) => state.updateSlotOverride);
  const updateExtraElement = useProjectStore((state) => state.updateExtraElement);
  const addExtraElement = useProjectStore((state) => state.addExtraElement);
  const deleteExtraElement = useProjectStore((state) => state.deleteExtraElement);

  const dims = getDimensions(project.formatId, project.orientation);
  const aspect = calcAspectClass(dims.width, dims.height);
  const layout = getLayoutArchetype(`${slide?.type || 'cover'}-centered`);
  const variant = layout?.variants[aspect];

  const elements = useMemo(() => {
    if (!slide || !variant) return [];
    return resolveSlideElements(slide, variant, aspect);
  }, [slide, variant, aspect]);

  const element = elements.find((el) => el.id === selectedId);

  if (!slide || !element) {
    return (
      <div className="p-4 text-center text-xs text-stone-500">
        <span>{t('editor.deselect')}</span>
      </div>
    );
  }

  const currentScale = Math.round(
    element.kind === 'slot'
      ? (element.w / (element.frame?.inlineSize ?? element.w)) * 100
      : 100
  );
  const currentOpacity = Math.round((element.opacity ?? 1) * 100);

  const handleCommit = (field: 'x' | 'y' | 'w' | 'scale' | 'rotation' | 'opacity', val: number) => {
    if (element.kind === 'slot') {
      const prior = slide.overrides?.[aspect]?.[element.id];
      const baseOverride = {
        dx: prior?.dx ?? 0,
        dy: prior?.dy ?? 0,
        scale: prior?.scale ?? 1,
        ...(prior?.w !== undefined ? { w: prior.w } : {}),
        ...(prior?.h !== undefined ? { h: prior.h } : {}),
        ...(prior?.rotation !== undefined ? { rotation: prior.rotation } : {}),
        ...(prior?.opacity !== undefined ? { opacity: prior.opacity } : {}),
        locked: prior?.locked ?? element.locked,
        hidden: prior?.hidden ?? element.hidden,
        z: prior?.z ?? element.z,
      };

      if (field === 'x') {
        const naturalX = element.frame?.inlineStart ?? (element.x - (prior?.dx ?? 0));
        const newDx = (val / 100) - naturalX;
        updateSlotOverride(slide.id, aspect, element.id, { ...baseOverride, dx: newDx });
      } else if (field === 'y') {
        const naturalY = element.frame?.blockStart ?? (element.y - (prior?.dy ?? 0));
        const newDy = (val / 100) - naturalY;
        updateSlotOverride(slide.id, aspect, element.id, { ...baseOverride, dy: newDy });
      } else if (field === 'w') {
        updateSlotOverride(slide.id, aspect, element.id, { ...baseOverride, w: val / 100 });
      } else if (field === 'scale') {
        updateSlotOverride(slide.id, aspect, element.id, { ...baseOverride, scale: val / 100 });
      } else if (field === 'rotation') {
        updateSlotOverride(slide.id, aspect, element.id, { ...baseOverride, rotation: val });
      } else if (field === 'opacity') {
        updateSlotOverride(slide.id, aspect, element.id, { ...baseOverride, opacity: Math.max(0, Math.min(1, val / 100)) });
      }
    } else if (element.extra) {
      const nextExtra = { ...element.extra };
      if (field === 'x') nextExtra.x = val / 100;
      else if (field === 'y') nextExtra.y = val / 100;
      else if (field === 'w') nextExtra.w = val / 100;
      else if (field === 'rotation') nextExtra.rotation = val;
      else if (field === 'opacity') nextExtra.opacity = Math.max(0, Math.min(1, val / 100));
      updateExtraElement(slide.id, nextExtra);
    }
  };

  const handleToggleLock = () => {
    if (element.kind === 'slot') {
      const prior = slide.overrides?.[aspect]?.[element.id];
      updateSlotOverride(slide.id, aspect, element.id, {
        dx: prior?.dx ?? 0,
        dy: prior?.dy ?? 0,
        scale: prior?.scale ?? 1,
        ...prior,
        locked: !element.locked,
      });
    } else if (element.extra) {
      updateExtraElement(slide.id, { ...element.extra, locked: !element.extra.locked });
    }
  };

  const handleToggleHide = () => {
    if (element.kind === 'slot') {
      const prior = slide.overrides?.[aspect]?.[element.id];
      updateSlotOverride(slide.id, aspect, element.id, {
        dx: prior?.dx ?? 0,
        dy: prior?.dy ?? 0,
        scale: prior?.scale ?? 1,
        ...prior,
        hidden: !element.hidden,
      });
    } else if (element.extra) {
      updateExtraElement(slide.id, { ...element.extra, hidden: !element.extra.hidden });
    }
  };

  const handleLayerOrder = (direction: 'up' | 'down') => {
    const delta = direction === 'up' ? 1 : -1;
    if (element.kind === 'slot') {
      const prior = slide.overrides?.[aspect]?.[element.id];
      updateSlotOverride(slide.id, aspect, element.id, {
        dx: prior?.dx ?? 0,
        dy: prior?.dy ?? 0,
        scale: prior?.scale ?? 1,
        ...prior,
        z: Math.max(0, element.z + delta),
      });
    } else if (element.extra) {
      updateExtraElement(slide.id, { ...element.extra, z: Math.max(0, element.extra.z + delta) });
    }
  };

  const handleReset = () => {
    if (element.kind === 'slot') {
      const existing = { ...(slide.overrides?.[aspect] || {}) };
      delete existing[element.id];
      const allOverrides = { ...(slide.overrides || {}) };
      allOverrides[aspect] = existing;
      useProjectStore.setState((state) => ({
        project: {
          ...state.project,
          slides: state.project.slides.map((s) => s.id === slide.id ? { ...s, overrides: allOverrides } : s),
        },
      }));
    } else if (element.extra) {
      updateExtraElement(slide.id, { ...element.extra, rotation: 0, opacity: 1 });
    }
  };

  return (
    <div
      data-testid="element-properties-panel"
      className="p-4 space-y-6 flex-1 overflow-y-auto font-sans"
    >
      {/* Header with Title and Deselect / Close */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold">
            {t('editor.elementProperties')}
          </span>
          <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
            <span>{element.id}</span>
            <span className="text-[11px] font-mono text-stone-400 font-normal">({element.kind})</span>
          </h3>
        </div>

        <button
          type="button"
          data-testid="properties-deselect-btn"
          onClick={() => {
            selectElement(undefined);
            onClose?.();
          }}
          aria-label={t('editor.deselect')}
          title={t('editor.deselect')}
          className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Layer Actions: Lock, Hide, Layer Order, Duplicate, Delete */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
          {t('editor.layers')}
        </label>
        <div className="flex flex-wrap gap-1.5">
          {/* Lock / Unlock */}
          <button
            type="button"
            data-testid="sidebar-lock-btn"
            aria-label={t(element.locked ? 'editor.unlockLayer' : 'editor.lockLayer', { id: element.id })}
            title={t(element.locked ? 'editor.unlockLayer' : 'editor.lockLayer', { id: element.id })}
            onClick={handleToggleLock}
            className={`min-h-[40px] px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
              element.locked
                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-200'
            }`}
          >
            <span>{element.locked ? '🔒' : '🔓'}</span>
            <span>{element.locked ? t('editor.unlockLayer', { id: '' }).trim() : t('editor.lockLayer', { id: '' }).trim()}</span>
          </button>

          {/* Hide / Show */}
          <button
            type="button"
            data-testid="sidebar-hide-btn"
            aria-label={t(element.hidden ? 'editor.showLayer' : 'editor.hideLayer', { id: element.id })}
            title={t(element.hidden ? 'editor.showLayer' : 'editor.hideLayer', { id: element.id })}
            onClick={handleToggleHide}
            className={`min-h-[40px] px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
              element.hidden
                ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-700'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-200'
            }`}
          >
            <span>{element.hidden ? '👁️‍🗨️' : '👁️'}</span>
            <span>{element.hidden ? t('editor.showLayer', { id: '' }).trim() : t('editor.hideLayer', { id: '' }).trim()}</span>
          </button>

          {/* Layer order up/down */}
          <button
            type="button"
            data-testid="sidebar-layer-up"
            aria-label={t('editor.layerMoveUp', { id: element.id })}
            title={t('editor.layerMoveUp', { id: element.id })}
            onClick={() => handleLayerOrder('up')}
            className="min-h-[40px] min-w-[40px] px-2.5 rounded-lg text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-200 flex items-center justify-center"
          >
            ▲
          </button>
          <button
            type="button"
            data-testid="sidebar-layer-down"
            aria-label={t('editor.layerMoveDown', { id: element.id })}
            title={t('editor.layerMoveDown', { id: element.id })}
            onClick={() => handleLayerOrder('down')}
            className="min-h-[40px] min-w-[40px] px-2.5 rounded-lg text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-200 flex items-center justify-center"
          >
            ▼
          </button>

          {/* Duplicate / Delete (for extras) */}
          {element.extra && (
            <>
              <button
                type="button"
                data-testid="sidebar-duplicate-btn"
                aria-label={t('editor.duplicateElement')}
                title={t('editor.duplicateElement')}
                onClick={() => {
                  const duplicate = {
                    ...element.extra!,
                    id: `${element.id}_copy_${Date.now().toString(36)}`,
                    x: Math.min(0.9, element.x + 0.03),
                    y: Math.min(0.9, element.y + 0.03),
                    z: element.extra!.z + 1,
                  };
                  addExtraElement(slide.id, duplicate);
                  selectElement(duplicate.id);
                }}
                className="min-h-[40px] px-3 rounded-lg text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-200 flex items-center gap-1"
              >
                <span>＋</span>
                <span>{t('editor.duplicateElement')}</span>
              </button>
              <button
                type="button"
                data-testid="sidebar-delete-btn"
                aria-label={t('editor.deleteElement')}
                title={t('editor.deleteElement')}
                onClick={() => {
                  deleteExtraElement(slide.id, element.id);
                  selectElement(undefined);
                }}
                className="min-h-[40px] px-3 rounded-lg text-xs font-semibold bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 hover:bg-red-100 flex items-center gap-1"
              >
                <span>🗑️</span>
                <span>{t('editor.deleteElement')}</span>
              </button>
            </>
          )}

          {/* Reset element geometry */}
          <button
            type="button"
            data-testid={`sidebar-reset-${element.id}`}
            aria-label={t('editor.resetElement')}
            title={t('editor.resetElement')}
            onClick={handleReset}
            className="min-h-[40px] px-3 rounded-lg text-xs font-semibold bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 flex items-center gap-1"
          >
            <span>↺</span>
            <span>{t('editor.resetElement')}</span>
          </button>
        </div>
      </div>

      {/* Geometry: X, Y, Width, Scale */}
      <div className="space-y-3 pt-2 border-t border-stone-200 dark:border-stone-800">
        <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
          Position & Size
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-stone-500 flex flex-col gap-1">
            <span>{t('editor.xPosition')}</span>
            <input
              type="number"
              data-testid="sidebar-x-position"
              aria-label={`Sidebar ${t('editor.xPosition')}`}
              value={Math.round(element.x * 100)}
              onChange={(e) => handleCommit('x', parseFloat(e.target.value) || 0)}
              className="py-1.5 px-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-mono text-xs"
            />
          </label>
          <label className="text-xs text-stone-500 flex flex-col gap-1">
            <span>{t('editor.yPosition')}</span>
            <input
              type="number"
              data-testid="sidebar-y-position"
              aria-label={`Sidebar ${t('editor.yPosition')}`}
              value={Math.round(element.y * 100)}
              onChange={(e) => handleCommit('y', parseFloat(e.target.value) || 0)}
              className="py-1.5 px-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-mono text-xs"
            />
          </label>
          <label className="text-xs text-stone-500 flex flex-col gap-1">
            <span>{t('editor.elementWidth')}</span>
            <input
              type="number"
              data-testid="sidebar-element-width"
              aria-label={`Sidebar ${t('editor.elementWidth')}`}
              value={Math.round(element.w * 100)}
              onChange={(e) => handleCommit('w', parseFloat(e.target.value) || 10)}
              className="py-1.5 px-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-mono text-xs"
            />
          </label>
          <label className="text-xs text-stone-500 flex flex-col gap-1">
            <span>{t('editor.elementScale')}</span>
            <input
              type="number"
              data-testid="sidebar-element-scale"
              aria-label={`Sidebar ${t('editor.elementScale')}`}
              value={currentScale}
              onChange={(e) => handleCommit('scale', parseFloat(e.target.value) || 100)}
              className="py-1.5 px-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-mono text-xs"
            />
          </label>
        </div>
      </div>

      {/* Rotation & Opacity */}
      <div className="space-y-3 pt-2 border-t border-stone-200 dark:border-stone-800">
        <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
          Rotation & Opacity
        </label>
        <div className="space-y-3">
          <label className="text-xs text-stone-500 flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <span>{t('editor.elementRotation')}</span>
              <span className="font-mono text-xs text-stone-700 dark:text-stone-300">{Math.round(element.rotation)}°</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="360"
                data-testid="sidebar-rotation-slider"
                aria-label={`Sidebar slider ${t('editor.elementRotation')}`}
                value={Math.round(element.rotation)}
                onChange={(e) => handleCommit('rotation', parseFloat(e.target.value) || 0)}
                className="flex-1 accent-amber-600"
              />
              <input
                type="number"
                data-testid="sidebar-rotation-input"
                aria-label={`Sidebar ${t('editor.elementRotation')}`}
                value={Math.round(element.rotation)}
                onChange={(e) => handleCommit('rotation', parseFloat(e.target.value) || 0)}
                className="w-16 py-1 px-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-mono text-xs text-center"
              />
            </div>
          </label>

          <label className="text-xs text-stone-500 flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <span>{t('editor.elementOpacity')}</span>
              <span className="font-mono text-xs text-stone-700 dark:text-stone-300">{currentOpacity}%</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="100"
                data-testid="sidebar-opacity-slider"
                aria-label={`Sidebar slider ${t('editor.elementOpacity')}`}
                value={currentOpacity}
                onChange={(e) => handleCommit('opacity', parseFloat(e.target.value) || 0)}
                className="flex-1 accent-amber-600"
              />
              <input
                type="number"
                data-testid="sidebar-opacity-input"
                aria-label={`Sidebar ${t('editor.elementOpacity')}`}
                value={currentOpacity}
                onChange={(e) => handleCommit('opacity', parseFloat(e.target.value) || 0)}
                className="w-16 py-1 px-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-mono text-xs text-center"
              />
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};
