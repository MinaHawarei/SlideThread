# Manipulation Spike

**Date:** 2026-11-23  
**Task:** R0-2  
**Decision:** Use native Pointer Events for the first editor manipulation implementation. Keep transforms in the model and use CSS transforms only for live preview. Do not add `react-moveable` or `@use-gesture/react` for R3-2 unless implementation testing shows a specific gap that justifies one.

## Scope and method

Compared the plan's `react-moveable` candidate with `@use-gesture/react` and a small native Pointer Events prototype in Chromium. Reviewed official project API and license sources on 2026-11-23. The prototype used a 360×640 stage in a 390×844 mobile browser viewport, `dir="rtl"`, and the existing `src/export/capture.ts` HTML-to-image pipeline. Chromium CPU throttling was set to 4× for a one-second animation-frame loop. This is an automated proxy only, not a real mid-range phone measurement.

The reproducible browser check is `tests/e2e/manipulationSpike.spec.ts`.

## Candidate comparison

| Capability | `react-moveable` | `@use-gesture/react` + app code | Native Pointer Events + app code |
|---|---|---|---|
| Move | Built-in draggable events. | Drag hook provides pointer movement; app stores and renders position. | App handles pointer capture and maps client deltas to the selected model element. |
| Resize | Built-in resize handles/events. | Must build handles and resize math. | Must build handles and resize math. |
| Rotate | Built-in rotate control/events. | Must build a rotate handle and angle math. | Must build a rotate handle and angle math. |
| Snapping/guides | Built-in snapping to guidelines. | Must build snapping and guide rendering. | Must build snapping and guide rendering. |
| Touch pinch | Built-in pinchable behavior for drag/resize/scale/rotate. | `usePinch` plus `scaleBounds` and `angleBounds`; application still owns element/render semantics. | Track active pointers and calculate distance/angle; most implementation work, no dependency. |
| RTL | Needs explicit physical-coordinate and logical-layout integration. | Coordinate transform option can map screen coordinates to the canvas; app still defines physical anchor behavior. | Tested physical x/y deltas remain physical under `dir="rtl"`; normalization belongs in the app model. |
| Keyboard/accessibility | The library supplies transform controls; keyboard editing and numeric inspector still need app-owned UI. | Drag supports keyboard arrows by default; resize/rotate/snap semantics still need app-owned keyboard controls. | All keyboard alternatives and announcements are app-owned. |
| Export | Transforming the target is supported; export must still render model data without Moveable controls. | CSS transforms can be captured; app must keep state/model in sync. | CSS transforms can be captured; app must keep state/model in sync. |
| License / dependency | MIT; official package metadata lists `react-moveable` 0.56.0. | MIT; official package metadata lists `@use-gesture/react` 10.3.1. | No dependency and no added license obligations. |

Moveable offers the broadest ready-made interaction set. The tradeoff is that its editing controls and event state still have to be synchronized with our normalized per-aspect overrides and hidden from export. `@use-gesture/react` supplies gesture input, not resize/rotate handles or snapping. Native Pointer Events keep input handling and model updates local, but R3 must implement multi-pointer math, snapping, keyboard commands, and accessible alternatives.

Bundle sizes for the two library candidates were not measured because neither was installed. No library was added. The selected approach adds zero dependency bytes; R3-2 must re-open this decision if custom touch behavior or frame pacing misses its acceptance criteria.

## Measured prototype evidence

- A pointer drag from `(60, 60)` to `(150, 310)` on the RTL stage produced CSS matrix translation `(90, 250)`. This confirms the browser's physical x/y delta did not reverse with RTL.
- `capture()` returned a PNG data URL. Pixel sampling found the moved red element at `(180, 320)` as `[224, 32, 32, 255]`; its former position `(50, 50)` remained white `[255, 255, 255, 255]`. The captured model element's CSS transform was present in the output.
- On Chromium mobile emulation at 390×844 with 4× CPU throttling, a one-second CSS-transform animation loop produced 62 `requestAnimationFrame` callbacks over 1016.5 ms (about 61 callbacks/s), with a 16.8 ms p95 frame gap; 35 intervals exceeded 16.7 ms. This demonstrates that a simple transform loop can approach a 60 Hz callback cadence in the proxy, but does not prove steady 60 fps during real touch editing or on a physical mid-range device.
- The Playwright test verifies drag delta, RTL physical direction, and actual PNG capture. It does not yet verify resize handles, rotation, snapping, or multi-touch pinch; those are R3-2 implementation tests.

## Decision and implementation constraints

Proceed with native Pointer Events for R3-2, with these constraints:

1. Store move/resize/scale/rotation in normalized model overrides; transient pointer motion may update the CSS transform but commit model state at gesture end.
2. Use physical x/y deltas and convert to normalized slide fractions independently of `dir`; RTL only affects text/layout, not physical anchors or pointer direction.
3. Keep controls and guides outside the rendered model stage so export never captures editor chrome.
4. Batch live visual updates with `requestAnimationFrame`; test drag, resize, pinch/rotate, snap, reset, keyboard, and export in Playwright before claiming completion.
5. Reconsider a library only if those tests show the custom implementation cannot meet the plan's interaction or performance bar. If adding one, measure the minified gzip delta and record license, rationale, and alternatives in `docs/DECISIONS.md`.

## Manual check

Real-device performance and touch behavior remain unverified. Exact owner steps are listed in the manipulation section of `docs/QA_CHECKLIST.md` and tracked by D-09.

## Primary sources checked (2026-11-23)

- React Moveable feature list/API and `react-moveable` README: https://github.com/daybrush/moveable/blob/master/packages/react-moveable/README.md
- React Moveable package metadata, including version: https://github.com/daybrush/moveable/blob/master/packages/react-moveable/package.json
- Moveable repository license: https://github.com/daybrush/moveable/blob/master/LICENSE
- `@use-gesture/react` hooks and touch/pinch options: https://github.com/pmndrs/use-gesture/blob/main/README.md and https://github.com/pmndrs/use-gesture/blob/main/documentation/pages/docs/options.mdx
- `@use-gesture/react` package metadata and license: https://github.com/pmndrs/use-gesture/blob/main/packages/react/package.json and https://github.com/pmndrs/use-gesture/blob/main/LICENSE
