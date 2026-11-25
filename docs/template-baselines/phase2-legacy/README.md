# Phase 2 legacy render baseline

Captured on 2026-11-25 from the clean Phase 1 commit `acc2f66`, before Phase 2 source changes.

The 20 matrix PNGs are full-page screenshots of `/preview?template=<id>`. This page renders all 9 slide types across all 4 aspect classes (36 `.slide-canvas` instances per screenshot). For these five IDs, `TemplatePreviewPage` passes no `templateSnapshot` to `SlideRenderer`, so the renderer resolves each design from the legacy `getTemplate()` registry and its handwritten background component. The viewport was 1600×1000 at device scale factor 1.

The 5 export PNGs are current-app editor exports of the cover slide for each template in English, dark mode, and portrait format. They were saved through **Export Presentation → Single PNG Image → Current Slide Only**. The Phase 1 project creation path stores a template snapshot, while `templateDefinitionFromSnapshot` still selects the legacy `Background` component for these five registered IDs.

`manifest.json` records the exact matrix, screenshot source, export settings, canvas count, and SHA-256 hashes. The screenshots capture the representative slide-type and aspect matrix in one artifact per language/theme combination; the export PNGs provide an independent export-pipeline reference.
