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

test.describe('R8-3 Desktop Editor Chrome UX Screenshots', () => {
  const outDir = path.resolve(process.cwd(), 'docs/ux-review/R8-3/screenshots');

  test.beforeAll(() => {
    fs.mkdirSync(outDir, { recursive: true });
  });

  for (const vp of VIEWPORTS) {
    for (const theme of THEMES) {
      for (const locale of LOCALES) {
        test(`captures ${vp.width}x${vp.height} ${theme} ${locale}`, async ({ page }) => {
          await page.setViewportSize(vp);
          await page.goto('/editor');

          // Set theme
          await page.evaluate((th) => {
            if (th === 'dark') {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          }, theme);

          // Language lives in Settings (v5), not in the editor: switch there, then return.
          const wantRtl = locale === 'ar';
          const isRtl = await page.evaluate(() => document.documentElement.dir === 'rtl');
          if (isRtl !== wantRtl) {
            await page.goto('/settings');
            await page.getByTestId(wantRtl ? 'settings-lang-ar-btn' : 'settings-lang-en-btn').click();
            await page.goto('/editor');
            await page.evaluate((th) => {
              document.documentElement.classList.toggle('dark', th === 'dark');
            }, theme);
          }
          expect(await page.evaluate(() => document.documentElement.dir)).toBe(wantRtl ? 'rtl' : 'ltr');

          // Wait for editor container to be visible
          await page.waitForSelector('[data-testid="main-canvas"], [data-testid="mobile-stage-viewport"], [data-testid="editor-mobile"]');
          await page.waitForTimeout(200);

          const filePath = path.join(outDir, `${vp.width}x${vp.height}-${theme}-${locale}.jpg`);
          await page.screenshot({ path: filePath, type: 'jpeg', quality: 90 });
        });
      }
    }
  }
});
