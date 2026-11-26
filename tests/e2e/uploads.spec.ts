import { test, expect } from '@playwright/test';

test.describe('Uploads & Image Masking E2E (§5.6, Task R6-6)', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage before test
    await page.addInitScript(() => {
      localStorage.clear();
    });
  });

  test('uploads sanitized SVG, applies circle mask, and exports to PNG', async ({ page }) => {
    await page.goto('/editor');
    await page.waitForLoadState('networkidle');

    const canvas = page.getByTestId('main-canvas');
    await expect(canvas).toBeVisible();

    // 1. Go to Assets tab
    const assetsTab = page.getByTestId('tab-assets');
    await expect(assetsTab).toBeVisible();
    await assetsTab.click();

    // 2. Upload safe SVG
    const safeSvgContent = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#10b981"/></svg>';
    const fileInput = page.getByTestId('asset-file-input');

    await fileInput.setInputFiles({
      name: 'avatar-test.svg',
      mimeType: 'image/svg+xml',
      buffer: Buffer.from(safeSvgContent),
    });

    // 3. Verify element was added to canvas
    const extrasContainer = canvas.getByTestId('slide-extras-container');
    await expect(extrasContainer).toBeVisible();

    const imageElement = extrasContainer.locator('[data-extra-kind="image"]').first();
    await expect(imageElement).toBeVisible();

    // 4. In AssetsPanel.tsx, uploading automatically selects the new extra: selectElement(newExtra.id)
    // The selected image's controls (mask, fit) live in the Element Properties panel, which the Inspector shows while an element is selected.

    const imageControls = page.getByTestId('selected-image-controls');
    await expect(imageControls).toBeVisible();

    // 5. Change mask to Circle
    const circleMaskBtn = page.getByTestId('mask-circle');
    await circleMaskBtn.click();

    // Check mask styling applied (border-radius 50%)
    const maskWrapper = imageElement.locator('[data-testid^="image-extra-mask-"]');
    await expect(maskWrapper).toHaveCSS('border-radius', '50%');

    // 6. Test export to PNG with masked image
    const exportBtn = page.getByTestId('editor-export-btn');
    await exportBtn.click();

    const exportDialog = page.getByTestId('export-dialog');
    await expect(exportDialog).toBeVisible();

    const pngOption = page.getByTestId('export-format-png');
    await pngOption.click();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('export-start-btn').click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.png$/i);
  });
});
