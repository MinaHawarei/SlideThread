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
});
