/**
 * Full-carousel versions of the two Pinterest cover packs (golden-hour-viral, neon-grid-process).
 * Each ships built in (src/templates/starters/<id>), previewed for all 9 slide types in all 4 aspect classes, and a
 * project is made from it. Asserts the backdrop image really loads for every slide type and aspect, and that
 * titles stay inside the slide.
 */
import { test, expect } from '@playwright/test';
import { goToGalleryTemplatePage } from './helpers/wizard';
import { finishLockedWizard } from './helpers/wizard';

const PACKS = ['golden-hour-viral', 'neon-grid-process'] as const;
const TYPES = ['cover', 'explain', 'rule', 'code', 'compare', 'stat', 'quote', 'image', 'cta'];

for (const id of PACKS) {
  test(`${id}: is built in, renders every slide type in every aspect, starts a project`, async ({ page }) => {
    test.setTimeout(100000);
    await page.route('**/_vercel/insights/**', (route) => route.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
    const errors: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.addInitScript(() => { if (!sessionStorage.getItem('seeded')) { localStorage.clear(); sessionStorage.setItem('seeded', '1'); } });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/gallery');
    // Built-in: no import needed, the pack ships with the app next to the other starters.
    await goToGalleryTemplatePage(page, id);
    await expect(page.getByTestId(`preview-template-${id}`)).toBeVisible({ timeout: 20000 });
    await page.getByTestId(`preview-template-${id}`).click();
    await expect(page.getByTestId('template-preview-page')).toBeVisible();
    for (const aspect of ['portrait', 'square', 'landscape', 'tall']) {
      await page.getByTestId('aspect-filter').selectOption(aspect);
      await page.getByTestId('slide-type-filter').selectOption('all');
      await expect.poll(() => page.locator('.slide-canvas').count()).toBeGreaterThanOrEqual(TYPES.length);
      const report = await page.evaluate(async () => {
        const canvases = Array.from(document.querySelectorAll('.slide-canvas')) as HTMLElement[];
        return canvases.map((c) => {
          const imgs = Array.from(c.querySelectorAll('img')) as HTMLImageElement[];
          const loaded = imgs.filter((i) => i.complete && i.naturalWidth > 0).length;
          const cr = c.getBoundingClientRect();
          const title = c.querySelector('.slide-title-h1, .slide-title-h2') as HTMLElement | null;
          let inside = true;
          if (title && getComputedStyle(title).visibility !== 'hidden' && title.getBoundingClientRect().width > 0) {
            const tr = title.getBoundingClientRect();
            inside = tr.left >= cr.left - 1 && tr.right <= cr.right + 1 && tr.top >= cr.top - 1 && tr.bottom <= cr.bottom + 1;
          }
          return { imgs: imgs.length, loaded, inside };
        });
      });
      for (const [i, r] of report.entries()) {
        expect(r.imgs, `${aspect} slide ${i}: backdrop image element`).toBeGreaterThan(0);
        expect(r.loaded, `${aspect} slide ${i}: images loaded`).toBe(r.imgs);
        expect(r.inside, `${aspect} slide ${i}: title inside slide`).toBe(true);
      }
      await page.screenshot({ path: `test-results/${id}-${aspect}-all-v1.png`, fullPage: true });
    }

    // A real project from the pack opens in the editor.
    await page.getByTestId('preview-use-btn').click();
    await finishLockedWizard(page);
    await expect(page.getByTestId('main-canvas')).toBeVisible({ timeout: 20000 });
    await page.screenshot({ path: `test-results/${id}-editor-v1.png` });
    // The project must stay small enough to autosave (browser storage is ~5 MB and the project is stored twice).
    await page.waitForTimeout(1500);
    const stored = await page.evaluate(() => localStorage.getItem('app:current-project:v1')?.length ?? 0);
    expect(stored, 'saved project size in characters').toBeGreaterThan(0);
    expect(stored, 'saved project must leave room for autosave').toBeLessThan(1_000_000);
    await expect(page.getByText('Browser storage is full')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}
