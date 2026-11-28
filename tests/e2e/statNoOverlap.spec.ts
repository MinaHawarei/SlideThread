import { test, expect } from '@playwright/test';
import { goToGalleryTemplatePage } from './helpers/wizard';

const TEMPLATES = ['tech-mesh', 'clean-minimal', 'bold-marketing', 'golden-hour-viral', 'neon-grid-process'];
const ASPECTS = ['portrait', 'square', 'landscape', 'tall'];

test('stat value never overlaps its label (starters and packs, all aspects)', async ({ page }) => {
  test.setTimeout(120000);
  await page.route('**/_vercel/insights/**', (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/gallery');
  await goToGalleryTemplatePage(page, 'tech-mesh');
  await page.getByTestId('preview-template-tech-mesh').click();
  await page.getByTestId('slide-type-filter').selectOption('stat');
  for (const tmpl of TEMPLATES) {
    await page.getByTestId('template-select').selectOption(tmpl);
    for (const aspect of ASPECTS) {
      await page.getByTestId('aspect-filter').selectOption(aspect);
      await page.waitForTimeout(500);
      const m = await page.evaluate(() => {
        const c = document.querySelector('.slide-canvas') as HTMLElement;
        const box = (sel: string) => {
          const el = c.querySelector(sel)!;
          const r = document.createRange();
          r.selectNodeContents(el);
          const b = r.getBoundingClientRect();
          return { t: b.top, b: b.bottom };
        };
        const v = box('.stat-big-value');
        const l = box('.stat-label');
        const cr = c.getBoundingClientRect();
        const k = cr.width / c.offsetWidth;
        const fs = parseFloat(getComputedStyle(c.querySelector('.stat-big-value')!).fontSize);
        return { gap: l.t - v.b, tol: 0.1 * fs * k, labelBottom: l.b, canvasBottom: cr.bottom };
      });
      // Range rects use the font content area, which can exceed the 1.0 line box by up to ~10% of the font size depending on font metrics; real overlap was 45 design px.
      expect(m.gap, `${tmpl}/${aspect}`).toBeGreaterThanOrEqual(-m.tol);
      expect(m.labelBottom, `${tmpl}/${aspect} inside canvas`).toBeLessThanOrEqual(m.canvasBottom);
    }
  }
});

test('stat screenshots', async ({ page }) => {
  test.setTimeout(120000);
  await page.route('**/_vercel/insights/**', (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/gallery');
  await goToGalleryTemplatePage(page, 'tech-mesh');
  await page.getByTestId('preview-template-tech-mesh').click();
  const shots: Array<[string, string, string]> = [['golden-hour-viral', 'portrait', 'golden-full-portrait'], ['neon-grid-process', 'landscape', 'neon-full-landscape'], ['golden-hour-viral', 'landscape', 'golden-full-landscape'], ['neon-grid-process', 'portrait', 'neon-full-portrait']];
  for (const [tmpl, aspect, name] of shots) {
    await page.getByTestId('template-select').selectOption(tmpl);
    await page.getByTestId('aspect-filter').selectOption(aspect);
    await page.getByTestId('slide-type-filter').selectOption('stat');
    await page.waitForTimeout(600);
    await page.locator('.slide-canvas').first().screenshot({ path: `/downloads/stat-fix-${name}-v2.png` });
  }
});
