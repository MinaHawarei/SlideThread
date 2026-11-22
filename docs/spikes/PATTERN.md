# Continuous Pattern Spike

**Date:** 2026-11-23  
**Task:** R0-5  
**Decision:** Implement decorative mesh as deterministic per-tile data in R2-3. Generate each tile from `seed + tileIndex`; generate each inter-tile connector independently from `seed + boundaryIndex`; let each tile read its left and right boundary connector. Do not generate coordinates from the full carousel width.

## Existing implementation and plan conflict

The baseline `Spec.md` §7.1 describes a graph over the whole carousel width, and current `generateCarouselNetwork()` follows that approach: each node's x coordinate is generated from `totalWidth = slideCount * slideWidth`. Increasing `slideCount` therefore changes the random x range for every earlier node; nearest-neighbor edges can also change. `NetworkBackground` caches by slide count, so the old and appended deck variants are distinct graphs. The existing network unit tests verify deterministic output for the same count and that a graph has cross-boundary lines, but they did not compare prefixes.

The amendment in `REVISION_PLAN.md` §5.1 requires per-tile generation, local neighbor reads, and prefix stability. That amendment takes precedence over the baseline whole-width algorithm. The R0-5 prototype proves the revised model; it does not rewrite the existing template generator, which will be handled by R2-3.

## Prototype

`tests/fixtures/meshPatternPrototype.ts` holds a small isolated generator. Each tile gets eight nodes from a PRNG seeded with the project seed and tile index. Local lines use only that tile's nodes. Each boundary connector is generated from the project seed and boundary index, independent of slide count. Its left endpoint and right endpoint are represented in adjacent tile-local coordinates; after adding the tile offset, both representations describe the same global segment.

Every tile includes its outgoing right connector, even if no next tile exists yet. This is what lets an exported existing slide retain identical pixels when a new slide is appended. The newly added slide draws the matching incoming half using the same boundary seed. The first tile has no incoming connector. `createMeshTile()` accepts no deck length, so earlier tile records cannot depend on future slide count.

## Verification

- **Determinism and prefix stability:** Vitest compares all fields and serialized SVG output for the first three tiles generated as a three-slide deck and as a five-slide deck. They are equal.
- **Boundary data continuity:** Vitest globalizes the right connector from tile *i* and left connector from tile *i+1*; both endpoint pairs match exactly.
- **Current generator counterexample:** Vitest compares `generateCarouselNetwork(1080, 1350, 1, 7)` and `generateCarouselNetwork(1080, 1350, 2, 7)` and confirms the first node moves when a slide is appended.
- **Export crop prefix stability:** `tests/e2e/patternSpike.spec.ts` uses the app's actual `capture()` function to produce three individual 360×640 slide crops, then exports the same tiles after extending the deck to five. The first three RGBA buffers are byte-for-byte identical.
- **Export seam continuity:** The E2E probe composes the two separately exported adjacent crops and samples the connector color at the pixels on both sides of the seam. Both halves are visible at their expected crossing location.

The first exploratory check compared a cropped tile from a single wide composite capture with a separately captured tile. It found six differing channel values on the third tile, attributable to browser rasterization at a different horizontal offset. The app export path renders and captures slides individually, so the final reproducible check follows that path and compares individual exported crops. No code or app dependency changed for the prototype.

## R2-3 implementation constraints

1. Keep node geometry as a pure function of seed and tile index. Do not use total slide count to place tile-local nodes.
2. Derive shared edges by a stable boundary index so both sides use identical endpoints and styling.
3. Let a tile inspect only its own data and its immediate neighbors for edges crossing its boundaries.
4. Keep pattern viewBox/cropping consistent with slide dimensions and test all four aspect classes, themes, intensity settings, and no-pattern mode.
5. Add full app export tests that compare existing slide crops after appending content; the current network generator remains unchanged until the template platform task.

## Sources

- Baseline network algorithm and whole-carousel rendering: `docs/Spec.md` §7.1; `src/core/network.ts`; `src/templates/NetworkBackground.tsx`.
- Revised tile generator contract and prefix-stability rule: `docs/REVISION_PLAN.md` §5.1.
- Export helper used in the browser crop test: `src/export/capture.ts`.
