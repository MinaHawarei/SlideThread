import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';

const outputDirectory = path.resolve('docs/ux-review/R1-5');
const viewports = [
  { name: '360x800', width: 360, height: 800 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1440x900', width: 1440, height: 900 },
];

test('loads the Coptic font locally when Coptic text requests it', async ({ page }) => {
  await page.goto('/settings');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const result = await page.evaluate(async () => {
    // @ts-expect-error The browser test imports this Vite-served source module at runtime.
    const { loadFont } = await import('/src/fonts/loader.ts');
    await loadFont('noto-sans-coptic', 400);
    const faces = await document.fonts.load('400 32px "Noto Sans Coptic"', 'Ϣⲉⲛⲟⲩϩ');
    return { faceCount: faces.length, isReady: document.fonts.check('400 32px "Noto Sans Coptic"', 'Ϣⲉⲛⲟⲩϩ') };
  });
  expect(result.faceCount).toBeGreaterThan(0);
  expect(result.isReady).toBe(true);
});

for (const viewport of viewports) {
  for (const theme of ['light', 'dark'] as const) {
    for (const direction of ['ltr', 'rtl'] as const) {
      test(`font specimen ${viewport.name} ${theme} ${direction}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/settings');
        if (direction === 'rtl') {
          await page.getByRole('button', { name: /Language/ }).click();
          await expect(page.getByRole('heading', { level: 1 })).toHaveText('اجعله يعبر عنك');
        }
        const fontFamily = direction === 'rtl' ? 'IBM Plex Sans Arabic' : 'IBM Plex Sans';
        const textSample = direction === 'rtl' ? 'الإعدادات' : 'Settings';
        expect(await page.evaluate(({ fontFamily: family, text }) => document.fonts.check(`400 16px "${family}"`, text), {
          fontFamily,
          text: textSample,
        })).toBe(true);
        await page.locator('.settings-shell').evaluate((element, state) => {
          element.setAttribute('data-theme', state.theme);
          document.documentElement.setAttribute('data-theme', state.theme);
          element.setAttribute('dir', state.direction);
        }, { theme, direction });
        await page.evaluate(() => document.fonts.ready);
        await mkdir(outputDirectory, { recursive: true });
        await page.screenshot({
          path: path.join(outputDirectory, `fonts-${viewport.name}-${theme}-${direction}.png`),
          fullPage: true,
          animations: 'disabled',
        });
      });
    }
  }
}
