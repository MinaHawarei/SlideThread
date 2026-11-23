import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { AspectClass, Slide } from '../../core/schema';
import { resolveSlideElements, snapElementGeometry, resizeElementGeometry, rotateElementGeometry, scaleElementGeometry, SLOT_SELECTORS, type ElementGeometry, type ResolvedElement } from '../../core/elementModel';
import { getLayoutArchetype } from '../../templates/layouts/registry';
import { useProjectStore } from '../../store/projectStore';
import { useSelectionStore } from '../../store/selectionStore';
import { useT } from '../../i18n';
import { RichTextEditor } from './RichTextEditor';

interface CanvasManipulationLayerProps {
  slide: Slide;
  aspect: AspectClass;
  width: number;
  height: number;
  zoom: number;
}


type Gesture = { pointerIds: number[]; startX: number; startY: number; startAngle: number; startDistance: number; initial: ElementGeometry; mode: 'move' | 'resize' | 'rotate' | 'pinch' };

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
  const updateSlideFields = useProjectStore((state) => state.updateSlideFields);
  const [preview, setPreview] = useState<{ id: string; geometry: ElementGeometry; guides: Array<{ axis: 'x' | 'y'; at: number }> }>();
  const [announcement, setAnnouncement] = useState('');
  const [touchLayout, setTouchLayout] = useState(false);
  const [layersOpen, setLayersOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const gesture = useRef<Gesture>();
  const activePointers = useRef(new Map<number, { x: number; y: number }>());
  const layerRef = useRef<HTMLDivElement>(null);
  const [measuredGeometry, setMeasuredGeometry] = useState<Record<string, ElementGeometry>>({});

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      setTouchLayout(window.innerWidth <= 639);
      return;
    }
    const query = window.matchMedia('(max-width: 639px)');
    const update = () => setTouchLayout(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useLayoutEffect(() => {
    const stage = layerRef.current?.parentElement;
    const overlayRect = layerRef.current?.getBoundingClientRect();
    const canvas = stage?.querySelector<HTMLElement>('.slide-canvas');
    if (!overlayRect?.width || !overlayRect.height || !canvas) return;
    const measured: Record<string, ElementGeometry> = {};
    for (const [id, selector] of Object.entries(SLOT_SELECTORS)) {
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

  useLayoutEffect(() => {
    const canvas = layerRef.current?.parentElement?.querySelector<HTMLElement>('.slide-canvas');
    if (!canvas) return;
    const previousStyle = new Map<HTMLElement, { visibility: string; zIndex: string; position: string }>();
    for (const element of elements) {
      const selector = SLOT_SELECTORS[element.id];
      if (!selector) continue;
      for (const node of canvas.querySelectorAll<HTMLElement>(selector)) {
        previousStyle.set(node, { visibility: node.style.visibility, zIndex: node.style.zIndex, position: node.style.position });
        node.style.visibility = element.hidden ? 'hidden' : 'visible';
        node.style.zIndex = String(element.z);
        if (window.getComputedStyle(node).position === 'static') node.style.position = 'relative';
      }
    }
    return () => {
      for (const [node, style] of previousStyle) {
        node.style.visibility = style.visibility;
        node.style.zIndex = style.zIndex;
        node.style.position = style.position;
      }
    };
  }, [elements, slide.id, aspect]);

  const persistGeometry = (element: ResolvedElement, geometry: ElementGeometry) => {
    if (element.kind === 'slot' && element.frame) {
      const prior = slide.overrides?.[aspect]?.[element.id];
      updateSlotOverride(slide.id, aspect, element.id, {
        ...prior,
        dx: geometry.x - element.frame.inlineStart,
        dy: geometry.y - element.frame.blockStart,
        scale: prior?.scale ?? 1,
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
    if (element.locked && event.key !== 'Escape') return;
    const step = event.shiftKey ? 10 : 1;
    const geometry: ElementGeometry = { x: element.x, y: element.y, w: element.w, h: element.h, rotation: element.rotation };
    if (event.key === 'Escape') {
      event.preventDefault();
      setEditingId(null);
      selectElement();
      setAnnouncement('');
      return;
    }
    if (event.key === 'Enter') {
      const isText = element.kind === 'slot' || element.extra?.kind === 'text';
      if (isText) {
        event.preventDefault();
        setEditingId(element.id);
        return;
      }
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
      const duplicate = { ...element.extra, id: `${element.id}_copy_${Date.now().toString(36)}`, x: Math.min(1 - element.w, element.x + 0.02), y: Math.min(1 - element.h, element.y + 0.02), z: element.extra.z + 1 };
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
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Synthetic pointer events do not have an active pointer to capture. */ }
    const rect = event.currentTarget.closest('[data-testid="manipulation-layer"]')?.getBoundingClientRect();
    const startAngle = rect && rect.width && rect.height
      ? Math.atan2((event.clientY - rect.top) / rect.height - element.y - element.h / 2, (event.clientX - rect.left) / rect.width - element.x - element.w / 2)
      : 0;
    activePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const active = gesture.current;
    const initial = { x: element.x, y: element.y, w: element.w, h: element.h, rotation: element.rotation };
    if (event.pointerType === 'touch' && active && active.pointerIds.length === 1 && active.mode === 'move') {
      const first = activePointers.current.get(active.pointerIds[0]!);
      if (first) {
        const dx = event.clientX - first.x;
        const dy = event.clientY - first.y;
        gesture.current = { pointerIds: [...active.pointerIds, event.pointerId], startX: (first.x + event.clientX) / 2, startY: (first.y + event.clientY) / 2, startAngle: Math.atan2(dy, dx), startDistance: Math.hypot(dx, dy), initial: active.initial, mode: 'pinch' };
        try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Synthetic pointer events do not have an active pointer to capture. */ }
        return;
      }
    }
    gesture.current = { pointerIds: [event.pointerId], startX: event.clientX, startY: event.clientY, startAngle, startDistance: 0, initial, mode };
  };

  const move = (event: React.PointerEvent<HTMLElement>, element: ResolvedElement) => {
    const active = gesture.current;
    if (!active || !active.pointerIds.includes(event.pointerId)) return;
    activePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const rect = event.currentTarget.closest('[data-testid="manipulation-layer"]')?.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height) return;
    const points = active.pointerIds.map((id) => activePointers.current.get(id)).filter((point): point is { x: number; y: number } => Boolean(point));
    let dx = (event.clientX - active.startX) / rect.width;
    let dy = (event.clientY - active.startY) / rect.height;
    let geometry = active.initial;
    if (active.mode === 'pinch' && points.length === 2) {
      const deltaX = points[1]!.x - points[0]!.x;
      const deltaY = points[1]!.y - points[0]!.y;
      const distance = Math.hypot(deltaX, deltaY);
      const scale = active.startDistance ? distance / active.startDistance : 1;
      dx = ((points[0]!.x + points[1]!.x) / 2 - active.startX) / rect.width;
      dy = ((points[0]!.y + points[1]!.y) / 2 - active.startY) / rect.height;
      const moved = { ...active.initial, x: active.initial.x + dx, y: active.initial.y + dy, w: Math.max(0.02, active.initial.w * scale), h: Math.max(0.02, active.initial.h * scale) };
      geometry = element.kind === 'slot' ? moved : rotateElementGeometry(moved, active.initial.rotation + (Math.atan2(deltaY, deltaX) - active.startAngle) * 180 / Math.PI);
    }
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
    if (!active || !active.pointerIds.includes(event.pointerId)) return;
    activePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const rect = event.currentTarget.closest('[data-testid="manipulation-layer"]')?.getBoundingClientRect();
    if (rect && rect.width && rect.height) {
      const points = active.pointerIds.map((id) => activePointers.current.get(id)).filter((point): point is { x: number; y: number } => Boolean(point));
      let dx = (event.clientX - active.startX) / rect.width;
      let dy = (event.clientY - active.startY) / rect.height;
      let geometry = active.initial;
      if (active.mode === 'pinch' && points.length === 2) {
        const deltaX = points[1]!.x - points[0]!.x;
        const deltaY = points[1]!.y - points[0]!.y;
        const scale = active.startDistance ? Math.hypot(deltaX, deltaY) / active.startDistance : 1;
        dx = ((points[0]!.x + points[1]!.x) / 2 - active.startX) / rect.width;
        dy = ((points[0]!.y + points[1]!.y) / 2 - active.startY) / rect.height;
        const moved = { ...active.initial, x: active.initial.x + dx, y: active.initial.y + dy, w: Math.max(0.02, active.initial.w * scale), h: Math.max(0.02, active.initial.h * scale) };
        geometry = element.kind === 'slot' ? moved : rotateElementGeometry(moved, active.initial.rotation + (Math.atan2(deltaY, deltaX) - active.startAngle) * 180 / Math.PI);
      }
      if (active.mode === 'move') geometry = { ...active.initial, x: active.initial.x + dx, y: active.initial.y + dy };
      if (active.mode === 'resize') geometry = resizeElementGeometry(active.initial, dx, dy, element.kind === 'image' || element.kind === 'sticker');
      if (active.mode === 'rotate') {
        const angle = Math.atan2((event.clientY - rect.top) / rect.height - active.initial.y - active.initial.h / 2, (event.clientX - rect.left) / rect.width - active.initial.x - active.initial.w / 2);
        geometry = rotateElementGeometry(active.initial, active.initial.rotation + ((angle - active.startAngle) * 180) / Math.PI);
      }
      if (active.mode === 'move') geometry = snapElementGeometry(geometry, 6 / Math.max(width, height)).geometry;
      persistGeometry(element, geometry);
    }
    activePointers.current.delete(event.pointerId);
    if (active.pointerIds.length > 1 && active.pointerIds.some((id) => id !== event.pointerId)) {
      const remaining = active.pointerIds.find((id) => id !== event.pointerId)!;
      const point = activePointers.current.get(remaining);
      if (point) gesture.current = { pointerIds: [remaining], startX: point.x, startY: point.y, startAngle: active.startAngle, startDistance: 0, initial: preview?.geometry ?? active.initial, mode: 'move' };
      else gesture.current = undefined;
    } else gesture.current = undefined;
    setPreview(undefined);
  };

  const reset = (element: ResolvedElement) => {
    if (element.kind === 'slot') {
      const prior = slide.overrides?.[aspect]?.[element.id];
      const hasLayerState = prior?.z !== undefined || prior?.locked !== undefined || prior?.hidden !== undefined;
      if (!hasLayerState) updateSlotOverride(slide.id, aspect, element.id);
      else {
        const base = measuredGeometry[element.id] ?? { x: element.frame!.inlineStart, y: element.frame!.blockStart, w: element.frame!.inlineSize, h: element.frame!.blockSize, rotation: 0 };
        updateSlotOverride(slide.id, aspect, element.id, {
          dx: base.x - element.frame!.inlineStart,
          dy: base.y - element.frame!.blockStart,
          scale: 1,
          w: base.w,
          h: base.h,
          ...(prior?.z !== undefined ? { z: prior.z } : {}),
          ...(prior?.locked !== undefined ? { locked: prior.locked } : {}),
          ...(prior?.hidden !== undefined ? { hidden: prior.hidden } : {}),
        });
      }
    }
    else if (element.extra) persistGeometry(element, { x: element.extra.x, y: element.extra.y, w: element.extra.w, h: element.extra.h, rotation: 0 });
  };

  const setLayerState = (element: ResolvedElement, changes: { z?: number; locked?: boolean; hidden?: boolean }) => {
    if (element.kind === 'slot' && element.frame) {
      const prior = slide.overrides?.[aspect]?.[element.id];
      updateSlotOverride(slide.id, aspect, element.id, {
        dx: prior?.dx ?? 0, dy: prior?.dy ?? 0, scale: prior?.scale ?? 1,
        ...(prior?.w !== undefined ? { w: prior.w } : {}),
        ...(prior?.h !== undefined ? { h: prior.h } : {}),
        z: changes.z ?? element.z,
        locked: changes.locked ?? element.locked,
        hidden: changes.hidden ?? element.hidden,
      });
    } else if (element.extra) {
      updateExtraElement(slide.id, { ...element.extra, z: changes.z === undefined ? element.extra.z : changes.z - (variant?.elements.length ?? 0), locked: changes.locked ?? element.locked, hidden: changes.hidden ?? element.hidden });
    }
  };

  const moveLayer = (elementId: string, delta: -1 | 1) => {
    const ordered = [...elements];
    const current = ordered.findIndex((item) => item.id === elementId);
    const next = current + delta;
    if (current < 0 || next < 0 || next >= ordered.length) return;
    const first = ordered[current]!;
    const second = ordered[next]!;
    setLayerState(first, { z: second.z });
    setLayerState(second, { z: first.z });
  };

  return (
    <div ref={layerRef} aria-label={t('editor.manipulationOverlay')} data-testid="manipulation-layer" onTouchStart={(event) => event.stopPropagation()} onTouchMove={(event) => event.stopPropagation()} onTouchEnd={(event) => event.stopPropagation()} style={{ position: 'absolute', inset: 0, width, height, zIndex: 20, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 60, pointerEvents: 'auto', transform: touchLayout ? undefined : `scale(${1 / zoom})`, transformOrigin: 'top right' }}>
        <button type="button" data-testid="layers-toggle" aria-expanded={layersOpen} aria-controls="canvas-layers-panel" onClick={() => setLayersOpen((open) => !open)} style={{ minWidth: 44, minHeight: 44, padding: '0 12px', border: '1px solid #94a3b8', borderRadius: 10, background: 'white', color: '#0f172a', fontWeight: 700 }}>{t('editor.layers')}</button>
        {layersOpen && <section id="canvas-layers-panel" data-testid="canvas-layers-panel" aria-label={t('editor.layers')} style={{ width: 300, maxHeight: Math.min(touchLayout ? height - 64 : height * zoom - 64, 420), overflowY: 'auto', marginTop: 6, padding: 8, borderRadius: 12, background: 'white', color: '#0f172a', boxShadow: '0 6px 24px #0004' }}>
          <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {elements.map((item, index) => <li key={item.id} data-testid={`layer-row-${item.id}`} style={{ display: 'flex', alignItems: 'center', gap: 4, minHeight: 48, borderBottom: '1px solid #e2e8f0', opacity: item.hidden ? 0.6 : 1 }}>
              <button type="button" onClick={() => selectElement(item.id)} aria-current={selectedId === item.id ? 'true' : undefined} style={{ flex: 1, minWidth: 0, minHeight: 44, padding: '0 6px', textAlign: 'start', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: selectedId === item.id ? 700 : 500 }}>{item.id}</button>
              <button type="button" aria-label={t(item.locked ? 'editor.unlockLayer' : 'editor.lockLayer', { id: item.id })} onClick={() => setLayerState(item, { locked: !item.locked })} style={{ minWidth: 40, minHeight: 44, borderRadius: 8, background: '#f1f5f9' }}>{item.locked ? '🔒' : '🔓'}</button>
              <button type="button" aria-label={t(item.hidden ? 'editor.showLayer' : 'editor.hideLayer', { id: item.id })} onClick={() => setLayerState(item, { hidden: !item.hidden })} style={{ minWidth: 40, minHeight: 44, borderRadius: 8, background: '#f1f5f9' }}>{item.hidden ? '◉' : '◌'}</button>
              <button type="button" aria-label={t('editor.layerMoveUp', { id: item.id })} disabled={index === 0} onClick={() => moveLayer(item.id, -1)} style={{ minWidth: 36, minHeight: 44, opacity: index === 0 ? 0.4 : 1 }}>↑</button>
              <button type="button" aria-label={t('editor.layerMoveDown', { id: item.id })} disabled={index === elements.length - 1} onClick={() => moveLayer(item.id, 1)} style={{ minWidth: 36, minHeight: 44, opacity: index === elements.length - 1 ? 0.4 : 1 }}>↓</button>
            </li>)}
          </ol>
        </section>}
      </div>
      {elements.filter((item) => !item.hidden).map((modelElement) => {
        const element = measuredGeometry[modelElement.id] && !slide.overrides?.[aspect]?.[modelElement.id]
          ? { ...modelElement, ...measuredGeometry[modelElement.id] }
          : modelElement;
        const shown = preview?.id === element.id ? preview.geometry : element;
        const isSelected = selectedId === element.id;
        const isTextElement = element.kind === 'slot' || element.extra?.kind === 'text';
        const isCurrentlyEditing = editingId === element.id;
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
            onDoubleClick={(event) => {
              if (element.locked || !isTextElement) return;
              event.stopPropagation();
              selectElement(element.id);
              setEditingId(element.id);
            }}
            onPointerDown={(event) => {
              if (isCurrentlyEditing) {
                event.stopPropagation();
                return;
              }
              begin(event, element, 'move');
            }}
            onPointerMove={(event) => move(event, element)}
            onPointerUp={(event) => end(event, element)}
            onPointerCancel={(event) => end(event, element)}
            onClick={() => selectElement(element.id)}
            style={{ position: 'absolute', zIndex: isCurrentlyEditing ? 35 : isSelected ? 25 : 20, left: `${shown.x * 100}%`, top: `${shown.y * 100}%`, width: `${shown.w * 100}%`, height: `${shown.h * 100}%`, transform: `rotate(${shown.rotation}deg)`, transformOrigin: 'center', border: isSelected ? '2px solid #0891b2' : '1px solid transparent', background: isSelected ? '#06b6d40d' : 'transparent', pointerEvents: 'auto', touchAction: touchLayout ? 'none' : undefined, cursor: element.locked ? 'default' : isCurrentlyEditing ? 'text' : 'move', boxSizing: 'border-box' }}
          >
            {isCurrentlyEditing ? (
              <RichTextEditor
                content={
                  element.kind === 'slot'
                    ? (slide.fields[element.id] || { type: 'doc', blocks: [{ type: 'p', runs: [{ text: '' }] }] })
                    : (element.extra?.text || { type: 'doc', blocks: [{ type: 'p', runs: [{ text: '' }] }] })
                }
                onChange={(doc) => {
                  if (element.kind === 'slot') {
                    updateSlideFields(slide.id, { [element.id]: doc });
                  } else if (element.extra) {
                    updateExtraElement(slide.id, { ...element.extra, text: doc });
                  }
                }}
                onDone={() => setEditingId(null)}
                touchLayout={touchLayout}
              />
            ) : (
              isSelected && !element.locked && <>
                {!touchLayout && <div data-testid="element-context-toolbar" role="toolbar" aria-label={t('editor.selectionToolbar')} onPointerDown={(event) => event.stopPropagation()} style={{ position: 'absolute', top: -52, insetInlineStart: 0, zIndex: 5, display: 'flex', gap: 4, padding: 4, borderRadius: 10, background: 'white', color: '#0f172a', boxShadow: '0 3px 14px #0003', pointerEvents: 'auto', transform: `scale(${1 / zoom})`, transformOrigin: 'top left' }}>
                  <button type="button" aria-label={t(element.locked ? 'editor.unlockLayer' : 'editor.lockLayer', { id: element.id })} onClick={() => setLayerState(element, { locked: !element.locked })} style={{ minWidth: 44, minHeight: 44, borderRadius: 8, background: '#f1f5f9' }}>{element.locked ? '🔒' : '🔓'}</button>
                  <button type="button" aria-label={t(element.hidden ? 'editor.showLayer' : 'editor.hideLayer', { id: element.id })} onClick={() => setLayerState(element, { hidden: !element.hidden })} style={{ minWidth: 44, minHeight: 44, borderRadius: 8, background: '#f1f5f9' }}>{element.hidden ? '◉' : '◌'}</button>
                  {isTextElement && (
                    <button type="button" aria-label={t('editor.editText')} data-testid={`edit-text-btn-${element.id}`} onClick={(e) => { e.stopPropagation(); setEditingId(element.id); }} style={{ minWidth: 44, minHeight: 44, borderRadius: 8, background: '#f1f5f9' }}>✎</button>
                  )}
                  {element.extra && <>
                    <button type="button" aria-label={t('editor.duplicateElement')} onClick={() => { const duplicate = { ...element.extra!, id: `${element.id}_copy_${Date.now().toString(36)}`, x: Math.min(1 - element.w, element.x + 0.02), y: Math.min(1 - element.h, element.y + 0.02), z: element.extra!.z + 1 }; addExtraElement(slide.id, duplicate); selectElement(duplicate.id); }} style={{ minWidth: 44, minHeight: 44, borderRadius: 8, background: '#f1f5f9' }}>＋</button>
                    <button type="button" aria-label={t('editor.deleteElement')} onClick={() => { deleteExtraElement(slide.id, element.id); selectElement(); }} style={{ minWidth: 44, minHeight: 44, borderRadius: 8, background: '#fee2e2' }}>×</button>
                  </>}
                </div>}
                {!touchLayout && <div data-testid="element-numeric-inspector" onPointerDown={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()} style={{ position: 'absolute', top: -164, insetInlineStart: 8, zIndex: 3, display: 'flex', flexWrap: 'wrap', gap: 6, width: 460, padding: 8, borderRadius: 8, background: 'white', color: '#0f172a', boxShadow: '0 4px 18px #0003', transform: `scale(${1 / zoom})`, transformOrigin: 'top left', pointerEvents: 'auto' }}>
                  {!touchLayout && (['x', 'y', 'w', 'scale'] as const).map((field) => {
                    const labelKey = field === 'x' ? 'editor.xPosition' : field === 'y' ? 'editor.yPosition' : field === 'w' ? 'editor.elementWidth' : 'editor.elementScale';
                    const baseWidth = element.frame?.inlineSize ?? element.w;
                    const current = field === 'x' ? element.x * 100 : field === 'y' ? element.y * 100 : field === 'w' ? element.w * 100 : element.w / baseWidth * 100;
                    return <label key={field} style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 12 }}><span>{t(labelKey)}</span><input aria-label={t(labelKey)} type="number" step="1" value={Math.round(current)} onChange={(event) => applyNumericGeometry(element, field, Number(event.target.value))} style={{ width: 72, minHeight: 36, border: '1px solid #94a3b8', borderRadius: 4, padding: '4px 6px', fontSize: 14 }} /></label>;
                  })}
                  {!touchLayout && element.kind !== 'slot' && <label style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 12 }}><span>{t('editor.elementRotation')}</span><input aria-label={t('editor.elementRotation')} type="number" step="1" value={Math.round(element.rotation)} onChange={(event) => applyNumericGeometry(element, 'rotation', Number(event.target.value))} style={{ width: 72, minHeight: 36, border: '1px solid #94a3b8', borderRadius: 4, padding: '4px 6px', fontSize: 14 }} /></label>}
                </div>
                }
                <button aria-label={t('editor.resizeElement')} data-testid={`resize-${element.id}`} onPointerDown={(event) => begin(event, element, 'resize')} onClick={(event) => event.stopPropagation()} style={{ position: 'absolute', right: -22, bottom: -22, width: 44, height: 44, padding: 0, border: '2px solid white', borderRadius: 22, background: '#0891b2', pointerEvents: 'auto', touchAction: 'none', cursor: 'nwse-resize' }} />
                {element.kind !== 'slot' && <button aria-label={t('editor.rotateElement')} data-testid={`rotate-${element.id}`} onPointerDown={(event) => begin(event, element, 'rotate')} onClick={(event) => event.stopPropagation()} style={{ position: 'absolute', left: '50%', top: -50, width: 44, height: 44, padding: 0, border: '2px solid white', borderRadius: 22, background: '#7c3aed', pointerEvents: 'auto', touchAction: 'none', cursor: 'grab' }} />}
                {!touchLayout && <button aria-label={t('editor.resetElement')} data-testid={`reset-${element.id}`} onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); reset(element); }} style={{ position: 'absolute', insetInlineStart: 0, top: -208, border: 0, borderRadius: 4, padding: '3px 6px', background: '#0e7490', color: 'white', fontSize: 12, pointerEvents: 'auto', cursor: 'pointer' }}>{t('editor.resetElement')}</button>}
              </>
            )}
          </div>
        );
      })}
      {touchLayout && elements.find((element) => element.id === selectedId && !element.locked && !element.hidden) && (() => {
        const element = elements.find((item) => item.id === selectedId)!;
        return <div data-testid="mobile-selection-toolbar" role="toolbar" aria-label={t('editor.manipulationOverlay')} onPointerDown={(event) => event.stopPropagation()} style={{ position: 'absolute', bottom: -64, insetInline: 8, zIndex: 40, display: 'flex', justifyContent: 'center', gap: 8, padding: 6, borderRadius: 14, background: 'white', color: '#0f172a', boxShadow: '0 3px 14px #0004', pointerEvents: 'auto' }}>
          <button type="button" aria-label={t('editor.scaleDown')} onClick={() => persistGeometry(element, scaleElementGeometry({ x: element.x, y: element.y, w: element.w, h: element.h, rotation: element.rotation }, 0.9))} style={{ minWidth: 44, minHeight: 44, borderRadius: 10, background: '#e2e8f0', fontSize: 20 }}>−</button>
          <button type="button" aria-label={t('editor.scaleUp')} onClick={() => persistGeometry(element, scaleElementGeometry({ x: element.x, y: element.y, w: element.w, h: element.h, rotation: element.rotation }, 1.1))} style={{ minWidth: 44, minHeight: 44, borderRadius: 10, background: '#e2e8f0', fontSize: 20 }}>+</button>
          <button type="button" aria-label={t('editor.resetElement')} onClick={() => reset(element)} style={{ minHeight: 44, borderRadius: 10, padding: '0 14px', background: '#0e7490', color: 'white', fontWeight: 600 }}>{t('editor.resetElement')}</button>
        </div>;
      })()}
      {preview?.guides.map((guide, index) => <div key={`${guide.axis}-${index}`} data-testid="snap-guide" style={{ position: 'absolute', ...(guide.axis === 'x' ? { insetBlock: 0, left: `${guide.at * 100}%`, width: 1 } : { insetInline: 0, top: `${guide.at * 100}%`, height: 1 }), background: '#0ea5e9', pointerEvents: 'none' }} />)}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only" data-testid="canvas-live-announcement">{announcement}</div>
    </div>
  );
};
