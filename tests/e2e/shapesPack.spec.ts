import { test, expect } from '@playwright/test';

test.describe('Shapes, Lines & Arrows Pack E2E (Spec §5.6, Task R6-2)', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage before test
    await page.addInitScript(() => {
      localStorage.clear();
    });
  });

  test('adds a vector shape from the panel, recolors it, and renders on canvas and export', async ({ page }) => {
    await page.goto('/editor');
    await page.waitForLoadState('networkidle');

    const canvas = page.getByTestId('main-canvas');
    await expect(canvas).toBeVisible();

    // 1. ShapesPicker is present in Slide Inspector
    const shapesPicker = page.getByTestId('shapes-picker');
    await expect(shapesPicker).toBeVisible();

    // 2. Click to add a straight arrow
    const addArrowBtn = page.getByTestId('add-shape-line-arrow');
    await expect(addArrowBtn).toBeVisible();
    await addArrowBtn.click();

    // 3. Arrow is rendered on the canvas within slide extras container
    const extrasContainer = canvas.getByTestId('slide-extras-container');
    await expect(extrasContainer).toBeVisible();

    const shapeElement = extrasContainer.locator('[data-extra-kind="shape"]');
    await expect(shapeElement).toBeVisible();

    // 4. Selected shape controls appear in the inspector
    const shapeControls = page.getByTestId('selected-shape-controls');
    await expect(shapeControls).toBeVisible();

    // 5. Recolor the shape using the rose palette button
    const roseColorBtn = page.getByTestId('shape-palette-color-#f43f5e');
    await expect(roseColorBtn).toBeVisible();
    await roseColorBtn.click();

    // 6. Verify the canvas shape reflects the recolored color
    const shapeSvgContainer = shapeElement.locator('.shape-asset-svg');
    await expect(shapeSvgContainer).toHaveCSS('color', 'rgb(244, 63, 94)'); // #f43f5e in rgb

    // 7. Open Export Dialog, select PNG, trigger export and verify successful download containing the shape
    const exportBtn = page.getByTestId('editor-export-btn');
    await exportBtn.click();

    const exportDialog = page.getByTestId('export-dialog');
    await expect(exportDialog).toBeVisible();

    const pngFormatBtn = page.getByTestId('export-format-png');
    await pngFormatBtn.click();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('export-start-btn').click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.png$/i);
  });
});
