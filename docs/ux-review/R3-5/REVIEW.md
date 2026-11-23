# R3-5 Selection and Layers Review

The 12 screenshots cover 360×800, 768×1024, and 1440×900 in light/dark modes and LTR/RTL. Each shows the open layer panel and selected slot; the desktop screenshots also show the contextual selection toolbar.

## Self-review scores

- Hierarchy and focus: 4/5 — selected layers are marked and toolbar/panel controls have accessible names.
- Spacing and alignment: 4/5 — the layer list uses aligned rows and consistent 44 px actions.
- Consistency with the kit: 4/5 — controls use the same rounded surfaces and cyan selection treatment.
- Contrast and legibility: 4/5 — the opaque panel stays readable over both template themes.
- Motion quality: 4/5 — layer state changes are immediate and predictable.
- Empty/loading/error states: 4/5 — rows are synchronous and always derive from the active slide.
- RTL parity: 4/5 — panel direction follows the app, while physical layer order remains explicit.
- Mobile ergonomics: 4/5 — the panel opens within the canvas with 44 px row actions; selected controls remain in the bottom toolbar.
- Deliberate delight: 4/5 — hidden and locked layers stay visible in the list so they can be restored or unlocked in place.

## Known limitations

- Template slots can be hidden, locked, and reordered in the editor. Extras retain those states and z values in the project model; their rendered content and exported ordering are integrated in R3-6.
- Lock/hide/order flags are optional v2 fields on slot overrides and extras; existing projects continue to resolve with visible, unlocked default state.
