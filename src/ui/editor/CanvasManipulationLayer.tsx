import React, { useMemo, useRef, useState } from 'react';
import type { AspectClass, Slide } from '../../core/schema';
import { resolveSlideElements, snapElementGeometry, resizeElementGeometry, rotateElementGeometry, type ElementGeometry, type ResolvedElement } from '../../core/elementModel';
import { getLayoutArchetype } from '../../templates/layouts/registry';
import { useProjectStore } from '../../store/projectStore';
import { useSelectionStore } from '../../store/selectionStore';
import { useT } from '../../i18n';

interface CanvasManipulationLayerProps {
  slide: Slide;
  aspect: AspectClass;
  width: number;
  height: number;
}

type Gesture = { pointerId: number; startX: number; startY: number; startAngle: number; initial: ElementGeometry; mode: 'move' | 'resize' | 'rotate' };

export const CanvasManipulationLayer: React.FC<CanvasManipulationLayerProps> = ({ slide, aspect, width, height }) => {
  const { t } = useT();
  const layout = getLayoutArchetype(`${slide.type}-centered`);
  const variant = layout?.variants[aspect];
  const elements = useMemo(() => variant ? resolveSlideElements(slide, variant, aspect) : [], [slide, variant, aspect]);
  const selectedId = useSelectionStore((state) => state.selectedElementId);
  const selectElement = useSelectionStore((state) => state.selectElement);
  const updateSlotOverride = useProjectStore((state) => state.updateSlotOverride);
  const updateExtraElement = useProjectStore((state) => state.updateExtraElement);
  const [preview, setPreview] = useState<{ id: string; geometry: ElementGeometry; guides: Array<{ axis: 'x' | 'y'; at: number }> }>();
  const gesture = useRef<Gesture>();

  const persistGeometry = (element: ResolvedElement, geometry: ElementGeometry) => {
    if (element.kind === 'slot' && element.frame) {
      updateSlotOverride(slide.id, aspect, element.id, {
        dx: geometry.x - element.frame.inlineStart,
        dy: geometry.y - element.frame.blockStart,
        scale: 1,
        w: geometry.w,
        h: geometry.h,
      });
    } else if (element.extra) {
      updateExtraElement(slide.id, { ...element.extra, x: geometry.x, y: geometry.y, w: geometry.w, h: geometry.h, rotation: geometry.rotation });
    }
  };

  const begin = (event: React.PointerEvent<HTMLElement>, element: ResolvedElement, mode: Gesture['mode']) => {
    if (element.locked) return;
    event.preventDefault();
    event.stopPropagation();
    selectElement(element.id);
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = event.currentTarget.closest('[data-testid="manipulation-layer"]')?.getBoundingClientRect();
    const startAngle = rect && rect.width && rect.height
      ? Math.atan2((event.clientY - rect.top) / rect.height - element.y - element.h / 2, (event.clientX - rect.left) / rect.width - element.x - element.w / 2)
      : 0;
    gesture.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startAngle,
      initial: { x: element.x, y: element.y, w: element.w, h: element.h, rotation: element.rotation },
      mode,
    };
  };

  const move = (event: React.PointerEvent<HTMLElement>, element: ResolvedElement) => {
    const active = gesture.current;
    if (!active || active.pointerId !== event.pointerId) return;
    const rect = event.currentTarget.closest('[data-testid="manipulation-layer"]')?.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height) return;
    const dx = (event.clientX - active.startX) / rect.width;
    const dy = (event.clientY - active.startY) / rect.height;
    let geometry = active.initial;
    if (active.mode === 'move') geometry = { ...active.initial, x: active.initial.x + dx, y: active.initial.y + dy };
    if (active.mode === 'resize') geometry = resizeElementGeometry(active.initial, dx, dy, element.kind === 'image' || element.kind === 'sticker');
    if (active.mode === 'rotate') {
      const angle = Math.atan2((event.clientY - rect.top) / rect.height - active.initial.y - active.initial.h / 2, (event.clientX - rect.left) / rect.width - active.initial.x - active.initial.w / 2);
      geometry = rotateElementGeometry(active.initial, active.initial.rotation + ((angle - active.startAngle) * 180) / Math.PI);
    }
    const snapped = active.mode === 'move' ? snapElementGeometry(geometry, 6 / Math.max(width, height)) : { geometry, guides: [] };
    setPreview({ id: element.id, ...snapped });
  };

  const end = (event: React.PointerEvent<HTMLElement>, element: ResolvedElement) => {
    const active = gesture.current;
    if (!active || active.pointerId !== event.pointerId) return;
    const rect = event.currentTarget.closest('[data-testid="manipulation-layer"]')?.getBoundingClientRect();
    if (rect && rect.width && rect.height) {
      const dx = (event.clientX - active.startX) / rect.width;
      const dy = (event.clientY - active.startY) / rect.height;
      let geometry = active.initial;
      if (active.mode === 'move') geometry = { ...active.initial, x: active.initial.x + dx, y: active.initial.y + dy };
      if (active.mode === 'resize') geometry = resizeElementGeometry(active.initial, dx, dy, element.kind === 'image' || element.kind === 'sticker');
      if (active.mode === 'rotate') {
        const angle = Math.atan2((event.clientY - rect.top) / rect.height - active.initial.y - active.initial.h / 2, (event.clientX - rect.left) / rect.width - active.initial.x - active.initial.w / 2);
        geometry = rotateElementGeometry(active.initial, active.initial.rotation + ((angle - active.startAngle) * 180) / Math.PI);
      }
      if (active.mode === 'move') geometry = snapElementGeometry(geometry, 6 / Math.max(width, height)).geometry;
      persistGeometry(element, geometry);
    }
    gesture.current = undefined;
    setPreview(undefined);
  };

  const reset = (element: ResolvedElement) => {
    if (element.kind === 'slot') updateSlotOverride(slide.id, aspect, element.id);
    else if (element.extra) persistGeometry(element, { x: element.extra.x, y: element.extra.y, w: element.extra.w, h: element.extra.h, rotation: 0 });
  };

  return (
    <div aria-label="Element manipulation overlay" data-testid="manipulation-layer" style={{ position: 'absolute', inset: 0, width, height, zIndex: 20, pointerEvents: 'none' }}>
      {elements.map((element) => {
        const shown = preview?.id === element.id ? preview.geometry : element;
        const isSelected = selectedId === element.id;
        return (
          <div
            key={element.id}
            data-testid={`element-hit-${element.id}`}
            data-element-id={element.id}
            aria-label={t('editor.selectElement', { id: element.id })}
            onPointerDown={(event) => begin(event, element, 'move')}
            onPointerMove={(event) => move(event, element)}
            onPointerUp={(event) => end(event, element)}
            onPointerCancel={(event) => end(event, element)}
            onClick={() => selectElement(element.id)}
            style={{ position: 'absolute', left: `${shown.x * 100}%`, top: `${shown.y * 100}%`, width: `${shown.w * 100}%`, height: `${shown.h * 100}%`, transform: `rotate(${shown.rotation}deg)`, transformOrigin: 'center', border: isSelected ? '2px solid #0891b2' : '1px solid transparent', background: isSelected ? '#06b6d40d' : 'transparent', pointerEvents: 'auto', cursor: element.locked ? 'default' : 'move', boxSizing: 'border-box' }}
          >
            {isSelected && !element.locked && <>
              <button aria-label={t('editor.resizeElement')} data-testid={`resize-${element.id}`} onPointerDown={(event) => begin(event, element, 'resize')} onClick={(event) => event.stopPropagation()} style={{ position: 'absolute', insetInlineEnd: -22, bottom: -22, width: 44, height: 44, padding: 0, border: '2px solid white', borderRadius: 22, background: '#0891b2', pointerEvents: 'auto', touchAction: 'none', cursor: 'nwse-resize' }} />
              {element.kind !== 'slot' && <button aria-label={t('editor.rotateElement')} data-testid={`rotate-${element.id}`} onPointerDown={(event) => begin(event, element, 'rotate')} onClick={(event) => event.stopPropagation()} style={{ position: 'absolute', left: '50%', top: -50, width: 44, height: 44, padding: 0, border: '2px solid white', borderRadius: 22, background: '#7c3aed', pointerEvents: 'auto', touchAction: 'none', cursor: 'grab' }} />}
              <button aria-label={t('editor.resetElement')} data-testid={`reset-${element.id}`} onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); reset(element); }} style={{ position: 'absolute', insetInlineStart: 0, top: -27, border: 0, borderRadius: 4, padding: '3px 6px', background: '#0e7490', color: 'white', fontSize: 12, pointerEvents: 'auto', cursor: 'pointer' }}>{t('editor.resetElement')}</button>
            </>}
          </div>
        );
      })}
      {preview?.guides.map((guide, index) => <div key={`${guide.axis}-${index}`} data-testid="snap-guide" style={{ position: 'absolute', ...(guide.axis === 'x' ? { insetBlock: 0, left: `${guide.at * 100}%`, width: 1 } : { insetInline: 0, top: `${guide.at * 100}%`, height: 1 }), background: '#0ea5e9', pointerEvents: 'none' }} />)}
    </div>
  );
};
