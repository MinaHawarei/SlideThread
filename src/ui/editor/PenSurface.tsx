import React, { useEffect, useRef, useState } from 'react';
import { useProjectStore, useActiveSlide } from '../../store/projectStore';
import { useSelectionStore } from '../../store/selectionStore';
import { freehandToPath, type Pt } from '../../core/freehand';
import type { ExtraElement } from '../../core/schema';

/** Transparent drawing surface over the slide. Each pointer stroke becomes an editable path shape. */
export const PenSurface: React.FC = () => {
  const slide = useActiveSlide();
  const primary = useProjectStore((state) => state.project.primaryColor);
  const addExtraElement = useProjectStore((state) => state.addExtraElement);
  const selectElement = useSelectionStore((state) => state.selectElement);
  const setPenActive = useSelectionStore((state) => state.setPenActive);
  const surface = useRef<HTMLDivElement>(null);
  const trail = useRef<Pt[]>([]);
  const [live, setLive] = useState<Pt[]>([]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setPenActive(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setPenActive]);

  const toPoint = (event: React.PointerEvent): Pt => {
    const rect = surface.current!.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
    };
  };

  const finish = () => {
    const stroke = trail.current;
    trail.current = [];
    setLive([]);
    if (!slide) return;
    const result = freehandToPath(stroke);
    if (!result) return;
    const color = primary || '#0891b2';
    const extra: ExtraElement = {
      id: `pen_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      kind: 'shape',
      shape: 'path',
      path: { closed: false, points: result.points },
      x: result.x, y: result.y, w: result.w, h: result.h,
      rotation: 0,
      z: (slide.extras?.length ?? 0) + 1,
      locked: false,
      fill: color,
      strokeColor: color,
      strokeWidth: 6,
    };
    addExtraElement(slide.id, extra);
    selectElement(undefined);
  };

  const d = live.length > 1 ? `M ${live.map((p) => `${p.x * 100} ${p.y * 100}`).join(' L ')}` : '';

  return (
    <div
      ref={surface}
      data-testid="pen-draw-surface"
      aria-label="Freehand pen: drag on the slide to draw. Press Escape to stop."
      onPointerDown={(event) => {
        event.stopPropagation();
        (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
        trail.current = [toPoint(event)];
        setLive(trail.current);
      }}
      onPointerMove={(event) => {
        if (!trail.current.length) return;
        trail.current = [...trail.current, toPoint(event)];
        setLive(trail.current);
      }}
      onPointerUp={finish}
      onPointerCancel={finish}
      style={{ position: 'absolute', inset: 0, zIndex: 60, pointerEvents: 'auto', cursor: 'crosshair', touchAction: 'none', outline: '2px dashed #0891b2', outlineOffset: -2 }}
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', pointerEvents: 'none' }}>
        {d && <path d={d} fill="none" stroke={primary || '#0891b2'} strokeWidth={6} vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />}
      </svg>
    </div>
  );
};
