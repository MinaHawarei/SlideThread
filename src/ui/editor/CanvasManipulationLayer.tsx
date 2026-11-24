import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { AspectClass, Slide } from '../../core/schema';
import { resolveSlideElements, snapElementGeometry, resizeElementGeometry, rotateElementGeometry, scaleElementGeometry, SLOT_SELECTORS, type ElementGeometry, type ResolvedElement } from '../../core/elementModel';
import { getLayoutArchetype } from '../../templates/layouts/registry';
import { useProjectStore } from '../../store/projectStore';
import { useSelectionStore } from '../../store/selectionStore';
import { useT } from '../../i18n';
import { RichTextEditor } from './RichTextEditor';
import { BrandOverridePopover } from './BrandOverridePopover';

interface CanvasManipulationLayerProps {
  slide: Slide;
  aspect: AspectClass;
  width: number;
  height: number;
  zoom: number;
  hideBrandPopover?: boolean;
}


type Gesture = {
  pointerIds: number[];
  startX: number;
  startY: number;
  startAngle: number;
  startDistance: number;
  initial: ElementGeometry;
  mode: 'move' | 'resize' | 'rotate' | 'pinch';
  hasMoved: boolean;
};

export const CanvasManipulationLayer: React.FC<CanvasManipulationLayerProps> = ({ slide, aspect, width, height, zoom, hideBrandPopover = false }) => {
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

  // Outside click / tap and Escape deselects
  useEffect(() => {
    if (!selectedId) return;

    const handleGlobalPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (
        target.closest('[data-testid="mobile-selection-toolbar"]') ||
        target.closest('[data-testid^="element-hit-"]') ||
        target.closest('[data-testid^="resize-"]') ||
        target.closest('[data-testid^="rotate-"]') ||
        target.closest('[data-testid="brand-override-popover"]') ||
        target.closest('.brand-override-popover') ||
        target.closest('[data-testid="inspector"]') ||
        target.closest('[data-testid="element-properties-panel"]') ||
        target.closest('[data-testid="layers-panel"]') ||
        target.closest('[data-testid="mobile-bottom-tabs"]') ||
        target.closest('[data-testid="mobile-bottom-sheet"]')
      ) {
        return;
      }
      selectElement(undefined);
      setEditingId(null);
    };

    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (editingId) {
          setEditingId(null);
        } else {
          selectElement(undefined);
        }
      }
    };

    window.addEventListener('pointerdown', handleGlobalPointerDown);
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handleGlobalPointerDown);
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [selectedId, editingId, selectElement]);

  useLayoutEffect(() => {
    const stage = layerRef.current?.parentElement;
    const overlayRect = layerRef.current?.getBoundingClientRect();
    const canvas = stage?.querySelector<HTMLElement>('.slide-canvas');
    if (!overlayRect?.width || !overlayRect.height || !canvas) return;
    const measured: Record<string, ElementGeometry> = {};
    for (const [id, selector] of Object.entries(SLOT_SELECTORS)) {
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

  // F15 & F17: Compute overrides relative to the element's actual position
  const persistGeometry = (element: ResolvedElement, geometry: ElementGeometry) => {
    if (element.kind === 'slot' && element.frame) {
      const prior = slide.overrides?.[aspect]?.[element.id];
      const naturalX = element.x - (prior?.dx ?? 0);
      const naturalY = element.y - (prior?.dy ?? 0);
      updateSlotOverride(slide.id, aspect, element.id, {
        ...prior,
        dx: geometry.x - naturalX,
        dy: geometry.y - naturalY,
        scale: prior?.scale ?? 1,
        w: geometry.w,
        h: geometry.h,
        rotation: geometry.rotation,
      });
    } else if (element.extra) {
      updateExtraElement(slide.id, {
        ...element.extra,
        x: geometry.x,
        y: geometry.y,
        w: geometry.w,
        h: geometry.h,
        rotation: geometry.rotation,
      });
    }
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
        gesture.current = {
          pointerIds: [...active.pointerIds, event.pointerId],
          startX: (first.x + event.clientX) / 2,
          startY: (first.y + event.clientY) / 2,
          startAngle: Math.atan2(dy, dx),
          startDistance: Math.hypot(dx, dy),
          initial: active.initial,
          mode: 'pinch',
          hasMoved: false,
        };
        try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Synthetic pointer events do not have an active pointer to capture. */ }
        return;
      }
    }
    gesture.current = {
      pointerIds: [event.pointerId],
      startX: event.clientX,
      startY: event.clientY,
      startAngle,
      startDistance: 0,
      initial,
      mode,
      hasMoved: false,
    };
  };

  const move = (event: React.PointerEvent<HTMLElement>, element: ResolvedElement) => {
    const active = gesture.current;
    if (!active || !active.pointerIds.includes(event.pointerId)) return;
    activePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const rect = event.currentTarget.closest('[data-testid="manipulation-layer"]')?.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height) return;

    const dist = Math.hypot(event.clientX - active.startX, event.clientY - active.startY);
    if (dist > 3) {
      active.hasMoved = true;
    }

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
      let newAngle = active.initial.rotation + ((angle - active.startAngle) * 180) / Math.PI;
      if (event.shiftKey) {
        newAngle = Math.round(newAngle / 15) * 15;
      }
      geometry = rotateElementGeometry(active.initial, newAngle);
    }
    const snapped = active.mode === 'move' ? snapElementGeometry(geometry, 6 / Math.max(width, height)) : { geometry, guides: [] };
    setPreview({ id: element.id, ...snapped });
  };

  const end = (event: React.PointerEvent<HTMLElement>, element: ResolvedElement) => {
    const active = gesture.current;
    if (!active || !active.pointerIds.includes(event.pointerId)) return;
    activePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    // F15: Selecting without drag must NEVER persist overrides or move element
    if (!active.hasMoved && active.mode === 'move') {
      activePointers.current.delete(event.pointerId);
      gesture.current = undefined;
      setPreview(undefined);
      return;
    }

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
        let newAngle = active.initial.rotation + ((angle - active.startAngle) * 180) / Math.PI;
        if (event.shiftKey) {
          newAngle = Math.round(newAngle / 15) * 15;
        }
        geometry = rotateElementGeometry(active.initial, newAngle);
      }
      if (active.mode === 'move') geometry = snapElementGeometry(geometry, 6 / Math.max(width, height)).geometry;
      persistGeometry(element, geometry);
    }
    activePointers.current.delete(event.pointerId);
    if (active.pointerIds.length > 1 && active.pointerIds.some((id) => id !== event.pointerId)) {
      const remaining = active.pointerIds.find((id) => id !== event.pointerId)!;
      const point = activePointers.current.get(remaining);
      if (point) gesture.current = { pointerIds: [remaining], startX: point.x, startY: point.y, startAngle: active.startAngle, startDistance: 0, initial: preview?.geometry ?? active.initial, mode: 'move', hasMoved: true };
      else gesture.current = undefined;
    } else gesture.current = undefined;
    setPreview(undefined);
  };

  const reset = (element: ResolvedElement) => {
    if (element.kind === 'slot') {
      const prior = slide.overrides?.[aspect]?.[element.id];
      const hasLayerState = prior?.z !== undefined || prior?.locked !== undefined || prior?.hidden !== undefined;
      if (!hasLayerState) {
        updateSlotOverride(slide.id, aspect, element.id, undefined);
      } else {
        updateSlotOverride(slide.id, aspect, element.id, {
          dx: 0,
          dy: 0,
          scale: 1,
          w: undefined,
          h: undefined,
          rotation: 0,
          opacity: 1,
          ...(prior?.z !== undefined ? { z: prior.z } : {}),
          ...(prior?.locked !== undefined ? { locked: prior.locked } : {}),
          ...(prior?.hidden !== undefined ? { hidden: prior.hidden } : {}),
        });
      }
    } else if (element.extra) {
      updateExtraElement(slide.id, { ...element.extra, rotation: 0, opacity: 1 });
    }
  };

  return (
    <div ref={layerRef} aria-label={t('editor.manipulationOverlay')} data-testid="manipulation-layer" onTouchStart={(event) => event.stopPropagation()} onTouchMove={(event) => event.stopPropagation()} onTouchEnd={(event) => event.stopPropagation()} style={{ position: 'absolute', inset: 0, width, height, zIndex: 20, pointerEvents: 'none' }}>
      {elements.filter((item) => !item.hidden).map((modelElement) => {
        const element = measuredGeometry[modelElement.id]
          ? {
              ...modelElement,
              ...measuredGeometry[modelElement.id],
              rotation: slide.overrides?.[aspect]?.[modelElement.id]?.rotation ?? modelElement.rotation ?? 0,
            }
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
            role="group" className="transition-all hover:ring-2 hover:ring-amber-400/50 hover:ring-offset-1 rounded-sm"
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
            style={{ position: 'absolute', zIndex: isCurrentlyEditing ? 35 : isSelected ? 25 : 20, left: `${shown.x * 100}%`, top: `${shown.y * 100}%`, width: `${shown.w * 100}%`, height: `${shown.h * 100}%`, minWidth: 24, minHeight: 24, transform: `rotate(${shown.rotation}deg)`, transformOrigin: 'center', border: isSelected ? '2px solid #0891b2' : '1px solid transparent', background: isSelected ? '#06b6d40d' : 'transparent', pointerEvents: 'auto', touchAction: touchLayout ? 'none' : undefined, cursor: element.locked ? 'default' : isCurrentlyEditing ? 'text' : 'move', boxSizing: 'border-box' }}
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
                style={{
                  // D3: scale the editor back up by 1/zoom so text is always readable regardless of canvas zoom
                  transform: `scale(${1 / zoom})`,
                  transformOrigin: 'top left',
                  width: `${zoom * 100}%`,
                  height: `${zoom * 100}%`,
                  minWidth: `min(${zoom * 100}%, calc(100vw - 32px))`,
                  minHeight: `${Math.max(80, 80 * zoom)}px`,
                  fontSize: `${Math.max(16, 16 * zoom)}px`,
                }}
              />
            ) : (
              isSelected && !element.locked && <>
              {element.id === 'signature' ? (
                <>
                  {!hideBrandPopover && !touchLayout && (
                    <BrandOverridePopover
                      zoom={zoom}
                      position={shown.y < 0.3 ? 'bottom' : 'top'}
                      onClose={() => selectElement()}
                    />
                  )}
                  <button aria-label={t('editor.resizeElement')} data-testid={`resize-${element.id}`} onPointerDown={(event) => begin(event, element, 'resize')} onClick={(event) => event.stopPropagation()} style={{ position: 'absolute', right: -22, bottom: -22, width: 44, height: 44, padding: 0, border: '2px solid white', borderRadius: 22, background: '#0891b2', pointerEvents: 'auto', touchAction: 'none', cursor: 'nwse-resize' }} />
                </>
              ) : (
                <>
                  {/* Corner Resize Handle */}
                  <button
                    aria-label={t('editor.resizeElement')}
                    title={t('editor.resizeElement')}
                    data-testid={`resize-${element.id}`}
                    onPointerDown={(event) => begin(event, element, 'resize')}
                    onClick={(event) => event.stopPropagation()}
                    style={{
                      position: 'absolute',
                      right: -16,
                      bottom: -16,
                      width: 32,
                      height: 32,
                      padding: 0,
                      border: '2px solid white',
                      borderRadius: 16,
                      background: '#0891b2',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                      pointerEvents: 'auto',
                      touchAction: 'none',
                      cursor: 'nwse-resize',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transform: `rotate(-${shown.rotation}deg)`,
                      transformOrigin: 'center',
                    }}
                  >
                    <svg style={{ width: 14, height: 14, color: 'white' }} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <polyline points="15 3 21 3 21 9" />
                      <polyline points="9 21 3 21 3 15" />
                      <line x1="21" y1="3" x2="14" y2="10" />
                      <line x1="3" y1="21" x2="10" y2="14" />
                    </svg>
                  </button>

                  {/* Top Rotation Handle for elements that support rotation */}
                  {!element.locked && (
                    <button
                      aria-label={t('editor.rotateElement')}
                      title={t('editor.rotateElement')}
                      data-testid={`rotate-${element.id}`}
                      onPointerDown={(event) => begin(event, element, 'rotate')}
                      onClick={(event) => event.stopPropagation()}
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: -36,
                        transform: `translateX(-50%) rotate(-${shown.rotation}deg)`,
                        transformOrigin: 'center',
                        width: 32,
                        height: 32,
                        padding: 0,
                        border: '2px solid white',
                        borderRadius: 16,
                        background: '#7c3aed',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                        pointerEvents: 'auto',
                        touchAction: 'none',
                        cursor: 'grab',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <svg style={{ width: 16, height: 16, color: 'white' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M21.5 2v6h-6" />
                        <path d="M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                      </svg>
                    </button>
                  )}
                </>
              )}
            </>
            )}
          </div>
        );
      })}
      {touchLayout && elements.find((element) => element.id === selectedId && !element.locked && !element.hidden && element.id !== 'signature') && (() => {
        const element = elements.find((item) => item.id === selectedId)!;
        return <div data-testid="mobile-selection-toolbar" role="toolbar" aria-label={t('editor.manipulationOverlay')} onPointerDown={(event) => event.stopPropagation()} style={{ position: 'absolute', bottom: -64, insetInline: 8, zIndex: 40, display: 'flex', justifyContent: 'center', gap: 8, padding: 6, borderRadius: 14, background: 'white', color: '#0f172a', boxShadow: '0 3px 14px #0004', pointerEvents: 'auto' }}>
          <button type="button" aria-label={t('editor.scaleDown')} onClick={() => persistGeometry(element, scaleElementGeometry({ x: element.x, y: element.y, w: element.w, h: element.h, rotation: element.rotation }, 0.9))} style={{ minWidth: 44, minHeight: 44, borderRadius: 10, background: '#e2e8f0', fontSize: 20 }}>−</button>
          <button type="button" aria-label={t('editor.scaleUp')} onClick={() => persistGeometry(element, scaleElementGeometry({ x: element.x, y: element.y, w: element.w, h: element.h, rotation: element.rotation }, 1.1))} style={{ minWidth: 44, minHeight: 44, borderRadius: 10, background: '#e2e8f0', fontSize: 20 }}>+</button>
          <button type="button" aria-label={t('editor.resetElement')} onClick={() => reset(element)} style={{ minHeight: 44, borderRadius: 10, padding: '0 14px', background: '#0e7490', color: 'white', fontWeight: 600 }}>{t('editor.resetElement')}</button>
        </div>;
      })()}
      {preview?.guides.map((guide, index) => (
        <div
          key={`${guide.axis}-${index}`}
          data-testid="snap-guide"
          className="animate-in fade-in duration-100 transition-opacity"
          style={{
            position: 'absolute',
            ...(guide.axis === 'x'
              ? { insetBlock: 0, left: `${guide.at * 100}%`, width: 1.5 }
              : { insetInline: 0, top: `${guide.at * 100}%`, height: 1.5 }),
            background: 'linear-gradient(to bottom, #d97706, #f59e0b, #d97706)',
            boxShadow: '0 0 6px 1px rgba(245, 158, 11, 0.65)',
            pointerEvents: 'none',
            zIndex: 40,
          }}
        />
      ))}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only" data-testid="canvas-live-announcement">{announcement}</div>
    </div>
  );
};
