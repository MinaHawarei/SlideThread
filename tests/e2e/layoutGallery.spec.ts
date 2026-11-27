import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const outputDirectory = path.resolve('docs/ux-review/R2-2');
const viewports = [
  { name: '360x800', width: 360, height: 800 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1440x900', width: 1440, height: 900 },
];

// /layout-preview is a DEV-only route (import.meta.env.DEV), absent from the production build CI serves.
// Run it with SPIKE_DEV=1 against the Vite dev server (PLAYWRIGHT_TEST_BASE_URL=http://localhost:5199).
test.skip(!process.env.SPIKE_DEV, 'dev-only route /layout-preview: needs the Vite dev server, run with SPIKE_DEV=1');

for (const viewport of viewports) {
  for (const theme of ['light', 'dark'] as const) {
    for (const direction of ['ltr', 'rtl'] as const) {
      test(`layout gallery ${viewport.name} ${theme} ${direction}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/layout-preview');
        const gallery = page.getByTestId('layout-gallery');
        await expect(gallery).toBeVisible();
        await expect(page.locator('[data-archetype-id]')).toHaveCount(18);
        await expect(page.locator('.layout-variant')).toHaveCount(72);
        if (theme === 'dark') await page.getByTestId('layout-theme-toggle').click();
        if (direction === 'rtl') await page.getByTestId('layout-direction-toggle').click();
        await expect(gallery).toHaveAttribute('data-theme', theme);
        await expect(gallery).toHaveAttribute('dir', direction);
        await expect(page.locator('[data-element-id="title"]').first()).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        await mkdir(outputDirectory, { recursive: true });
        await page.screenshot({
          path: path.join(outputDirectory, `layouts-${viewport.name}-${theme}-${direction}.png`),
          fullPage: false,
          animations: 'disabled',
        });
        if (viewport.name === '1440x900' && theme === 'light' && direction === 'ltr') {
          await page.screenshot({ path: path.join(outputDirectory, 'layouts-overview.png'), fullPage: true, animations: 'disabled' });
        }
      });
    }
  }
}
