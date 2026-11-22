# Sortable Animation Spike

**Date:** 2026-11-23  
**Task:** R0-4  
**Decision:** Use Motion's React `Reorder` components by themselves for R7-1. Use its built-in spring layout and keyboard reordering, with a dedicated drag handle that begins a touch drag after a short hold. Do not add dnd-kit unless R7 tests uncover a concrete gap in collision behavior, keyboard support, or announcements.

## Scope and method

Compared Motion `Reorder`, current dnd-kit React sortable plus Motion layout, and the existing native HTML drag behavior. Built temporary React prototypes in `/tmp/sortable-spike` with React 18.3.1 and Vite 5.4.11. The Motion prototype used `Reorder.Group`/`Reorder.Item`, a 350 ms touch hold on a separate handle, spring layout transitions, and `MotionConfig reducedMotion="user"`. The dnd-kit prototype used current `@dnd-kit/react` sortable hooks, the PointerSensor delay/tolerance for touch, keyboard sensor, and a Motion wrapper to animate layout changes.

Browser probes ran on system Chrome through Playwright. Touch gestures used Chrome DevTools Protocol touch input in a 390×844 mobile emulation context. This is a proxy only; it is not a real iPhone or Android device test. No app dependency or prototype source was added to the project.

## Findings

| Requirement | Motion `Reorder` | dnd-kit React + Motion | Existing native drag and keyboard controls |
|---|---|---|---|
| Reorder animation | `Reorder.Item` animates list position; explicit layout spring can control stiffness/damping. Dragged item can lift with `whileDrag`, and is raised above siblings when positioned. Chromium probe observed an in-progress translated transform after a keyboard reorder. | dnd-kit's sortable transition supports duration/easing. Wrapping list items in Motion `layout` added spring movement; Chromium also showed a transformed position during keyboard reorder. | Native browser drag has no spring layout or drop animation. |
| Touch long-press | Separate drag handle can call `useDragControls.start()` after a small app timer. At 350 ms, Chrome mobile emulation reordered the list; a short tap left order unchanged. This hold delay is app-owned. | PointerSensor supports a built-in delay and movement tolerance. With a 300 ms delay, Chrome mobile emulation reordered the list after a long press; a short tap left order unchanged. Sensor constraint avoids hand-writing the hold timer. | Native HTML drag does not supply a dependable touch long-press interaction. Existing buttons continue to provide reorder without touch drag. |
| Keyboard | Built-in keyboard flow: Tab to list items, Space to grab/drop, arrow keys to move, Home/End to jump, Escape to cancel. Probe moved the first item down using Space + ArrowDown. | KeyboardSensor supports Space/Enter start, arrow movement, Space/Enter drop, and Escape cancel. Probe moved the first item down with Space + ArrowDown. | App already has separate Move Up / Move Down buttons; the native drag itself is not keyboard-operated. |
| Reduced motion | `MotionConfig reducedMotion="user"` disables transform/layout animation per the user's preference. With `prefers-reduced-motion: reduce`, the browser probe still completed keyboard reorder and list state changed. | Motion wrapper honors the same reduced-motion configuration; keyboard reorder still completed in the probe. | No animation by default, so no motion-specific behavior to disable. |
| Drag feedback | Direct `whileDrag` style can add lift, shadow, and scale. No separate cloned overlay by default. | `DragOverlay` supports a separate clone and configurable drop animation; more control for complex or multi-container drag. | Browser ghost image behavior is not a designed slide thumbnail preview. |
| Accessibility | Ordered list/list item semantics and keyboard reordering are built in. R7 should add a localized polite status announcement for the new order and retain explicit Move Up/Down controls for discoverability. | Keyboard sensor, drag ARIA state and dnd-kit accessibility support provide a stronger baseline. Keep handle focus and announcements tested in the app. | Existing controls are accessible alternatives; native drag adds little. |
| Complexity for one slide rail | One animation dependency; no custom collision system. The hold timer and live-region text remain app code. | Adds a drag/drop framework plus a separate animation system. Useful if future flows need more advanced collision rules, overlays, or multi-container movement. | No new dependency but custom interaction and animation behavior would still need implementation. |

## Bundle measurement

Built the prototypes with Vite 5.4.11 and esbuild minification. Sizes below are gzip bytes for the initial route's JS chunks, excluding the small HTML document:

| Route prototype | Initial-route JS gzip |
|---|---:|
| Motion `Reorder` with React and spring transitions | 99.47 kB |
| dnd-kit sortable with React, without Motion springs | 85.11 kB |
| dnd-kit sortable plus Motion spring layout | 134.95 kB |

For the combined two-route build, React and shared modules were in a 95.45 kB common chunk; the dnd-kit plus Motion route added a 39.50 kB feature chunk. The Motion-only route was 100.22 kB in that combined build (4.77 kB route chunk plus common code), compared with 99.47 kB when built independently. These figures are prototype route totals, not an app-wide delta. dnd-kit alone is smaller, but it does not supply the required spring reorder. Pairing it with Motion cost about 35.5 kB gzip more than Motion alone in the measured route.

On 2026-11-23, npm registry metadata reported Motion 14.14.0 (MIT, 1,017,611 unpacked bytes), `@dnd-kit/react` 0.5.3 (MIT, 243,784 unpacked bytes), and `@dnd-kit/dom` 0.5.3 (MIT, 1,254,684 unpacked bytes). Package unpacked sizes include files not shipped to the browser; the Vite gzip route comparison is the relevant measurement here.

## Decision and implementation constraints

Motion alone covers the single-rail behavior the plan requires: pointer reorder, automatic layout movement, a spring finish, handle-triggered dragging, and keyboard reordering. Its built-in keyboard interaction reduces the custom accessibility surface; the measured route is smaller than the dnd-kit plus Motion prototype. The long-press delay is a small app-level addition, and reduced motion leaves reorder state changes available. Keep the current Move Up/Down controls alongside drag for keyboard and touch precision.

R7-1 constraints:

1. Use a dedicated, clearly labelled drag handle; keep thumbnail tap for slide selection. Set a touch hold delay and movement tolerance so scrolling and taps do not start drag.
2. Preserve keyboard reorder using Space/arrow/Home/End and Escape cancellation; keep Move Up/Down buttons and announce successful movement through a localized polite live region.
3. Use a restrained lift style and spring drop; do not move the editor's data state until reorder intent is clear. Integrate committed order with global undo/redo.
4. Honor `prefers-reduced-motion`: disable spring/layout travel while preserving the reorder operation and focus.
5. Test at mobile sizes, automated touch emulation, keyboard-only, reduced-motion mode, RTL, and a physical iOS/Android device per D-09 before R9-1.
6. Re-open this choice if cross-container movement, complex collisions, or an accessibility test failure requires dnd-kit's additional controls.

## Primary sources checked (2026-11-23)

- Motion React reorder, automatic reorder, keyboard behavior, and drag handles: https://motion.dev/docs/react-reorder
- Motion manual drag controls and touch support: https://motion.dev/docs/react-use-drag-controls
- Motion accessibility and reduced-motion configuration: https://motion.dev/docs/react-accessibility
- Motion React layout springs: https://motion.dev/docs/react-layout-animations
- dnd-kit React sortable hook and transition API: https://dndkit.com/react/hooks/use-sortable/
- dnd-kit pointer delay/tolerance, keyboard sensor, and handle options: https://dndkit.com/react/guides/sensors/
- dnd-kit drag overlay: https://dndkit.com/react/components/drag-overlay/
- Current dnd-kit migration guide (legacy `@dnd-kit/core` and `@dnd-kit/sortable` API is replaced in the new docs): https://dndkit.com/react/guides/migration/
- Motion MIT license: https://github.com/motiondivision/motion/blob/main/LICENSE.md
- dnd-kit MIT license: https://github.com/clauderic/dnd-kit/blob/main/LICENSE
