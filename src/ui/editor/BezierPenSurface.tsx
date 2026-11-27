import React, { useEffect, useRef, useState } from 'react';
import { useProjectStore, useActiveSlide } from '../../store/projectStore';
import { useSelectionStore } from '../../store/selectionStore';
import { buildBezierPath, type PenAnchor } from '../../core/bezierPen';
import type { ExtraElement } from '../../core/schema';

const CLOSE_RADIUS_PX = 14;
const DRAG_THRESHOLD_PX = 4;

/**
 * Bezier pen: click places an anchor, click-drag pulls out symmetric curve handles, clicking the first
 * anchor closes the path, Enter or the Done button finishes, Esc cancels, Backspace removes the last anchor.
 * Taps work the same way on touch screens, which also get on-screen Done / Close / Undo / Cancel buttons.
 */
export const BezierPenSurface: React.FC = () => {
  const slide = useActiveSlide();
  const primary = useProjectStore((state) => state.project.primaryColor);
  const addExtraElement = useProjectStore((state) => state.addExtraElement);
  const selectElement = useSelectionStore((state) => state.selectElement);
  const setPenMode = useSelectionStore((state) => state.setPenMode);
  const surface = useRef<HTMLDivElement>(null);
  const [anchors, setAnchors] = useState<PenAnchor[]>([]);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const anchorsRef = useRef<PenAnchor[]>([]);
  const drag = useRef<{ index: number; startX: number; startY: number; moved: boolean } | null>(null);
  const color = primary || '#0891b2';

  const commit = (next: PenAnchor[]) => { anchorsRef.current = next; setAnchors(next); };

  const finish = (closed: boolean) => {
    const result = buildBezierPath(anchorsRef.current, closed);
    commit([]);
    if (!slide || !result) return;
    const extra: ExtraElement = {
      id: `bezier_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      kind: 'shape',
      shape: 'path',
      path: { closed: result.closed, points: result.points },
      x: result.x, y: result.y, w: result.w, h: result.h,
      rotation: 0,
      z: (slide.extras?.length ?? 0) + 1,
      locked: false,
      fill: color,
      strokeColor: color,
      strokeWidth: 6,
      ...(result.closed ? { innerFill: 'none' } : {}),
    };
    addExtraElement(slide.id, extra);
    selectElement(extra.id);
    setPenMode('off');
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { commit([]); setPenMode('off'); }
      else if (event.key === 'Enter') { event.preventDefault(); finish(false); }
      else if (event.key === 'Backspace') { event.preventDefault(); commit(anchorsRef.current.slice(0, -1)); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slide?.id]);

  const toPoint = (event: React.PointerEvent) => {
    const rect = surface.current!.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
      rect,
    };
  };

  const onPointerDown = (event: React.PointerEvent) => {
    event.stopPropagation();
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    const { x, y, rect } = toPoint(event);
    const list = anchorsRef.current;
    const first = list[0];
    if (first && list.length > 2 && Math.hypot((x - first.x) * rect.width, (y - first.y) * rect.height) < CLOSE_RADIUS_PX) {
      finish(true);
      return;
    }
    const next = [...list, { x, y }];
    commit(next);
    drag.current = { index: next.length - 1, startX: event.clientX, startY: event.clientY, moved: false };
  };

  const onPointerMove = (event: React.PointerEvent) => {
    const { x, y } = toPoint(event);
    setHover({ x, y });
    const d = drag.current;
    if (!d) return;
    if (!d.moved && Math.hypot(event.clientX - d.startX, event.clientY - d.startY) < DRAG_THRESHOLD_PX) return;
    d.moved = true;
    const list = anchorsRef.current.map((a, i) => (i === d.index ? { ...a, outX: x, outY: y, inX: 2 * a.x - x, inY: 2 * a.y - y } : a));
    commit(list);
  };

  const onPointerUp = () => { drag.current = null; };

  const toD = () => {
    if (anchors.length === 0) return '';
    let d = `M ${anchors[0]!.x * 100} ${anchors[0]!.y * 100}`;
    for (let i = 1; i < anchors.length; i++) {
      const a = anchors[i - 1]!, b = anchors[i]!;
      const c1 = a.outX !== undefined ? `${a.outX * 100} ${a.outY! * 100}` : `${a.x * 100} ${a.y * 100}`;
      const c2 = b.inX !== undefined ? `${b.inX * 100} ${b.inY! * 100}` : `${b.x * 100} ${b.y * 100}`;
      d += ` C ${c1} ${c2} ${b.x * 100} ${b.y * 100}`;
    }
    return d;
  };

  const button = (label: string, testId: string, onClick: () => void, disabled = false) => (
    <button
      type="button"
      data-testid={testId}
      disabled={disabled}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => { event.stopPropagation(); onClick(); }}
      style={{ minHeight: 40, padding: '0 12px', borderRadius: 10, background: disabled ? '#cbd5e1' : '#0e7490', color: 'white', fontWeight: 600, fontSize: 13 }}
    >{label}</button>
  );

  return (
    <div
      ref={surface}
      data-testid="bezier-pen-surface"
      aria-label="Pen tool: click to place points, drag to curve, click the first point to close, Enter to finish, Esc to cancel."
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={() => setHover(null)}
      onDoubleClick={() => finish(false)}
      style={{ position: 'absolute', inset: 0, zIndex: 60, pointerEvents: 'auto', cursor: 'crosshair', touchAction: 'none', outline: '2px dashed #f59e0b', outlineOffset: -2 }}
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
        <path d={toD()} fill="none" stroke={color} strokeWidth={4} vectorEffect="non-scaling-stroke" strokeLinecap="round" />
        {anchors.length > 0 && hover && !drag.current && (
          <line x1={anchors[anchors.length - 1]!.x * 100} y1={anchors[anchors.length - 1]!.y * 100} x2={hover.x * 100} y2={hover.y * 100} stroke={color} strokeWidth={2} strokeDasharray="4 4" vectorEffect="non-scaling-stroke" opacity={0.6} />
        )}
        {anchors.map((a, i) => (
          <g key={i}>
            {a.outX !== undefined && (
              <>
                <line x1={a.inX! * 100} y1={a.inY! * 100} x2={a.outX * 100} y2={a.outY! * 100} stroke="#f59e0b" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
              </>
            )}
          </g>
        ))}
      </svg>
      {anchors.map((a, i) => (
        <span
          key={i}
          data-testid={`bezier-anchor-${i}`}
          style={{ position: 'absolute', left: `${a.x * 100}%`, top: `${a.y * 100}%`, width: i === 0 ? 14 : 10, height: i === 0 ? 14 : 10, transform: 'translate(-50%, -50%)', background: i === 0 ? '#f59e0b' : 'white', border: '2px solid #0e7490', borderRadius: i === 0 ? 7 : 2, pointerEvents: 'none' }}
        />
      ))}
      <div style={{ position: 'absolute', left: 8, right: 8, bottom: 8, display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', pointerEvents: 'auto' }}>
        {button('Done', 'bezier-done', () => finish(false), anchors.length < 2)}
        {button('Close shape', 'bezier-close', () => finish(true), anchors.length < 3)}
        {button('Undo point', 'bezier-undo', () => commit(anchors.slice(0, -1)), anchors.length === 0)}
        {button('Cancel', 'bezier-cancel', () => { commit([]); setPenMode('off'); })}
      </div>
    </div>
  );
};
