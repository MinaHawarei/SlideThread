import { test, expect } from '@playwright/test';

test.describe('Icons Pack E2E (§5.6, Task R6-3)', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage before test
    await page.addInitScript(() => {
      localStorage.clear();
    });
  });

  test('adds an icon from the panel, recolors it, and renders on canvas and export', async ({ page }) => {
    // Open editor
    await page.goto('/editor');
    await page.waitForLoadState('networkidle');

    const canvas = page.getByTestId('main-canvas');
    await expect(canvas).toBeVisible();

    // Find the icons picker in the sidebar inspector
    const iconsPicker = page.getByTestId('icons-picker');
    await expect(iconsPicker).toBeVisible();

    // Click the rocket icon to add it to the active slide
    const rocketBtn = page.getByTestId('add-icon-rocket');
    await expect(rocketBtn).toBeVisible();
    await rocketBtn.click();

    // Verify the icon element was added to the DOM within slide extras container
    const extrasContainer = canvas.getByTestId('slide-extras-container');
    await expect(extrasContainer).toBeVisible();

    const iconElement = extrasContainer.locator('[data-extra-kind="shape"]');
    await expect(iconElement).toBeVisible();

    // Verify SVG is rendered inside
    const svgIcon = iconElement.locator('svg');
    await expect(svgIcon).toBeVisible();

    // Adding selects the element, and the inspector shows its element properties (shape controls)
    const controls = page.getByTestId('selected-shape-controls');
    await expect(controls).toBeVisible();

    // Recolor to purple preset
    const purplePreset = page.getByTestId('shape-palette-color-#a855f7');
    await expect(purplePreset).toBeVisible();
    await purplePreset.click();

    // Verify the shape container color updated to purple
    const shapeContainer = iconElement.locator('.icon-asset-svg');
    await expect(shapeContainer).toHaveCSS('color', 'rgb(168, 85, 247)');

    // Open export dialog to test export pipeline
    const exportBtn = page.getByTestId('editor-export-btn');
    await exportBtn.click();
    await page.getByTestId('export-menu-images').click();

    const exportDialog = page.getByTestId('export-dialog');
    await expect(exportDialog).toBeVisible();

    // Switch export format to PNG
    const pngOption = page.getByTestId('export-format-png');
    await pngOption.click();

    // Trigger download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('export-start-btn').click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.png$/i);
  });
});

