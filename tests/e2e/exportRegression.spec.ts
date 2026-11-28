import { test, expect, type Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { openTemplateDialog } from './helpers/wizard';

test.describe('Task R9-1: Comprehensive Export Regression Suite', () => {
  const goldensDir = path.resolve(process.cwd(), 'docs/export-goldens');

  test.beforeAll(() => {
    if (process.env.UPDATE_GOLDENS === '1') fs.mkdirSync(goldensDir, { recursive: true });
  });

  // Each case builds a genuinely different project, so the baselines are distinct images.
  type Setup = (page: Page) => Promise<void>;
  const wizard =
    (format: string, template: string, landscape = false): Setup =>
    async (page) => {
      await page.goto('/');
      await openTemplateDialog(page, template);
      await page.getByTestId('platform-linkedin').click();
      await page.getByTestId('type-carousel').click();
      await page.getByTestId(`format-${format}`).click();
      if (landscape) await page.getByTestId('orientation-landscape').click();
      else if (format !== 'r_1_1') await page.getByTestId('orientation-portrait').click();
      await page.getByTestId('create-submit').click();
    };
  const demo =
    (id: 'demo-en-btn' | 'demo-ar-btn'): Setup =>
    async (page) => {
      await page.goto('/');
      await page.getByTestId(id).click();
    };
  const testMatrix: Array<{ id: string; desc: string; setup: Setup; width: number; height: number }> = [
    { id: 'demo-en-4x5', desc: 'demo project (English, 4:5)', setup: demo('demo-en-btn'), width: 1080, height: 1350 },
    { id: 'demo-ar-4x5', desc: 'demo project (Arabic, RTL, 4:5)', setup: demo('demo-ar-btn'), width: 1080, height: 1350 },
    { id: 'wizard-1x1-tech-mesh', desc: '1:1 tech-mesh cover', setup: wizard('r_1_1', 'tech-mesh'), width: 1080, height: 1080 },
    { id: 'wizard-16x9-bold-marketing', desc: '16:9 bold-marketing cover', setup: wizard('r_16_9', 'bold-marketing', true), width: 1920, height: 1080 },
  ];

  for (const item of testMatrix) {
    test(`export matches baseline: ${item.desc}`, async ({ page }) => {
      test.setTimeout(60000);
      await page.setViewportSize({ width: 1280, height: 800 });
      await item.setup(page);

      // Ensure editor desktop is mounted
      await expect(page.locator('[data-testid="editor-desktop"]')).toBeVisible({ timeout: 15000 });

      // Open export dialog
      const exportBtn = page.locator('[data-testid="editor-export-btn"]');
      await expect(exportBtn).toBeVisible();
      await exportBtn.click();
      await page.getByTestId('export-menu-images').click();

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

      const goldenFile = path.join(goldensDir, `golden-${item.id}.png`);
      const actualBytes = await fs.promises.readFile(downloadPath!);

      // Refresh baselines only on request (UPDATE_GOLDENS=1). A normal run compares against them.
      if (process.env.UPDATE_GOLDENS === '1') {
        await fs.promises.copyFile(downloadPath!, goldenFile);
        return;
      }

      expect(fs.existsSync(goldenFile), `missing golden ${goldenFile}; run with UPDATE_GOLDENS=1 to create it`).toBe(true);
      const goldenBytes = await fs.promises.readFile(goldenFile);

      // Decode both PNGs in the browser and compare pixels (no extra dependency).
      const diff = await page.evaluate(
        async ([a, b]) => {
          const load = (b64: string) =>
            new Promise<ImageData>((resolve, reject) => {
              const img = new Image();
              img.onload = () => {
                const c = document.createElement('canvas');
                c.width = img.naturalWidth;
                c.height = img.naturalHeight;
                const ctx = c.getContext('2d')!;
                ctx.drawImage(img, 0, 0);
                resolve(ctx.getImageData(0, 0, c.width, c.height));
              };
              img.onerror = () => reject(new Error('png decode failed'));
              img.src = `data:image/png;base64,${b64}`;
            });
          const [x, y] = await Promise.all([load(a!), load(b!)]);
          if (x.width !== y.width || x.height !== y.height) {
            return { sizeMismatch: `${x.width}x${x.height} vs ${y.width}x${y.height}`, size: `${x.width}x${x.height}`, changedRatio: 1 };
          }
          let changed = 0;
          for (let i = 0; i < x.data.length; i += 4) {
            const d = Math.max(
              Math.abs(x.data[i]! - y.data[i]!),
              Math.abs(x.data[i + 1]! - y.data[i + 1]!),
              Math.abs(x.data[i + 2]! - y.data[i + 2]!),
            );
            if (d > 24) changed += 1;
          }
          return { sizeMismatch: '', size: `${x.width}x${x.height}`, changedRatio: changed / (x.data.length / 4) };
        },
        [actualBytes.toString('base64'), goldenBytes.toString('base64')] as [string, string],
      );
      await fs.promises.mkdir(path.resolve(process.cwd(), 'test-results/export-actual'), { recursive: true });
      await fs.promises.copyFile(downloadPath!, path.resolve(process.cwd(), `test-results/export-actual/${path.basename(goldenFile)}`));
      expect(diff.sizeMismatch, 'export size differs from golden').toBe('');
      expect(diff.size, 'export dimensions for this format').toBe(`${item.width}x${item.height}`);
      expect(diff.changedRatio, `share of changed pixels vs ${path.basename(goldenFile)}`).toBeLessThan(0.01);
    });
  }
});
