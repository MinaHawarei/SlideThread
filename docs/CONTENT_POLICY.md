# Template and asset content policy

This policy applies to template manifests, sample copy, decoration parameters, SVG/CSS, preview images, and reusable assets contributed to SlideThread. User-created slide text and uploads remain the user's responsibility and stay in the browser.

## Content standards

- Keep template names, descriptions, and labels meaningful in both English and Arabic. Review the Arabic text in RTL, including mixed Arabic, Latin product terms, punctuation, and numerals.
- Use short, neutral sample copy. Do not present a template's sample text as factual advice, medical or financial claims, endorsements, or a promise of results.
- Do not include hateful, harassing, threatening, sexually exploitative, or privacy-invasive content. Do not include real people's personal data, private messages, or images without permission.
- Do not use third-party logos, product marks, celebrity likenesses, or copyrighted text as decoration unless you have verified permission or a license that covers this use.
- For Arabic & Heritage, Coptic, and Islamic categories, keep the template itself focused on color, shape, and pattern; do not bake in text. Heritage geometry must be original and must not imitate sacred or religious iconography.
- Keep text editable and readable. Do not use letter spacing on text that may contain Arabic, and do not bake template labels into raster artwork.

## Licenses and attribution

Only add material under CC0, MIT, ISC, Apache-2.0, or CC-BY. Do not scrape assets or rely on an unverified license claim.

For each third-party asset, record:

- The exact source URL and creator.
- The exact license and a link to its full terms.
- Any required attribution text, included in the template folder or the repository's `NOTICE` and `docs/ASSET_LICENSES.md` as appropriate.
- Confirmation that the license allows the intended modification, recoloring, and redistribution.

The `license` field in `template.json` must be a valid SPDX identifier for the template's content and its included assets. If assets have different licenses, document each one and make sure the combination is compatible. Original authored shapes or patterns may use MIT; never claim third-party provenance for original work.

## Security and technical limits

- Treat SVG, CSS, JSON, and images as hostile input. Never embed scripts, event handlers, external references, data URLs, remote fonts, remote stylesheets, or hidden tracking.
- Use the provided SVG sanitizer and CSS AST validator. Do not write regex-based sanitizers or use `dangerouslySetInnerHTML`.
- Template assets may only be SVG, WebP, or PNG, and their combined size must not exceed 300 KB. Each committed preview must be WebP and at most 40 KB.
- Fonts must come from `src/fonts/registry.ts`; the app blocks remote font loading.
- Keep patterns deterministic and prefix-stable. Avoid viewport units in slide CSS, use logical properties, and test light/dark, LTR/RTL, long Arabic, and all four aspect classes.

## Categories and sensitive themes

Use category IDs from `src/templates/registry/categories.json`. Coptic and Islamic are ordinary categories and do not imply endorsement or special status. Their template visuals remain text-free and limited to color, shape, and pattern. If you are unsure whether a motif or asset is appropriate or legally clear, leave it out and ask for review in the pull request.
