import React, { useMemo } from 'react';
import { useT } from '../../i18n';
import { useProjectStore, useActiveSlide } from '../../store/projectStore';
import { useSelectionStore } from '../../store/selectionStore';
import { getLayoutArchetype } from '../../templates/layouts/registry';
import { resolveSlideElements, type ResolvedElement } from '../../core/elementModel';
import { aspectClass as calcAspectClass, getDimensions } from '../../core/formats';

export interface LayersPanelProps {
  className?: string;
  onSelectLayer?: (id: string) => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({ className = '', onSelectLayer }) => {
  const { t } = useT();
  const project = useProjectStore((state) => state.project);
  const activeSlide = useActiveSlide();
  const slide = activeSlide || project.slides[0];
  const selectedId = useSelectionStore((state) => state.selectedElementId);
  const selectElement = useSelectionStore((state) => state.selectElement);

  const updateSlotOverride = useProjectStore((state) => state.updateSlotOverride);
  const updateExtraElement = useProjectStore((state) => state.updateExtraElement);

  const dims = getDimensions(project.formatId, project.orientation);
  const aspect = calcAspectClass(dims.width, dims.height);
  const layout = getLayoutArchetype(`${slide?.type || 'cover'}-centered`);
  const variant = layout?.variants[aspect];

  const elements = useMemo(() => {
    if (!slide || !variant) return [];
    return resolveSlideElements(slide, variant, aspect);
  }, [slide, variant, aspect]);

  const setLayerState = (
    element: ResolvedElement,
    changes: { locked?: boolean; hidden?: boolean; z?: number }
  ) => {
    if (!slide) return;
    if (element.kind === 'slot') {
      const prior = slide.overrides?.[aspect]?.[element.id];
      updateSlotOverride(slide.id, aspect, element.id, {
        dx: prior?.dx ?? 0,
        dy: prior?.dy ?? 0,
        scale: prior?.scale ?? 1,
        ...(prior?.w !== undefined ? { w: prior.w } : {}),
        ...(prior?.h !== undefined ? { h: prior.h } : {}),
        ...prior,
        ...changes,
      });
    } else if (element.extra) {
      const slotCount = variant?.elements.length ?? 0;
      updateExtraElement(slide.id, {
        ...element.extra,
        z: changes.z === undefined ? element.extra.z : changes.z - slotCount,
        locked: changes.locked ?? element.locked,
        hidden: changes.hidden ?? element.hidden,
      });
    }
  };

  const moveLayer = (id: string, delta: number) => {
    const ordered = [...elements];
    const current = ordered.findIndex((item) => item.id === id);
    const next = current + delta;
    if (current < 0 || next < 0 || next >= ordered.length) return;
    const first = ordered[current]!;
    const second = ordered[next]!;
    setLayerState(first, { z: second.z });
    setLayerState(second, { z: first.z });
  };

  const handleSelect = (id: string) => {
    selectElement(id);
    onSelectLayer?.(id);
  };

  if (!slide) {
    return (
      <div className="p-4 text-center text-xs text-stone-500">
        <span>{t('editor.deselect')}</span>
      </div>
    );
  }

  return (
    <div
      data-testid="layers-panel"
      className={`p-4 space-y-3 font-sans text-stone-900 dark:text-stone-100 ${className}`.trim()}
    >
      <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-800">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold">
            {t('editor.layers')}
          </span>
          <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">
            {t('editor.layers')} ({elements.length})
          </h3>
        </div>
      </div>

      <ol
        data-testid="layers-list"
        className="list-none p-0 m-0 space-y-1.5"
      >
        {elements.map((item, index) => {
          const isSelected = selectedId === item.id;
          return (
            <li
              key={item.id}
              data-testid={`layer-row-${item.id}`}
              className={`flex items-center gap-1.5 min-h-[48px] px-2.5 py-1 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-amber-500/10 border-amber-300 dark:border-amber-700 shadow-xs'
                  : 'bg-stone-50/70 dark:bg-stone-800/40 border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800'
              } ${item.hidden ? 'opacity-50' : 'opacity-100'}`}
            >
              {/* Select layer button */}
              <button
                type="button"
                onClick={() => handleSelect(item.id)}
                aria-current={isSelected ? 'true' : undefined}
                className="flex-1 min-w-0 min-h-[44px] px-1 text-start flex flex-col justify-center cursor-pointer overflow-hidden"
              >
                <span
                  className={`truncate text-xs ${
                    isSelected
                      ? 'font-bold text-amber-700 dark:text-amber-300'
                      : 'font-semibold text-stone-800 dark:text-stone-200'
                  }`}
                >
                  {item.id}
                </span>
                <span className="text-[10px] font-mono text-stone-400">
                  {item.kind}
                </span>
              </button>

              {/* Lock / Unlock */}
              <button
                type="button"
                aria-label={t(item.locked ? 'editor.unlockLayer' : 'editor.lockLayer', { id: item.id })}
                title={t(item.locked ? 'editor.unlockLayer' : 'editor.lockLayer', { id: item.id })}
                onClick={() => setLayerState(item, { locked: !item.locked })}
                className={`min-w-[40px] min-h-[44px] flex items-center justify-center rounded-lg text-xs transition-colors cursor-pointer border ${
                  item.locked
                    ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                    : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:bg-stone-200'
                }`}
              >
                {item.locked ? '🔒' : '🔓'}
              </button>

              {/* Hide / Show */}
              <button
                type="button"
                aria-label={t(item.hidden ? 'editor.showLayer' : 'editor.hideLayer', { id: item.id })}
                title={t(item.hidden ? 'editor.showLayer' : 'editor.hideLayer', { id: item.id })}
                onClick={() => setLayerState(item, { hidden: !item.hidden })}
                className={`min-w-[40px] min-h-[44px] flex items-center justify-center rounded-lg text-xs transition-colors cursor-pointer border ${
                  item.hidden
                    ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                    : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:bg-stone-200'
                }`}
              >
                {item.hidden ? '◉' : '◌'}
              </button>

              {/* Move up / Move down */}
              <button
                type="button"
                aria-label={t('editor.layerMoveUp', { id: item.id })}
                title={t('editor.layerMoveUp', { id: item.id })}
                disabled={index === 0}
                onClick={() => moveLayer(item.id, -1)}
                className="min-w-[36px] min-h-[44px] flex items-center justify-center rounded-lg text-xs font-bold bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-200 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                ↑
              </button>
              <button
                type="button"
                aria-label={t('editor.layerMoveDown', { id: item.id })}
                title={t('editor.layerMoveDown', { id: item.id })}
                disabled={index === elements.length - 1}
                onClick={() => moveLayer(item.id, 1)}
                className="min-w-[36px] min-h-[44px] flex items-center justify-center rounded-lg text-xs font-bold bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-200 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                ↓
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
