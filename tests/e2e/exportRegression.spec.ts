import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Task R9-1: Comprehensive Export Regression Suite', () => {
  const goldensDir = path.resolve(process.cwd(), 'docs/export-goldens');

  test.beforeAll(() => {
    fs.mkdirSync(goldensDir, { recursive: true });
  });

  const testMatrix = [
    { format: 'r_4_5', theme: 'light', lang: 'en', desc: '4:5 LinkedIn light en' },
    { format: 'r_4_5', theme: 'dark', lang: 'ar', desc: '4:5 LinkedIn dark ar' },
    { format: 'r_1_1', theme: 'light', lang: 'ar', desc: '1:1 Square light ar' },
    { format: 'r_9_16', theme: 'dark', lang: 'en', desc: '9:16 Story dark en' },
    { format: 'r_16_9', theme: 'light', lang: 'en', desc: '16:9 Landscape light en' },
  ];

  for (const item of testMatrix) {
    test(`exports goldens for ${item.desc}`, async ({ page }) => {
      test.setTimeout(45000);
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto('/');

      const demoBtn = page.locator('[data-testid="demo-en-btn"]');
      await expect(demoBtn).toBeVisible();
      await demoBtn.click();

      // Ensure editor desktop is mounted
      await expect(page.locator('[data-testid="editor-desktop"]')).toBeVisible();

      // Set language
      if (item.lang === 'ar') {
        const langBtn = page.getByTestId('language-switcher');
        const isAr = await page.evaluate(() => document.documentElement.dir === 'rtl');
        if (!isAr && (await langBtn.isVisible())) {
          await langBtn.click();
        }
      }

      // Set theme
      await page.evaluate((th) => {
        if (th === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }, item.theme);

      // Open export dialog
      const exportBtn = page.locator('[data-testid="editor-export-btn"]');
      await expect(exportBtn).toBeVisible();
      await exportBtn.click();

      const dialog = page.locator('[data-testid="export-dialog"]');
      await expect(dialog).toBeVisible();

      // Export single PNG
      await page.locator('[data-testid="export-format-png"]').click();
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.locator('[data-testid="export-start-btn"]').click(),
      ]);

      const downloadPath = await download.path();
      expect(downloadPath).toBeTruthy();
      const stats = await fs.promises.stat(downloadPath!);
      expect(stats.size).toBeGreaterThan(1000);

      // Save to goldens
      const goldenFile = path.join(goldensDir, `golden-${item.format}-${item.theme}-${item.lang}.png`);
      await fs.promises.copyFile(downloadPath!, goldenFile);
    });
  }
});
