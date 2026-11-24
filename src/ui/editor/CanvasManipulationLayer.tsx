import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { AspectClass, Slide } from '../../core/schema';
import { resolveSlideElements, snapElementGeometry, resizeElementGeometry, rotateElementGeometry, scaleElementGeometry, SLOT_SELECTORS, type ElementGeometry, type ResolvedElement } from '../../core/elementModel';
import { getLayoutArchetype } from '../../templates/layouts/registry';
import { useProjectStore } from '../../store/projectStore';
import { useSelectionStore } from '../../store/selectionStore';
import { useT, type TranslationKey } from '../../i18n';
import { RichTextEditor } from './RichTextEditor';
import { BrandOverridePopover } from './BrandOverridePopover';

interface CanvasManipulationLayerProps {
  slide: Slide;
  aspect: AspectClass;
  width: number;
  height: number;
  zoom: number;
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

interface NumericInspectorProps {
  element: ResolvedElement;
  zoom: number;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  onCommit: (field: 'x' | 'y' | 'w' | 'scale' | 'rotation' | 'opacity', value: number) => void;
  style?: React.CSSProperties;
}

const NumericInspector: React.FC<NumericInspectorProps> = ({ element, zoom, t, onCommit, style }) => {
  const currentScale = Math.round(
    element.kind === 'slot'
      ? (element.w / (element.frame?.inlineSize ?? element.w)) * 100
      : 100
  );
  const currentOpacity = Math.round((element.opacity ?? 1) * 100);

  const [localValues, setLocalValues] = useState<{
    x: string;
    y: string;
    w: string;
    scale: string;
    rotation: string;
    opacity: string;
  }>({
    x: String(Math.round(element.x * 100)),
    y: String(Math.round(element.y * 100)),
    w: String(Math.round(element.w * 100)),
    scale: String(currentScale || 100),
    rotation: String(Math.round(element.rotation || 0)),
    opacity: String(currentOpacity),
  });

  const [activeField, setActiveField] = useState<string | null>(null);

  useEffect(() => {
    if (activeField === null) {
      setLocalValues({
        x: String(Math.round(element.x * 100)),
        y: String(Math.round(element.y * 100)),
        w: String(Math.round(element.w * 100)),
        scale: String(currentScale || 100),
        rotation: String(Math.round(element.rotation || 0)),
        opacity: String(Math.round((element.opacity ?? 1) * 100)),
      });
    }
  }, [element.x, element.y, element.w, element.rotation, element.opacity, currentScale, activeField]);

  const handleFieldChange = (field: 'x' | 'y' | 'w' | 'scale' | 'rotation' | 'opacity', val: string) => {
    setLocalValues((prev) => ({ ...prev, [field]: val }));
    const num = parseFloat(val);
    if (Number.isFinite(num)) {
      let clamped = num;
      if (field === 'x' || field === 'y') clamped = Math.max(0, Math.min(98, num));
      if (field === 'w') clamped = Math.max(2, Math.min(100, num));
      if (field === 'scale') clamped = Math.max(20, Math.min(500, num));
      if (field === 'rotation') clamped = ((num % 360) + 360) % 360;
      if (field === 'opacity') clamped = Math.max(0, Math.min(100, num));
      onCommit(field, clamped);
    }
  };

  const commitField = (field: 'x' | 'y' | 'w' | 'scale' | 'rotation' | 'opacity') => {
    setActiveField(null);
    const num = parseFloat(localValues[field]);
    if (!Number.isFinite(num)) {
      // Revert to current value
      const fallback =
        field === 'x'
          ? Math.round(element.x * 100)
          : field === 'y'
          ? Math.round(element.y * 100)
          : field === 'w'
          ? Math.round(element.w * 100)
          : field === 'scale'
          ? currentScale
          : field === 'opacity'
          ? Math.round((element.opacity ?? 1) * 100)
          : Math.round(element.rotation);
      setLocalValues((prev) => ({ ...prev, [field]: String(fallback) }));
      return;
    }

    let clamped = num;
    if (field === 'x' || field === 'y') clamped = Math.max(0, Math.min(98, num));
    if (field === 'w') clamped = Math.max(2, Math.min(100, num));
    if (field === 'scale') clamped = Math.max(20, Math.min(500, num));
    if (field === 'rotation') clamped = ((num % 360) + 360) % 360;
    if (field === 'opacity') clamped = Math.max(0, Math.min(100, num));

    setLocalValues((prev) => ({ ...prev, [field]: String(Math.round(clamped)) }));
    onCommit(field, clamped);
  };

  return (
    <div
      data-testid="element-numeric-inspector"
      onPointerDown={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      style={{
        zIndex: 50,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        width: 380,
        maxWidth: 'min(380px, calc(100vw - 32px))',
        padding: 10,
        borderRadius: 12,
        background: 'white',
        color: '#0f172a',
        boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
        border: '1px solid #cbd5e1',
        transform: `scale(${1 / zoom})`,
        transformOrigin: 'top left',
        pointerEvents: 'auto',
        ...style,
      }}
    >
      {(['x', 'y', 'w', 'scale'] as const).map((field) => {
        const labelKey =
          field === 'x'
            ? 'editor.xPosition'
            : field === 'y'
            ? 'editor.yPosition'
            : field === 'w'
            ? 'editor.elementWidth'
            : 'editor.elementScale';
        return (
          <label key={field} style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 11, fontWeight: 600 }}>
            <span style={{ color: '#475569' }}>{t(labelKey)} (%)</span>
            <input
              aria-label={t(labelKey)}
              type="number"
              step="1"
              value={localValues[field]}
              onFocus={() => setActiveField(field)}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              onBlur={() => commitField(field)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                } else if (e.key === 'Escape') {
                  setActiveField(null);
                  e.currentTarget.blur();
                }
              }}
              style={{
                width: 64,
                minHeight: 32,
                border: '1px solid #94a3b8',
                borderRadius: 6,
                padding: '3px 6px',
                fontSize: 13,
                fontFamily: 'monospace',
                background: '#f8fafc',
              }}
            />
          </label>
        );
      })}
      <label style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 11, fontWeight: 600 }}>
        <span style={{ color: '#475569' }}>{t('editor.elementRotation')} (°)</span>
        <input
          aria-label={t('editor.elementRotation')}
          type="number"
          step="1"
          value={localValues.rotation}
          onFocus={() => setActiveField('rotation')}
          onChange={(e) => handleFieldChange('rotation', e.target.value)}
          onBlur={() => commitField('rotation')}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur();
            } else if (e.key === 'Escape') {
              setActiveField(null);
              e.currentTarget.blur();
            }
          }}
          style={{
            width: 64,
            minHeight: 32,
            border: '1px solid #94a3b8',
            borderRadius: 6,
            padding: '3px 6px',
            fontSize: 13,
            fontFamily: 'monospace',
            background: '#f8fafc',
          }}
        />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 11, fontWeight: 600 }}>
        <span style={{ color: '#475569' }}>{t('editor.elementOpacity')}</span>
        <input
          aria-label={t('editor.elementOpacity')}
          type="number"
          min="0"
          max="100"
          step="5"
          value={localValues.opacity}
          onFocus={() => setActiveField('opacity')}
          onChange={(e) => handleFieldChange('opacity', e.target.value)}
          onBlur={() => commitField('opacity')}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur();
            } else if (e.key === 'Escape') {
              setActiveField(null);
              e.currentTarget.blur();
            }
          }}
          style={{
            width: 64,
            minHeight: 32,
            border: '1px solid #94a3b8',
            borderRadius: 6,
            padding: '3px 6px',
            fontSize: 13,
            fontFamily: 'monospace',
            background: '#f8fafc',
          }}
        />
      </label>
    </div>
  );
};

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
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
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

  // F16: Outside click / tap and Escape deselects and closes floating edit panel
  useEffect(() => {
    if (!selectedId) return;

    const handleGlobalPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (
        target.closest('[data-testid="element-context-toolbar"]') ||
        target.closest('[data-testid="element-numeric-inspector"]') ||
        target.closest('[data-testid="mobile-selection-toolbar"]') ||
        target.closest('[data-testid^="element-hit-"]') ||
        target.closest('[data-testid^="resize-"]') ||
        target.closest('[data-testid^="rotate-"]') ||
        target.closest('[data-testid="brand-override-popover"]') ||
        target.closest('.brand-override-popover') ||
        target.closest('[data-testid="canvas-layers-panel"]') ||
        target.closest('[data-testid="layers-toggle"]') ||
        target.closest('[data-testid="element-menu-toggle"]')
      ) {
        return;
      }
      selectElement(undefined);
      setEditingId(null);
      setMenuOpenId(null);
    };

    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (editingId) {
          setEditingId(null);
        } else if (menuOpenId) {
          setMenuOpenId(null);
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
  }, [selectedId, editingId, menuOpenId, selectElement]);

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

  const applyNumericGeometry = (element: ResolvedElement, field: 'x' | 'y' | 'w' | 'scale' | 'rotation' | 'opacity', value: number) => {
    const prior = slide.overrides?.[aspect]?.[element.id];
    if (element.kind === 'slot') {
      const baseOverride = {
        dx: prior?.dx ?? 0,
        dy: prior?.dy ?? 0,
        scale: prior?.scale ?? 1,
        ...prior,
      };
      if (field === 'x') {
        const naturalX = element.frame?.inlineStart ?? (element.x - (prior?.dx ?? 0));
        const newDx = (value / 100) - naturalX;
        updateSlotOverride(slide.id, aspect, element.id, { ...baseOverride, dx: newDx });
      } else if (field === 'y') {
        const naturalY = element.frame?.blockStart ?? (element.y - (prior?.dy ?? 0));
        const newDy = (value / 100) - naturalY;
        updateSlotOverride(slide.id, aspect, element.id, { ...baseOverride, dy: newDy });
      } else if (field === 'w') {
        const newW = Math.max(0.02, Math.min(1, value / 100));
        updateSlotOverride(slide.id, aspect, element.id, { ...baseOverride, w: newW });
      } else if (field === 'scale') {
        const newScale = Math.max(0.2, Math.min(5, value / 100));
        updateSlotOverride(slide.id, aspect, element.id, { ...baseOverride, scale: newScale });
      } else if (field === 'rotation') {
        updateSlotOverride(slide.id, aspect, element.id, { ...baseOverride, rotation: ((value % 360) + 360) % 360 });
      } else if (field === 'opacity') {
        updateSlotOverride(slide.id, aspect, element.id, { ...baseOverride, opacity: Math.max(0, Math.min(1, value / 100)) });
      }
    } else if (element.extra) {
      if (field === 'x') updateExtraElement(slide.id, { ...element.extra, x: Math.max(0, Math.min(0.98, value / 100)) });
      else if (field === 'y') updateExtraElement(slide.id, { ...element.extra, y: Math.max(0, Math.min(0.98, value / 100)) });
      else if (field === 'w') updateExtraElement(slide.id, { ...element.extra, w: Math.max(0.02, Math.min(1, value / 100)) });
      else if (field === 'scale') {
        const currentW = element.extra.w || 0.2;
        const targetW = Math.max(0.02, Math.min(1, value / 100));
        const ratio = targetW / currentW;
        updateExtraElement(slide.id, { ...element.extra, w: targetW, h: Math.max(0.02, Math.min(1, (element.extra.h || 0.2) * ratio)) });
      } else if (field === 'rotation') {
        updateExtraElement(slide.id, { ...element.extra, rotation: ((value % 360) + 360) % 360 });
      } else if (field === 'opacity') {
        updateExtraElement(slide.id, { ...element.extra, opacity: Math.max(0, Math.min(1, value / 100)) });
      }
    }
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
              const target = event.target as HTMLElement;
              const avatar =
                target.closest('.sig-avatar-ring, .cta-avatar-ring') ||
                (typeof document !== 'undefined' && document.elementsFromPoint
                  ? document
                      .elementsFromPoint(event.clientX, event.clientY)
                      .find((el) => el.closest('.sig-avatar-ring, .cta-avatar-ring'))
                      ?.closest<HTMLElement>('.sig-avatar-ring, .cta-avatar-ring')
                  : null);
              if (avatar) {
                event.stopPropagation();
                (avatar as HTMLElement).click();
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
                  <BrandOverridePopover
                    zoom={zoom}
                    position={shown.y < 0.3 ? 'bottom' : 'top'}
                    onClose={() => selectElement()}
                  />
                  <button aria-label={t('editor.resizeElement')} data-testid={`resize-${element.id}`} onPointerDown={(event) => begin(event, element, 'resize')} onClick={(event) => event.stopPropagation()} style={{ position: 'absolute', right: -22, bottom: -22, width: 44, height: 44, padding: 0, border: '2px solid white', borderRadius: 22, background: '#0891b2', pointerEvents: 'auto', touchAction: 'none', cursor: 'nwse-resize' }} />
                </>
              ) : (
                <>
                  {/* D4: Small icon button to open/close the element menu. Menu does NOT open automatically. */}
                  {!touchLayout && (() => {
                    const placeAbove = shown.y > 0.35;
                    const isMenuOpen = menuOpenId === element.id;
                    return (
                      <>
                        {/* Menu toggle icon — always visible when selected, opens menu on click */}
                        <button
                          type="button"
                          data-testid="element-menu-toggle"
                          aria-label={t('editor.selectionToolbar')}
                          title={t('editor.selectionToolbar')}
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(isMenuOpen ? null : element.id);
                          }}
                          onPointerDown={(e) => e.stopPropagation()}
                          style={{
                            position: 'absolute',
                            top: placeAbove ? -40 : 'calc(100% + 4px)',
                            insetInlineStart: 0,
                            zIndex: 56,
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            background: isMenuOpen ? '#0891b2' : 'white',
                            color: isMenuOpen ? 'white' : '#0f172a',
                            border: '1px solid #cbd5e1',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                            cursor: 'pointer',
                            pointerEvents: 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transform: `scale(${1 / zoom})`,
                            transformOrigin: placeAbove ? 'bottom left' : 'top left',
                          }}
                        >
                          <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <circle cx="12" cy="5" r="1.5" fill="currentColor" />
                            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                            <circle cx="12" cy="19" r="1.5" fill="currentColor" />
                          </svg>
                        </button>

                        {isMenuOpen && (
                          <>
                            <div
                              data-testid="element-context-toolbar"
                              role="toolbar"
                              aria-label={t('editor.selectionToolbar')}
                              onPointerDown={(event) => event.stopPropagation()}
                              style={{
                                position: 'absolute',
                                top: placeAbove ? -48 : 'calc(100% + 8px)',
                                insetInlineStart: 40,
                                zIndex: 55,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: 4,
                                borderRadius: 10,
                                background: 'white',
                                color: '#0f172a',
                                boxShadow: '0 4px 18px rgba(0,0,0,0.15)',
                                border: '1px solid #cbd5e1',
                                pointerEvents: 'auto',
                                transform: `scale(${1 / zoom})`,
                                transformOrigin: placeAbove ? 'bottom left' : 'top left',
                              }}
                            >
                              {/* Lock / Unlock button */}
                              <button
                                type="button"
                                aria-label={t(element.locked ? 'editor.unlockLayer' : 'editor.lockLayer', { id: element.id })}
                                title={t(element.locked ? 'editor.unlockLayer' : 'editor.lockLayer', { id: element.id })}
                                onClick={() => setLayerState(element, { locked: !element.locked })}
                                style={{ width: 36, height: 36, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', color: '#334155' }}
                              >
                                {element.locked ? (
                                  <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                  </svg>
                                ) : (
                                  <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                                  </svg>
                                )}
                              </button>

                              {/* Hide / Show (Eye) button */}
                              <button
                                type="button"
                                aria-label={t(element.hidden ? 'editor.showLayer' : 'editor.hideLayer', { id: element.id })}
                                title={t(element.hidden ? 'editor.showLayer' : 'editor.hideLayer', { id: element.id })}
                                onClick={() => setLayerState(element, { hidden: !element.hidden })}
                                style={{ width: 36, height: 36, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', color: '#334155' }}
                              >
                                {element.hidden ? (
                                  <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                    <line x1="1" y1="1" x2="23" y2="23" />
                                  </svg>
                                ) : (
                                  <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                  </svg>
                                )}
                              </button>

                              {/* Edit Text (Pencil) button */}
                              {isTextElement && (
                                <button
                                  type="button"
                                  aria-label={t('editor.editText')}
                                  title={t('editor.editText')}
                                  data-testid={`edit-text-btn-${element.id}`}
                                  onClick={(e) => { e.stopPropagation(); setEditingId(element.id); setMenuOpenId(null); }}
                                  style={{ width: 36, height: 36, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', color: '#334155' }}
                                >
                                  <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                </button>
                              )}

                              {element.extra && (
                                <>
                                  <button
                                    type="button"
                                    aria-label={t('editor.duplicateElement')}
                                    title={t('editor.duplicateElement')}
                                    onClick={() => {
                                      const duplicate = { ...element.extra!, id: `${element.id}_copy_${Date.now().toString(36)}`, x: Math.min(1 - element.w, element.x + 0.02), y: Math.min(1 - element.h, element.y + 0.02), z: element.extra!.z + 1 };
                                      addExtraElement(slide.id, duplicate);
                                      selectElement(duplicate.id);
                                      setMenuOpenId(null);
                                    }}
                                    style={{ width: 36, height: 36, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', color: '#334155', fontSize: 16, fontWeight: 700 }}
                                  >
                                    ＋
                                  </button>
                                  <button
                                    type="button"
                                    aria-label={t('editor.deleteElement')}
                                    title={t('editor.deleteElement')}
                                    onClick={() => { deleteExtraElement(slide.id, element.id); selectElement(); setMenuOpenId(null); }}
                                    style={{ width: 36, height: 36, borderRadius: 8, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', color: '#b91c1c', fontSize: 16, fontWeight: 700 }}
                                  >
                                    ×
                                  </button>
                                </>
                              )}

                              <button
                                type="button"
                                aria-label={t('editor.resetElement')}
                                title={t('editor.resetElement')}
                                data-testid={`reset-${element.id}`}
                                onPointerDown={(event) => event.stopPropagation()}
                                onClick={(event) => { event.stopPropagation(); reset(element); setMenuOpenId(null); }}
                                style={{ minHeight: 32, padding: '0 8px', borderRadius: 6, background: '#0e7490', color: 'white', fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                              >
                                <span>↺</span>
                                <span>{t('editor.resetElement')}</span>
                              </button>
                            </div>

                            <NumericInspector
                              element={element}
                              zoom={zoom}
                              t={t}
                              onCommit={(field, value) => applyNumericGeometry(element, field, value)}
                              style={{
                                position: 'absolute',
                                top: placeAbove ? -148 : 'calc(100% + 56px)',
                                insetInlineStart: 0,
                              }}
                            />
                          </>
                        )}
                      </>
                    );
                  })()}

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
                        transform: 'translateX(-50%)',
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
