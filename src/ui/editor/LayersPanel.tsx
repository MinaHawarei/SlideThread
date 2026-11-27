import React, { useMemo, useState } from 'react';
import { useT } from '../../i18n';
import { useProjectStore, useActiveSlide } from '../../store/projectStore';
import { useSelectionStore } from '../../store/selectionStore';
import { getLayoutArchetype } from '../../templates/layouts/registry';
import { mergeTemplateSlotFrames, resolveSlideElements, type ResolvedElement } from '../../core/elementModel';
import { aspectClass as calcAspectClass, getDimensions } from '../../core/formats';


const SLOT_LABELS: Record<string, string> = {
  tag: 'Tag', title: 'Title', sub: 'Subtitle', body: 'Body text', rule: 'Rule', media: 'Image / media', counter: 'Slide counter',
  signature: 'Signature', code: 'Code block', value: 'Big value', left: 'Left column', right: 'Right column', source: 'Source',
  label: 'Label', note: 'Note', cond: 'Condition', result: 'Result', name: 'Name', handle: 'Handle', quote: 'Quote', author: 'Author',
  action: 'Button', caption: 'Caption', avatar: 'Avatar', dont: "Don't", do: 'Do',
};

function layerLabel(item: ResolvedElement, slideType: string | undefined): string {
  if (item.kind === 'slot') {
    if (slideType === 'cover' && item.id === 'body') return 'Subtitle';
    return SLOT_LABELS[item.id] ?? item.id.replace(/[-_]/g, ' ').replace(/^./, (c) => c.toUpperCase());
  }
  const extra = item.extra;
  if (!extra) return item.id;
  if (extra.kind === 'shape') return `Shape (${extra.shape ?? 'rectangle'})`;
  if (extra.kind === 'text') return 'Text box';
  return extra.kind.charAt(0).toUpperCase() + extra.kind.slice(1);
}

const LayerThumb: React.FC<{ item: ResolvedElement; ratio: number }> = ({ item, ratio }) => {
  const extra = item.extra;
  const x = item.x * 100;
  const y = item.y * 100 * ratio;
  const w = Math.max(item.w * 100, 6);
  const h = Math.max(item.h * 100 * ratio, 6);
  const fill = extra?.fill && extra.fill !== 'none' ? extra.fill : 'currentColor';
  let shape: React.ReactNode;
  if (extra?.kind === 'shape' && extra.shape === 'ellipse') {
    shape = <ellipse cx={x + w / 2} cy={y + h / 2} rx={w / 2} ry={h / 2} fill={fill} fillOpacity={0.85} />;
  } else if (extra?.kind === 'shape' && (extra.shape === 'line' || extra.shape === 'arrow')) {
    shape = <line x1={x} y1={y + h / 2} x2={x + w} y2={y + h / 2} stroke="currentColor" strokeWidth={4} />;
  } else {
    shape = <rect x={x} y={y} width={w} height={h} rx={extra?.kind === 'shape' || extra?.kind === 'sticker' ? 4 : 2} fill={fill} fillOpacity={item.kind === 'slot' ? 0.45 : 0.85} />;
  }
  return (
    <svg
      data-testid={`layer-thumb-${item.id}`}
      viewBox={`0 0 100 ${100 * ratio}`}
      width={30}
      height={30 * ratio}
      aria-hidden="true"
      className="shrink-0 rounded border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-amber-600"
    >
      {shape}
    </svg>
  );
};

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
  const variant = mergeTemplateSlotFrames(layout?.variants[aspect], project.templateSnapshot?.composition[slide?.type ?? 'cover']?.[aspect]?.slots);

  const elements = useMemo(() => {
    if (!slide || !variant) return [];
    return resolveSlideElements(slide, variant, aspect, project.templateSnapshot?.composition[slide.type]?.[aspect]?.hiddenSlots);
  }, [slide, variant, aspect, project.templateSnapshot]);

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

  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  /** Moves `fromId` to the position currently held by `toId`, reusing the existing z values so nothing else shifts. */
  const reorderLayer = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const ordered = [...elements];
    const from = ordered.findIndex((item) => item.id === fromId);
    const to = ordered.findIndex((item) => item.id === toId);
    if (from < 0 || to < 0) return;
    const zs = ordered.map((item) => item.z);
    const [moved] = ordered.splice(from, 1);
    ordered.splice(to, 0, moved!);
    ordered.forEach((item, index) => {
      if (item.z !== zs[index]) setLayerState(item, { z: zs[index]! });
    });
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
        {[...elements].reverse().map((item, displayIndex) => {
          const isSelected = selectedId === item.id;
          const label = layerLabel(item, slide.type);
          const ratio = dims.height / dims.width;
          return (
            <li
              key={item.id}
              data-testid={`layer-row-${item.id}`}
              data-layer-id={item.id}
              className={`${overId === item.id && dragId !== item.id ? 'ring-2 ring-amber-400 ' : ''}${dragId === item.id ? 'opacity-40 ' : ''}flex flex-wrap items-center gap-1.5 min-h-[48px] px-2.5 py-1 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-amber-500/10 border-amber-300 dark:border-amber-700 shadow-xs'
                  : 'bg-stone-50/70 dark:bg-stone-800/40 border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800'
              } ${item.hidden ? 'opacity-50' : 'opacity-100'}`}
            >
              <span
                role="img"
                aria-label="Drag to reorder"
                data-testid={`layer-grip-${item.id}`}
                title="Drag to reorder"
                onPointerDown={(event) => {
                  event.preventDefault();
                  (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
                  setDragId(item.id);
                }}
                onPointerMove={(event) => {
                  if (!dragId) return;
                  const row = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-layer-id]');
                  setOverId(row?.dataset.layerId ?? null);
                }}
                onPointerUp={(event) => {
                  const row = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-layer-id]');
                  const target = row?.dataset.layerId;
                  if (dragId && target) reorderLayer(dragId, target);
                  setDragId(null);
                  setOverId(null);
                }}
                onPointerCancel={() => { setDragId(null); setOverId(null); }}
                style={{ touchAction: 'none' }}
                className="cursor-grab select-none text-stone-400 text-base px-1.5 min-h-[44px] flex items-center"
              >⋮⋮</span>
              <LayerThumb item={item} ratio={ratio} />
              {/* Select layer button */}
              <button
                type="button"
                onClick={() => handleSelect(item.id)}
                aria-current={isSelected ? 'true' : undefined}
                className="flex-1 min-w-[120px] min-h-[44px] px-1 text-start flex flex-col justify-center cursor-pointer overflow-hidden"
              >
                <span
                  className={`truncate text-xs ${
                    isSelected
                      ? 'font-bold text-amber-700 dark:text-amber-300'
                      : 'font-semibold text-stone-800 dark:text-stone-200'
                  }`}
                >
                  {label}
                </span>
                <span className="text-[10px] font-mono text-stone-400">
                  {item.kind === 'slot' ? 'slide element' : item.kind}
                </span>
              </button>

              {/* Lock / Unlock */}
              <button
                type="button"
                aria-label={t(item.locked ? 'editor.unlockLayer' : 'editor.lockLayer', { id: label })}
                title={t(item.locked ? 'editor.unlockLayer' : 'editor.lockLayer', { id: label })}
                onClick={() => setLayerState(item, { locked: !item.locked })}
                className={`min-w-[48px] min-h-[44px] flex items-center justify-center rounded-lg text-xs transition-colors cursor-pointer border ${
                  item.locked
                    ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                    : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:bg-stone-200'
                }`}
              >
                <span className="text-[11px] font-semibold px-1">{item.locked ? 'Unlock' : 'Lock'}</span>
              </button>

              {/* Hide / Show */}
              <button
                type="button"
                aria-label={t(item.hidden ? 'editor.showLayer' : 'editor.hideLayer', { id: label })}
                title={t(item.hidden ? 'editor.showLayer' : 'editor.hideLayer', { id: label })}
                onClick={() => setLayerState(item, { hidden: !item.hidden })}
                className={`min-w-[48px] min-h-[44px] flex items-center justify-center rounded-lg text-xs transition-colors cursor-pointer border ${
                  item.hidden
                    ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                    : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:bg-stone-200'
                }`}
              >
                <span className="text-[11px] font-semibold px-1">{item.hidden ? 'Show' : 'Hide'}</span>
              </button>

              {/* Move up / Move down */}
              <button
                type="button"
                aria-label={t('editor.layerMoveUp', { id: label })}
                title={t('editor.layerMoveUp', { id: label })}
                disabled={displayIndex === 0}
                onClick={() => moveLayer(item.id, 1)}
                className="min-w-[36px] min-h-[44px] flex items-center justify-center rounded-lg text-xs font-bold bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-200 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                ↑
              </button>
              <button
                type="button"
                aria-label={t('editor.layerMoveDown', { id: label })}
                title={t('editor.layerMoveDown', { id: label })}
                disabled={displayIndex === elements.length - 1}
                onClick={() => moveLayer(item.id, -1)}
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
