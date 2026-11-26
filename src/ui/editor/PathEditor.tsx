import React, { useRef, useState } from 'react';
import type { VectorPath } from '../../core/schema';
import { hasHandles, insertPoint, moveHandle, movePoint, pathToD, removePoint, setClosed, toggleSmooth, MIN_POINTS } from '../../core/vectorPath';
import { useT } from '../../i18n';

const SIZE = 240;

interface PathEditorProps {
  path: VectorPath;
  color: string;
  onChange: (next: VectorPath) => void;
}

type Drag = { kind: 'point'; index: number } | { kind: 'in' | 'out'; index: number } | null;

/** Node editor: drag anchors and Bezier handles, click the grid to add a point, toggle smooth/corner, delete, close. */
export const PathEditor: React.FC<PathEditorProps> = ({ path, color, onChange }) => {
  const { t } = useT();
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<Drag>(null);
  const [selected, setSelected] = useState(0);
  const sel = Math.min(selected, path.points.length - 1);

  const toUnit = (e: React.PointerEvent | PointerEvent) => {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  };

  const startDrag = (d: NonNullable<Drag>) => (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    drag.current = d;
    setSelected(d.index);
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  };

  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const { x, y } = toUnit(e);
    if (d.kind === 'point') onChange(movePoint(path, d.index, x, y));
    else onChange(moveHandle(path, d.index, d.kind, x, y, !e.altKey));
  };
  const endDrag = () => { drag.current = null; };

  const addAt = (e: React.PointerEvent) => {
    const { x, y } = toUnit(e);
    // Insert after the nearest anchor segment so the order of the shape stays natural.
    let best = path.points.length - 1;
    let bestD = Infinity;
    for (let i = 0; i < path.points.length - 1; i++) {
      const a = path.points[i]!, b = path.points[i + 1]!;
      const dx = b.x - a.x, dy = b.y - a.y;
      const len2 = dx * dx + dy * dy || 1;
      const u = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / len2));
      const dist = Math.hypot(x - (a.x + u * dx), y - (a.y + u * dy));
      if (dist < bestD) { bestD = dist; best = i; }
    }
    const firstPt = path.points[0]!, lastPt = path.points[path.points.length - 1]!;
    const endDist = Math.min(Math.hypot(x - firstPt.x, y - firstPt.y), Math.hypot(x - lastPt.x, y - lastPt.y));
    const afterIndex = endDist < bestD ? undefined : best;
    const next = insertPoint(path, x, y, afterIndex);
    onChange(next);
    setSelected(afterIndex === undefined ? next.points.length - 1 : afterIndex + 1);
  };

  const d = pathToD(path, SIZE, SIZE);
  const sp = path.points[sel];

  return (
    <div data-testid="path-editor" className="space-y-2 pt-2 border-t border-stone-200 dark:border-stone-800">
      <div className="text-xs font-semibold text-stone-700 dark:text-stone-300">{t('editor.pathEditor')}</div>
      <p className="text-[11px] text-stone-500">{t('editor.pathEditorHint')}</p>
      <svg
        ref={svgRef}
        data-testid="path-editor-surface"
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        width="100%"
        style={{ aspectRatio: '1 / 1', touchAction: 'none', background: 'repeating-conic-gradient(#e7e5e4 0% 25%, #fafaf9 0% 50%) 0 0 / 20px 20px', borderRadius: 8 }}
        onPointerDown={addAt}
        onPointerMove={onMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <path d={d} fill={path.closed ? color : 'none'} fillOpacity={path.closed ? 0.25 : 0} stroke={color} strokeWidth={2} pointerEvents="none" />
        {path.points.map((p, i) => (
          hasHandles(p) && i === sel ? (
            <g key={`h${i}`}>
              {p.inX !== undefined && p.inY !== undefined && (
                <>
                  <line x1={p.x * SIZE} y1={p.y * SIZE} x2={p.inX * SIZE} y2={p.inY * SIZE} stroke="#78716c" strokeWidth={1} pointerEvents="none" />
                  <circle data-testid={`path-handle-in-${i}`} cx={p.inX * SIZE} cy={p.inY * SIZE} r={6} fill="#fff" stroke="#78716c" strokeWidth={2} style={{ cursor: 'grab' }} onPointerDown={startDrag({ kind: 'in', index: i })} />
                </>
              )}
              {p.outX !== undefined && p.outY !== undefined && (
                <>
                  <line x1={p.x * SIZE} y1={p.y * SIZE} x2={p.outX * SIZE} y2={p.outY * SIZE} stroke="#78716c" strokeWidth={1} pointerEvents="none" />
                  <circle data-testid={`path-handle-out-${i}`} cx={p.outX * SIZE} cy={p.outY * SIZE} r={6} fill="#fff" stroke="#78716c" strokeWidth={2} style={{ cursor: 'grab' }} onPointerDown={startDrag({ kind: 'out', index: i })} />
                </>
              )}
            </g>
          ) : null
        ))}
        {path.points.map((p, i) => (
          <rect
            key={`p${i}`}
            data-testid={`path-point-${i}`}
            data-smooth={hasHandles(p) ? 'true' : 'false'}
            data-selected={i === sel ? 'true' : 'false'}
            x={p.x * SIZE - 7}
            y={p.y * SIZE - 7}
            width={14}
            height={14}
            rx={hasHandles(p) ? 7 : 2}
            fill={i === sel ? '#d97706' : '#fff'}
            stroke="#d97706"
            strokeWidth={2}
            style={{ cursor: 'grab' }}
            onPointerDown={startDrag({ kind: 'point', index: i })}
          />
        ))}
      </svg>
      <div className="flex flex-wrap gap-2 text-xs">
        <button type="button" data-testid="path-toggle-smooth" onClick={() => onChange(toggleSmooth(path, sel))} className="px-2 py-1 rounded border">
          {sp && hasHandles(sp) ? t('editor.pathMakeCorner') : t('editor.pathMakeSmooth')}
        </button>
        <button type="button" data-testid="path-delete-point" disabled={path.points.length <= MIN_POINTS} onClick={() => onChange(removePoint(path, sel))} className="px-2 py-1 rounded border disabled:opacity-40">
          {t('editor.pathDeletePoint')}
        </button>
        <label className="flex items-center gap-1">
          <input data-testid="path-closed" type="checkbox" checked={path.closed} disabled={path.points.length < 3} onChange={(e) => onChange(setClosed(path, e.target.checked))} />
          {t('editor.pathClosed')}
        </label>
        <span data-testid="path-point-count" className="font-mono text-stone-500">{path.points.length}</span>
      </div>
    </div>
  );
};
