import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';

const outputDirectory = path.resolve('docs/ux-review/R1-4');
const viewports = [
  { name: '360x800', width: 360, height: 800 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1440x900', width: 1440, height: 900 },
];

test('primary navigation opens gallery and settings routes', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page).toHaveURL(/\/settings$/);
  await expect(page.getByRole('heading', { name: 'Make it yours' })).toBeVisible();
  await page.getByRole('link', { name: 'Gallery' }).click();
  await expect(page).toHaveURL(/\/gallery$/);
  await expect(page.getByRole('heading', { name: /Component Gallery/ })).toBeVisible();
});

test('editor route loads lazily and returns home through history navigation', async ({ page }) => {
  await page.goto('/editor');
  await expect(page.getByTestId('editor-desktop')).toBeVisible({ timeout: 15000 });
  await page.getByTestId('editor-home-btn').click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByTestId('start-screen')).toBeVisible();
});

for (const viewport of viewports) {
  for (const theme of ['light', 'dark'] as const) {
    for (const direction of ['ltr', 'rtl'] as const) {
      test(`settings shell screenshot ${viewport.name} ${theme} ${direction}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/settings');
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        if (direction === 'rtl') {
          await page.getByRole('button', { name: /Language/ }).click();
          await expect(page.getByRole('heading', { level: 1 })).toHaveText('اجعله يعبر عنك');
        }
        await page.locator('.settings-shell').evaluate((element, state) => {
          element.setAttribute('data-theme', state.theme);
          element.setAttribute('dir', state.direction);
        }, { theme, direction });
        await page.evaluate(() => document.fonts.ready);
        await mkdir(outputDirectory, { recursive: true });
        await page.screenshot({
          path: path.join(outputDirectory, `shell-${viewport.name}-${theme}-${direction}.png`),
          fullPage: true,
          animations: 'disabled',
        });
      });
    }
  }
}
