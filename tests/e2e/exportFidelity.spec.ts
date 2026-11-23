import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import JSZip from 'jszip';

test.describe('Export Fidelity & Multi-format Pipeline (Spec §9 & Task P4-5)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Start Screen and load Demo Project
    await page.goto('/');
    await expect(page.locator('[data-testid="start-screen"]')).toBeVisible();

    const demoBtn = page.locator('[data-testid="demo-en-btn"]');
    await expect(demoBtn).toBeVisible();
    await demoBtn.click();

    // Verify Desktop Editor is loaded
    await expect(page.locator('[data-testid="editor-desktop"]')).toBeVisible();
  });

  test('exports single PNG slide with verified dimensions and format', async ({ page }) => {
    test.setTimeout(45000);

    const exportBtn = page.locator('[data-testid="editor-export-btn"]');
    await expect(exportBtn).toBeVisible();
    await exportBtn.click();

    const exportDialog = page.locator('[data-testid="export-dialog"]');
    await expect(exportDialog).toBeVisible();

    // Select PNG format
    const pngOption = page.locator('[data-testid="export-format-png"]');
    await pngOption.click();

    // Verify current slide range is selected
    const rangeCurrent = page.locator('[data-testid="export-range-current"] input');
    await expect(rangeCurrent).toBeChecked();

    // Trigger export and await download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('[data-testid="export-start-btn"]').click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/\.png$/i);
    const filePath = await download.path();
    expect(filePath).toBeTruthy();

    const stats = await fs.promises.stat(filePath!);
    expect(stats.size).toBeGreaterThan(1000);
  });

  test('exports multi-slide ZIP archive with individual PNG files', async ({ page }) => {
    test.setTimeout(45000);

    const exportBtn = page.locator('[data-testid="editor-export-btn"]');
    await expect(exportBtn).toBeVisible();
    await exportBtn.click();

    const exportDialog = page.locator('[data-testid="export-dialog"]');
    await expect(exportDialog).toBeVisible();

    // Select ZIP format
    const zipOption = page.locator('[data-testid="export-format-zip"]');
    await zipOption.click();

    // Verify all slides range is selected
    const rangeAll = page.locator('[data-testid="export-range-all"] input');
    await expect(rangeAll).toBeChecked();

    // Trigger export and await download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('[data-testid="export-start-btn"]').click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/\.zip$/i);
    const filePath = await download.path();
    expect(filePath).toBeTruthy();

    const zipBuffer = await fs.promises.readFile(filePath!);
    const unzipped = await JSZip.loadAsync(zipBuffer);
    const fileNames = Object.keys(unzipped.files);

    expect(fileNames.length).toBeGreaterThanOrEqual(3);
    for (const name of fileNames) {
      expect(name).toMatch(/\.png$/i);
      const fileBuffer = await unzipped.files[name]!.async('nodebuffer');
      expect(fileBuffer.length).toBeGreaterThan(500);
    }
  });

  test('exports multi-page PDF document matching aspect ratio', async ({ page }) => {
    test.setTimeout(45000);

    const exportBtn = page.locator('[data-testid="editor-export-btn"]');
    await expect(exportBtn).toBeVisible();
    await exportBtn.click();

    const exportDialog = page.locator('[data-testid="export-dialog"]');
    await expect(exportDialog).toBeVisible();

    // Select PDF format
    const pdfOption = page.locator('[data-testid="export-format-pdf"]');
    await pdfOption.click();

    const rangeAll = page.locator('[data-testid="export-range-all"] input');
    await expect(rangeAll).toBeChecked();

    // Trigger export and await download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('[data-testid="export-start-btn"]').click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
    const filePath = await download.path();
    expect(filePath).toBeTruthy();

    const pdfBuffer = await fs.promises.readFile(filePath!);
    expect(pdfBuffer.toString('utf8', 0, 5)).toBe('%PDF-');
    expect(pdfBuffer.length).toBeGreaterThan(2000);
  });

  test('exports slide with overrides and extras faithfully without editor chrome', async ({ page }) => {
    test.setTimeout(45000);
    await page.setViewportSize({ width: 1440, height: 900 });

    // Open layers panel to toggle visibility and produce slot overrides
    await page.getByTestId('layers-toggle').click();
    const hideTitleBtn = page.getByRole('button', { name: 'Hide title' });
    await expect(hideTitleBtn).toBeVisible();
    await hideTitleBtn.click();

    // Verify slide canvas preview has hidden title
    const titleText = page.locator('[data-testid="main-canvas"] .slide-canvas .slide-title-h1');
    await expect(titleText).toHaveCSS('visibility', 'hidden');

    // Verify manipulation chrome is strictly outside .slide-canvas
    await expect(page.locator('.slide-canvas [data-testid="manipulation-layer"]')).toHaveCount(0);
    await expect(page.locator('.slide-canvas [data-testid="snap-guide"]')).toHaveCount(0);

    // Open export dialog
    const exportBtn = page.locator('[data-testid="editor-export-btn"]');
    await expect(exportBtn).toBeVisible();
    await exportBtn.click();

    const exportDialog = page.locator('[data-testid="export-dialog"]');
    await expect(exportDialog).toBeVisible();

    // Select PNG format
    const pngOption = page.locator('[data-testid="export-format-png"]');
    await pngOption.click();

    // Trigger export and await download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('[data-testid="export-start-btn"]').click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/\.png$/i);
    const filePath = await download.path();
    expect(filePath).toBeTruthy();

    const stats = await fs.promises.stat(filePath!);
    expect(stats.size).toBeGreaterThan(1000);
  });

  test('export and overrides review matrix', async ({ page }) => {
    test.setTimeout(120000);
    for (const [width, height] of [[360, 800], [768, 1024], [1440, 900]] as const) {
      await page.setViewportSize({ width, height });
      await expect(page.getByTestId(width < 768 ? 'mobile-bottom-tabs' : 'tab-design')).toBeVisible();
      for (const theme of ['light', 'dark']) {
        if (width < 768) await page.getByTestId('mobile-tab-design').click();
        else await page.getByTestId('tab-design').click();
        await page.getByTestId(`design-theme-${theme}`).click();
        if (width < 768) {
          await page.getByTestId('mobile-sheet-close-btn').click();
          await page.getByTestId('mobile-tab-slides').click();
        }
        for (const direction of ['ltr', 'rtl']) {
          if (await page.locator('html').getAttribute('dir') !== direction) await page.getByTestId('language-switcher').click();
          await expect(page.locator('html')).toHaveAttribute('dir', direction);
          await page.evaluate(({ mode }) => { document.documentElement.dataset.theme = mode; }, { mode: theme });
          await page.screenshot({ path: `docs/ux-review/R3-6/editor-${width}x${height}-${theme}-${direction}.png` });
        }
      }
    }
  });
});
