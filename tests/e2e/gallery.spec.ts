import { test, expect, type Page } from '@playwright/test';

/** Walks the numbered pagination until the template card is on screen (alphabetical sort puts tech-mesh on page 2). */
async function goToGalleryTemplatePage(page: Page, id: string): Promise<void> {
  const card = page.locator(`[data-testid="gallery-template-card"][data-template-id="${id}"]`);
  for (let i = 0; i < 10; i++) {
    if (await card.isVisible().catch(() => false)) return;
    await page.getByTestId('gallery-page-next').click();
  }
  throw new Error(`template ${id} not found in any gallery page`);
}
import fs from 'node:fs';
import path from 'node:path';

/** Template ids whose manifest lists the category, read from the shipped starters so the test follows the data. */
function idsInCategory(category: string): string[] {
  const dir = path.resolve(process.cwd(), 'src/templates/starters');
  return fs.readdirSync(dir)
    .filter((name) => fs.existsSync(path.join(dir, name, 'template.json')))
    .filter((name) => (JSON.parse(fs.readFileSync(path.join(dir, name, 'template.json'), 'utf8')).categories ?? []).includes(category))
    .sort();
}


test.describe('Component Gallery Route (/gallery)', () => {
  test('searches templates, filters categories, and persists favorites', async ({ page }) => {
    await page.goto('/gallery');
    await page.getByTestId('gallery-search').fill('Weave');
    await expect(page.getByTestId('gallery-template-card')).toHaveCount(1);
    await expect(page.getByTestId('gallery-template-card')).toHaveAttribute('data-template-id', 'tech-mesh');

    await page.getByTestId('gallery-search').fill('');
    const categories = page.getByTestId('gallery-category');
    await expect(categories.locator('option')).toHaveCount(8); // All + six populated categories (coding, marketing, education, lifestyle, personal-brand, general, heritage)
    await expect(categories.locator('option[value="coptic"]')).toHaveCount(0);
    await expect(categories.locator('option[value="islamic"]')).toHaveCount(0);
    await categories.selectOption('marketing');
    // Marketing: every shipped template whose manifest lists it (the gallery shows all of them on one page).
    const marketing = idsInCategory('marketing');
    expect(marketing).toContain('bold-marketing');
    // The gallery is paginated (24 per page): walk every page and compare the union with the manifests.
    const seen: string[] = [];
    for (let i = 0; i < 20; i++) {
      seen.push(...await page.locator('[data-testid="gallery-template-card"]').evaluateAll((els) => els.map((e) => e.getAttribute('data-template-id') as string)));
      const next = page.getByTestId('gallery-page-next');
      if (!(await next.isVisible().catch(() => false)) || await next.isDisabled()) break;
      await next.click();
    }
    expect([...seen].sort()).toEqual(marketing);

    await page.getByTestId('gallery-category').selectOption('all');
    await goToGalleryTemplatePage(page, 'tech-mesh');
    await page.getByTestId('favorite-tech-mesh').click();
    await page.getByTestId('favorites-filter').click();
    await expect(page.getByTestId('gallery-template-card')).toHaveCount(1);
    await expect(page.getByTestId('gallery-template-card')).toHaveAttribute('data-template-id', 'tech-mesh');
    await page.reload();
    await goToGalleryTemplatePage(page, 'tech-mesh');
    await expect(page.getByTestId('favorite-tech-mesh')).toHaveAttribute('aria-pressed', 'true');
    await page.getByTestId('favorites-filter').click();
    await goToGalleryTemplatePage(page, 'tech-mesh');
    await page.getByTestId('favorite-tech-mesh').click();
  });

  // The old component gallery (type-select / aspect-select) no longer exists: the page is now the template gallery
  // and each template opens in TemplatePreviewPage. These two tests cover the same ground there.
  test('preview page renders all 9 slide types in every aspect class without errors', async ({ page }) => {
    test.setTimeout(60000);
    const consoleErrors: string[] = [];
    // Vercel analytics script only exists on the hosted site; stub it so a local 404 is not counted as an app error.
    await page.route('**/_vercel/insights/**', (route) => route.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    await page.goto('/gallery');
    await goToGalleryTemplatePage(page, 'tech-mesh');
    await page.getByTestId('preview-template-tech-mesh').click();
    await expect(page.getByTestId('template-preview-page')).toBeVisible();
    const types = ['cover', 'explain', 'rule', 'compare', 'code', 'stat', 'quote', 'image', 'cta'];
    const typeSelect = page.getByTestId('slide-type-filter');
    for (const aspect of ['portrait', 'square', 'landscape', 'tall']) {
      await page.getByTestId('aspect-filter').selectOption(aspect);
      await typeSelect.selectOption('all');
      await expect.poll(() => page.locator('.slide-canvas').count(), { message: `${aspect}: slides rendered` }).toBeGreaterThanOrEqual(types.length);
      for (const type of types) {
        await typeSelect.selectOption(type);
        await expect(page.locator('.slide-canvas').first(), `${aspect}/${type}`).toBeVisible();
        expect(await page.locator('.slide-canvas').count()).toBeGreaterThanOrEqual(1);
      }
    }
    expect(consoleErrors).toEqual([]);
  });

  test('verifies the five starter template previews on the preview page', async ({ page }) => {
    test.setTimeout(60000);
    const consoleErrors: string[] = [];
    // Vercel analytics script only exists on the hosted site; stub it so a local 404 is not counted as an app error.
    await page.route('**/_vercel/insights/**', (route) => route.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    await page.goto('/gallery');
    await goToGalleryTemplatePage(page, 'tech-mesh');
    await page.getByTestId('preview-template-tech-mesh').click();
    await expect(page.getByTestId('template-preview-page')).toBeVisible();
    await page.getByTestId('slide-type-filter').selectOption('cover');
    await page.getByTestId('aspect-filter').selectOption('portrait');
    const templates = [['tech-mesh', 'network'], ['clean-minimal', 'clean'], ['bold-marketing', 'bold'], ['soft-gradient', 'soft'], ['heritage-geometric', 'heritage']] as const;
    for (const [tmpl, cls] of templates) {
      await page.getByTestId('template-select').selectOption(tmpl);
      const canvas = page.locator('.slide-canvas').first();
      await expect(canvas).toHaveClass(new RegExp(`template-${cls}`));
      await expect(canvas).toHaveAttribute('data-template-id', tmpl);
    }
    await page.getByTestId('toggle-theme').click();
    await page.getByTestId('toggle-lang').click();
    await expect(page.locator('.slide-canvas').first()).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });
});

