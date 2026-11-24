import { test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const VIEWPORTS = [
  { width: 360, height: 800 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
];

const THEMES = ['light', 'dark'] as const;
const LOCALES = ['en', 'ar'] as const;

test.describe('R8-1 Home Screen UX Screenshots', () => {
  const outDir = path.resolve(process.cwd(), 'docs/ux-review/R8-1/screenshots');

  test.beforeAll(() => {
    fs.mkdirSync(outDir, { recursive: true });
  });

  for (const vp of VIEWPORTS) {
    for (const theme of THEMES) {
      for (const locale of LOCALES) {
        test(`captures ${vp.width}x${vp.height} ${theme} ${locale}`, async ({ page }) => {
          await page.setViewportSize(vp);
          await page.goto('/');

          // Set theme
          await page.evaluate((th) => {
            if (th === 'dark') {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          }, theme);

          // Set locale if needed
          if (locale === 'ar') {
            const langBtn = page.getByTestId('language-switcher');
            const isCurrentlyAr = await page.evaluate(() => document.documentElement.dir === 'rtl');
            if (!isCurrentlyAr) {
              await langBtn.click();
            }
          } else {
            const isCurrentlyAr = await page.evaluate(() => document.documentElement.dir === 'rtl');
            if (isCurrentlyAr) {
              const langBtn = page.getByTestId('language-switcher');
              await langBtn.click();
            }
          }

          // Wait for carousel to be visible
          await page.waitForSelector('[data-testid="hero-carousel"]');
          await page.waitForTimeout(200);

          const filePath = path.join(outDir, `${vp.width}x${vp.height}-${theme}-${locale}.jpg`);
          await page.screenshot({ path: filePath, type: 'jpeg', quality: 90 });
        });
      }
    }
  }
});
