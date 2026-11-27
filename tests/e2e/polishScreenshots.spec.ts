import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const VIEWPORTS = [
  { width: 360, height: 800 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
];

const THEMES = ['light', 'dark'] as const;
const LOCALES = ['en', 'ar'] as const;

test.describe('R8-7 Visual Polish UX Screenshots', () => {
  const outDir = path.resolve(process.cwd(), 'docs/ux-review/R8-7/screenshots');

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

          // Language lives in Settings (v5): switch there, then return to the page under test.
          const wantRtl = locale === 'ar';
          const isRtl = await page.evaluate(() => document.documentElement.dir === 'rtl');
          if (isRtl !== wantRtl) {
            const back = new URL(page.url()).pathname + new URL(page.url()).search;
            await page.goto('/settings');
            await page.getByTestId(wantRtl ? 'settings-lang-ar-btn' : 'settings-lang-en-btn').click();
            await page.goto(back);
            await page.evaluate((th) => {
              document.documentElement.classList.toggle('dark', th === 'dark');
            }, theme);
          }
          expect(await page.evaluate(() => document.documentElement.dir)).toBe(wantRtl ? 'rtl' : 'ltr');

          // Scroll to bottom to capture polished footer
          await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
          await page.waitForTimeout(150);

          const filePath = path.join(outDir, `${vp.width}x${vp.height}-${theme}-${locale}.jpg`);
          await page.screenshot({ path: filePath, type: 'jpeg', quality: 90 });
        });
      }
    }
  }
});
