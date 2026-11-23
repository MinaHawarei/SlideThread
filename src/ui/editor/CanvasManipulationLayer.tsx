import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { AspectClass, Slide } from '../../core/schema';
import { resolveSlideElements, snapElementGeometry, resizeElementGeometry, rotateElementGeometry, scaleElementGeometry, type ElementGeometry, type ResolvedElement } from '../../core/elementModel';
import { getLayoutArchetype } from '../../templates/layouts/registry';
import { useProjectStore } from '../../store/projectStore';
import { useSelectionStore } from '../../store/selectionStore';
import { useT } from '../../i18n';

interface CanvasManipulationLayerProps {
  slide: Slide;
  aspect: AspectClass;
  width: number;
  height: number;
  zoom: number;
}

type Gesture = { pointerId: number; startX: number; startY: number; startAngle: number; initial: ElementGeometry; mode: 'move' | 'resize' | 'rotate' };

export const CanvasManipulationLayer: React.FC<CanvasManipulationLayerProps> = ({ slide, aspect, width, height, zoom }) => {
  const { t } = useT();
  const layout = getLayoutArchetype(`${slide.type}-centered`);
  const variant = layout?.variants[aspect];
  const elements = useMemo(() => variant ? resolveSlideElements(slide, variant, aspect) : [], [slide, variant, aspect]);
  const selectedId = useSelectionStore((state) => state.selectedElementId);
  const selectElement = useSelectionStore((state) => state.selectElement);
  const updateSlotOverride = useProjectStore((state) => state.updateSlotOverride);
  const updateExtraElement = useProjectStore((state) => state.updateExtraElement);
  const addExtraElement = useProjectStore((state) => state.addExtraElement);
  const deleteExtraElement = useProjectStore((state) => state.deleteExtraElement);
  const [preview, setPreview] = useState<{ id: string; geometry: ElementGeometry; guides: Array<{ axis: 'x' | 'y'; at: number }> }>();
  const [announcement, setAnnouncement] = useState('');
  const gesture = useRef<Gesture>();
  const layerRef = useRef<HTMLDivElement>(null);
  const [measuredGeometry, setMeasuredGeometry] = useState<Record<string, ElementGeometry>>({});

  useLayoutEffect(() => {
    const stage = layerRef.current?.parentElement;
    const overlayRect = layerRef.current?.getBoundingClientRect();
    const canvas = stage?.querySelector<HTMLElement>('.slide-canvas');
    if (!overlayRect?.width || !overlayRect.height || !canvas) return;
    const selectors: Record<string, string> = {
      title: '.slide-title-h1, .slide-title-h2',
      body: '.slide-sub, .explain-body-list, .slide-paragraph',
      code: '.slide-code-block',
      source: '.quote-source',
      value: '.stat-value',
    };
    const measured: Record<string, ElementGeometry> = {};
    for (const [id, selector] of Object.entries(selectors)) {
      if (slide.overrides?.[aspect]?.[id]) continue;
      const node = canvas.querySelector<HTMLElement>(selector);
      if (!node) continue;
      const rect = node.getBoundingClientRect();
      measured[id] = {
        x: (rect.left - overlayRect.left) / overlayRect.width,
        y: (rect.top - overlayRect.top) / overlayRect.height,
        w: rect.width / overlayRect.width,
        h: rect.height / overlayRect.height,
        rotation: 0,
      };
    }
    setMeasuredGeometry(measured);
  }, [slide.id, slide.type, slide.fields, slide.overrides, aspect, width, height, zoom]);

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

  const applyNumericGeometry = (element: ResolvedElement, field: 'x' | 'y' | 'w' | 'scale' | 'rotation', value: number) => {
    const geometry: ElementGeometry = { x: element.x, y: element.y, w: element.w, h: element.h, rotation: element.rotation };
    if (field === 'x') geometry.x = value / 100;
    if (field === 'y') geometry.y = value / 100;
    if (field === 'w') geometry.w = Math.max(0.02, value / 100);
    if (field === 'scale') {
      const baseWidth = element.frame?.inlineSize ?? element.w;
      geometry.w = baseWidth * (value / 100);
      if (element.frame) geometry.h = element.frame.blockSize * (value / 100);
      else geometry.h = element.h * (geometry.w / element.w);
    }
    if (field === 'rotation') geometry.rotation = value;
    persistGeometry(element, geometry);
    setAnnouncement(t('editor.movedAnnouncement', { id: element.id }));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, element: ResolvedElement) => {
    const step = event.shiftKey ? 10 : 1;
    const geometry: ElementGeometry = { x: element.x, y: element.y, w: element.w, h: element.h, rotation: element.rotation };
    if (event.key === 'Escape') {
      event.preventDefault();
      selectElement();
      setAnnouncement('');
      return;
    }
    if (event.key.startsWith('Arrow')) {
      event.preventDefault();
      event.stopPropagation();
      if (event.key === 'ArrowLeft') geometry.x -= step / width;
      if (event.key === 'ArrowRight') geometry.x += step / width;
      if (event.key === 'ArrowUp') geometry.y -= step / height;
      if (event.key === 'ArrowDown') geometry.y += step / height;
      persistGeometry(element, geometry);
      setAnnouncement(t('editor.movedAnnouncement', { id: element.id }));
      return;
    }
    if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      persistGeometry(element, scaleElementGeometry(geometry, 1.05));
      setAnnouncement(t('editor.movedAnnouncement', { id: element.id }));
      return;
    }
    if (event.key === '-') {
      event.preventDefault();
      persistGeometry(element, scaleElementGeometry(geometry, 0.95));
      setAnnouncement(t('editor.movedAnnouncement', { id: element.id }));
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd' && element.extra) {
      event.preventDefault();
      const duplicate = { ...element.extra, id: `${element.id}_copy_${Date.now().toString(36)}`, x: Math.min(1 - element.w, element.x + 0.02), y: Math.min(1 - element.h, element.y + 0.02), z: element.z + 1 };
      addExtraElement(slide.id, duplicate);
      selectElement(duplicate.id);
      setAnnouncement(t('editor.selectedAnnouncement', { id: duplicate.id }));
      return;
    }
    if (event.key === 'Delete' && element.extra) {
      event.preventDefault();
      deleteExtraElement(slide.id, element.id);
      selectElement();
      setAnnouncement(t('editor.deletedAnnouncement', { id: element.id }));
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      setAnnouncement(t('editor.selectedAnnouncement', { id: element.id }));
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
    <div ref={layerRef} aria-label={t('editor.manipulationOverlay')} data-testid="manipulation-layer" style={{ position: 'absolute', inset: 0, width, height, zIndex: 20, pointerEvents: 'none' }}>
      {elements.map((modelElement) => {
        const element = measuredGeometry[modelElement.id] && !slide.overrides?.[aspect]?.[modelElement.id]
          ? { ...modelElement, ...measuredGeometry[modelElement.id] }
          : modelElement;
        const shown = preview?.id === element.id ? preview.geometry : element;
        const isSelected = selectedId === element.id;
        return (
          <div
            key={element.id}
            data-testid={`element-hit-${element.id}`}
            data-element-id={element.id}
            aria-label={t('editor.selectElement', { id: element.id })}
            aria-current={isSelected ? 'true' : undefined}
            aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight Shift+ArrowUp Shift+ArrowDown Shift+ArrowLeft Shift+ArrowRight + - Escape Delete Control+D"
            role="group"
            tabIndex={element.locked ? -1 : 0}
            onFocus={() => { selectElement(element.id); setAnnouncement(t('editor.selectedAnnouncement', { id: element.id })); }}
            onKeyDown={(event) => handleKeyDown(event, element)}
            onPointerDown={(event) => begin(event, element, 'move')}
            onPointerMove={(event) => move(event, element)}
            onPointerUp={(event) => end(event, element)}
            onPointerCancel={(event) => end(event, element)}
            onClick={() => selectElement(element.id)}
            style={{ position: 'absolute', zIndex: isSelected ? 25 : 20, left: `${shown.x * 100}%`, top: `${shown.y * 100}%`, width: `${shown.w * 100}%`, height: `${shown.h * 100}%`, transform: `rotate(${shown.rotation}deg)`, transformOrigin: 'center', border: isSelected ? '2px solid #0891b2' : '1px solid transparent', background: isSelected ? '#06b6d40d' : 'transparent', pointerEvents: 'auto', cursor: element.locked ? 'default' : 'move', boxSizing: 'border-box' }}
          >
            {isSelected && !element.locked && <>
              <div data-testid="element-numeric-inspector" onPointerDown={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()} style={{ position: 'absolute', top: -164, insetInlineStart: 8, zIndex: 3, display: 'flex', flexWrap: 'wrap', gap: 6, width: 460, padding: 8, borderRadius: 8, background: 'white', color: '#0f172a', boxShadow: '0 4px 18px #0003', transform: `scale(${1 / zoom})`, transformOrigin: 'top left', pointerEvents: 'auto' }}>
                {(['x', 'y', 'w', 'scale'] as const).map((field) => {
                  const labelKey = field === 'x' ? 'editor.xPosition' : field === 'y' ? 'editor.yPosition' : field === 'w' ? 'editor.elementWidth' : 'editor.elementScale';
                  const baseWidth = element.frame?.inlineSize ?? element.w;
                  const current = field === 'x' ? element.x * 100 : field === 'y' ? element.y * 100 : field === 'w' ? element.w * 100 : element.w / baseWidth * 100;
                  return <label key={field} style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 12 }}><span>{t(labelKey)}</span><input aria-label={t(labelKey)} type="number" step="1" value={Math.round(current)} onChange={(event) => applyNumericGeometry(element, field, Number(event.target.value))} style={{ width: 72, minHeight: 36, border: '1px solid #94a3b8', borderRadius: 4, padding: '4px 6px', fontSize: 14 }} /></label>;
                })}
                {element.kind !== 'slot' && <label style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 12 }}><span>{t('editor.elementRotation')}</span><input aria-label={t('editor.elementRotation')} type="number" step="1" value={Math.round(element.rotation)} onChange={(event) => applyNumericGeometry(element, 'rotation', Number(event.target.value))} style={{ width: 72, minHeight: 36, border: '1px solid #94a3b8', borderRadius: 4, padding: '4px 6px', fontSize: 14 }} /></label>}
              </div>
              <button aria-label={t('editor.resizeElement')} data-testid={`resize-${element.id}`} onPointerDown={(event) => begin(event, element, 'resize')} onClick={(event) => event.stopPropagation()} style={{ position: 'absolute', insetInlineEnd: -22, bottom: -22, width: 44, height: 44, padding: 0, border: '2px solid white', borderRadius: 22, background: '#0891b2', pointerEvents: 'auto', touchAction: 'none', cursor: 'nwse-resize' }} />
              {element.kind !== 'slot' && <button aria-label={t('editor.rotateElement')} data-testid={`rotate-${element.id}`} onPointerDown={(event) => begin(event, element, 'rotate')} onClick={(event) => event.stopPropagation()} style={{ position: 'absolute', left: '50%', top: -50, width: 44, height: 44, padding: 0, border: '2px solid white', borderRadius: 22, background: '#7c3aed', pointerEvents: 'auto', touchAction: 'none', cursor: 'grab' }} />}
              <button aria-label={t('editor.resetElement')} data-testid={`reset-${element.id}`} onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); reset(element); }} style={{ position: 'absolute', insetInlineStart: 0, top: -208, border: 0, borderRadius: 4, padding: '3px 6px', background: '#0e7490', color: 'white', fontSize: 12, pointerEvents: 'auto', cursor: 'pointer' }}>{t('editor.resetElement')}</button>
            </>}
          </div>
        );
      })}
      {preview?.guides.map((guide, index) => <div key={`${guide.axis}-${index}`} data-testid="snap-guide" style={{ position: 'absolute', ...(guide.axis === 'x' ? { insetBlock: 0, left: `${guide.at * 100}%`, width: 1 } : { insetInline: 0, top: `${guide.at * 100}%`, height: 1 }), background: '#0ea5e9', pointerEvents: 'none' }} />)}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only" data-testid="canvas-live-announcement">{announcement}</div>
    </div>
  );
};
