import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { test, expect } from '@playwright/test';

const outputDirectory = path.resolve('docs/ux-review/R1-3');
const viewports = [
  { name: '360x800', width: 360, height: 800 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1440x900', width: 1440, height: 900 },
];
const themes = ['light', 'dark'] as const;
const directions = ['ltr', 'rtl'] as const;

for (const viewport of viewports) {
  for (const theme of themes) {
    for (const direction of directions) {
      test(`kit screenshot ${viewport.name} ${theme} ${direction}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/kit');
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        await page.getByRole('button', { name: theme === 'light' ? 'Light' : 'Dark' }).click();
        await page.getByRole('button', { name: direction.toUpperCase() }).click();
        await expect(page.locator('.atelier-kit')).toHaveAttribute('data-theme', theme);
        await expect(page.locator('.atelier-kit')).toHaveAttribute('dir', direction);
        await page.evaluate(() => document.fonts.ready);
        await mkdir(outputDirectory, { recursive: true });
        await page.screenshot({
          path: path.join(outputDirectory, `kit-${viewport.name}-${theme}-${direction}.png`),
          fullPage: true,
          animations: 'disabled',
        });
      });
    }
  }
}
