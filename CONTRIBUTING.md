# Contributing to SlideThread

Thanks for helping improve SlideThread. The application creates social posts, carousels, and stories in the browser. Project content stays client-side; contributions must preserve Arabic/English and RTL/LTR support.

## Get started

Requirements: Node.js 20.9 or newer, npm, and Git.

```bash
git clone https://github.com/MinaHawarei/SlideThread.git
cd SlideThread
npm ci
npx playwright install chromium
npm run dev
```

Open `http://localhost:5173`. Run the checks before submitting a pull request:

```bash
npm run lint
npm run typecheck
npm test
npm run template:validate
npm run template:preview -- --check
npm run template:index -- --check
npm run build
```

Template commands and options are listed in the [README](README.md#-available-npm-scripts). Template-specific instructions are in the [Template Guide](docs/TEMPLATE_GUIDE.md); rules for text, imagery, and licensing are in the [Content Policy](docs/CONTENT_POLICY.md).

## Choose a contribution path

- **Templates:** Start with `npm run template:new -- <slug>`. Templates are JSON data and registered assets; ordinary theme, layout, and decoration contributions do not require app source changes. Follow the Template Guide and test the generated preview.
- **Application code:** Keep domain types and logic in their registries, validate imported or contributed data, add tests for pure logic, and use logical CSS properties. User-facing app strings belong in both `src/i18n/en.ts` and `src/i18n/ar.ts`.
- **Assets:** Verify the source and license before adding anything. Record reusable project assets in `docs/ASSET_LICENSES.md` and `NOTICE`; template-local asset license and source information belongs in the PR description and the asset license records.

Treat template JSON, CSS, SVG, uploaded files, and pasted text as untrusted. Use the provided sanitizers and validators; do not use `dangerouslySetInnerHTML`, remote fonts, remote CSS, or hand-written regex sanitizers.

## Branches and pull requests

1. Create a branch from `main`, using `feature/`, `fix/`, or `docs/` plus a short name.
2. Keep commits focused and describe the change in plain language.
3. Fill in the [pull request template](.github/PULL_REQUEST_TEMPLATE.md). Include screenshots for visible changes and state the license and verified source of every added asset.
4. Address CI feedback and request review from the owners listed in [CODEOWNERS](.github/CODEOWNERS).

Do not deploy, publish packages, or create release tags from a contribution branch. The repository owner handles release actions.

## Community expectations

Be considerate in issues and reviews. Critique code and ideas without personal attacks, and make room for contributors with different backgrounds and language fluency. See the [Content Policy](docs/CONTENT_POLICY.md) for what can ship in templates and assets.
