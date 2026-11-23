# Template contribution guide

Templates live in `src/templates/starters/<id>/`. Each folder has a required `template.json`, a generated `preview.webp`, and an optional `assets/` folder. The current repository uses a flat ID folder because that is the structure consumed by the R2-6 starter registry and R2-7 CLI; category relationships are declared in the manifest.

Templates are untrusted data. The CI validator checks the JSON Schema and Zod schema, category IDs, inheritance, palette contrast, CSS/SVG security, asset size and format, license presence, preview size, and long-text rendering. Do not bypass those checks.

## Quick start: theme-only template

1. Install dependencies and Chromium as described in [Contributing](../CONTRIBUTING.md).
2. Scaffold a new ID:

   ```bash
   npm run template:new -- creator-notes
   ```

3. Replace `src/templates/starters/creator-notes/template.json` with the following theme-only manifest. Update the author and license for your contribution.

   ```json
   {
     "schema": 1,
     "id": "creator-notes",
     "name": { "en": "Creator Notes", "ar": "ملاحظات المبدع" },
     "description": {
       "en": "An editorial theme for creator stories.",
       "ar": "سمة تحريرية لقصص صنّاع المحتوى."
     },
     "author": { "name": "Your Name" },
     "license": "MIT",
     "categories": ["personal-brand"],
     "tags": ["editorial", "creator", "minimal"],
     "colorFlexible": true,
     "counter": { "styles": ["bar"], "defaultStyle": "bar" },
     "theme": {
       "fonts": {
         "display": "ibm-plex-sans",
         "body": "ibm-plex-sans-arabic",
         "mono": "jetbrains-mono"
       },
       "typeScale": { "h1": 100, "h2": 68, "body": 40, "small": 28, "mono": 32 },
       "radius": { "card": 16, "chip": 9999 }
     },
     "layouts": {},
     "formats": "all"
   }
   ```

4. Open the live preview. The language, theme, aspect, and stress-copy controls use the same manifest data:

   ```bash
   npm run template:dev -- creator-notes
   ```

   Visit the URL printed by Vite. Editing `template.json` hot reloads the page.

5. Generate the committed preview and run validation:

   ```bash
   npm run template:preview -- creator-notes
   npm run template:validate
   npm run template:index
   ```

6. Review the generated WebP, then run `npm run template:preview -- --check` and `npm run template:index -- --check`. Commit the manifest and preview; do not hand-edit the generated gallery index.

This example deliberately adds no app code, registered layout, decoration, or asset. The `colorFlexible` flag lets the app generate light and dark palettes from a creator color; fixed palettes should provide complete `theme.modes.dark` and `theme.modes.light` values that pass contrast validation.

The current Gallery page still uses its starter registry. R2-9 will connect the generated index to the gallery data layer; until then, the new template is available in the template lab and CI pipeline but is not automatically selectable in the production gallery.

## Four contribution levels

Each example builds on the theme-only manifest above. Keep the same bilingual names, author, license, category, tags, and unique ID.

### 1. Theme: JSON only

The complete `creator-notes` manifest above is the worked example. Use only font IDs from `src/fonts/registry.ts`. Optional `typeScale`, `radius`, `counter`, and `signature` values are data; do not add component code for them. If `colorFlexible` is false, define all required palette tokens for both modes.

### 2. Layouts: choose registered archetypes

Add archetype IDs from `src/templates/layouts/registry.ts` to the manifest's `layouts` object. For example:

```json
"layouts": {
  "cover": "cover-editorial",
  "explain": "explain-centered",
  "rule": "rule-editorial",
  "code": "code-centered",
  "compare": "compare-editorial",
  "stat": "stat-centered",
  "quote": "quote-editorial",
  "image": "image-centered",
  "cta": "cta-editorial"
}
```

Only reference IDs already present in the registry. The runtime selects the registered variant for each of the four aspect classes and falls back to the default archetype for a missing or incompatible entry. Layout definitions are engine code and require a code contribution; a new template that only references them stays data-only.

### 3. Decorations: generator parameters and sanitized SVG assets

Add a registered generator in `decor.background` or `decor.overlay`. This worked example uses `dots-grid` with a smaller dot scale:

```json
"decor": {
  "background": {
    "id": "dots-grid",
    "params": { "rows": 9, "dotScale": 0.004 },
    "intensity": 0.45
  },
  "overlay": [{ "id": "none", "intensity": 1 }]
}
```

Available generator IDs are `mesh`, `dots-grid`, `waves`, `geometric`, `blobs`, and `none`. Generator output is deterministic and should remain prefix-stable across carousel slides. SVG files may be placed in the template's `assets/` folder; the CLI validates them with the SVG sanitizer and enforces the size/type limits. The current runtime resolves registered generator IDs; local SVG placement on a slide is not yet exposed in the template manifest.

### 4. Scoped CSS: advanced and optional

The schema currently accepts CSS text in `customCss` and validates it with the CSS AST allowlist. Keep selectors rooted at `.tpl-creator-notes`, stay within approved properties and values, and avoid remote URLs, at-rules, sibling selectors, fixed positioning, and oversized rules. Example:

```json
"customCss": ".tpl-creator-notes .slide-tag { border-radius: 8px; color: var(--acc); }"
```

This is the current schema representation; the plan's future `style.css` file form is not accepted by the CLI. CSS validation is active, while applying contributed CSS in the application preview is still pending runtime integration. Keep the template usable without custom CSS and disclose this limitation in the pull request.

## Inheritance

Use `extends` only when a template is a genuine variant of another template. The parent must exist in the starter set, cycles are rejected, and child values override the parent's theme/layout/decor data. Example:

```json
"extends": "clean-minimal"
```

Do not copy a full template just to change its accent or radius.

## Validation and previews

- `npm run template:validate` checks schema, security, contrast, assets, licenses, preview presence/size, and stress-renders each template across both themes, both scripts/directions, and all four aspect classes.
- `npm run template:preview -- <id>` captures an 864×1080 WebP and reduces encoding quality as needed to stay at or below 40 KB.
- `npm run template:preview -- --check` verifies that committed previews are current with a tolerant pixel comparison.
- `npm run template:index` generates `src/templates/registry/index.json`; use `-- --check` in CI.
- `npm run template:dev -- <id>` serves the template lab with hot reload and English/Arabic sample content.

Read [Content Policy](CONTENT_POLICY.md) before adding text, palettes, patterns, or assets. CI is the final check; a local preview is not a license or security review.
