/**
 * Vector path + node editor: add a curve path, edit its nodes (drag, add, smooth/corner, delete, close),
 * and verify the rendered canvas path, persistence across reload, and the PNG export.
 */
import { test, expect, type Page } from '@playwright/test';

async function dragOnSurface(page: Page, testId: string, to: { x: number; y: number }) {
  await page.getByTestId('path-editor-surface').scrollIntoViewIfNeeded();
  const el = page.getByTestId(testId);
  const b = (await el.boundingBox())!;
  const s = (await page.getByTestId('path-editor-surface').boundingBox())!;
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await page.mouse.move(s.x + to.x * s.width, s.y + to.y * s.height, { steps: 6 });
  await page.mouse.up();
}

const canvasPathD = (page: Page) => page.getByTestId('main-canvas').locator('[data-testid^="shape-path-"] path').first().getAttribute('d');

test('add a path, edit nodes, persist, export', async ({ page }) => {
  test.setTimeout(90000);
  await page.addInitScript(() => { if (!sessionStorage.getItem('seeded')) { localStorage.clear(); sessionStorage.setItem('seeded', '1'); } });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/editor');
  await expect(page.getByTestId('main-canvas')).toBeVisible();

  await page.getByTestId('add-path-shape').click();
  await expect(page.getByTestId('path-editor')).toBeVisible();
  await expect(page.getByTestId('path-point-count')).toHaveText('4');
  const d0 = await canvasPathD(page);
  expect(d0).toContain(' C ');

  // Drag anchor 1 to a new place: the canvas path changes.
  await dragOnSurface(page, 'path-point-1', { x: 0.5, y: 0.6 });
  const d1 = await canvasPathD(page);
  expect(d1).not.toBe(d0);
  expect(d1).toContain('50 60');

  // Drag the out-handle of anchor 1 (selected after the drag): the mirrored in-handle moves too.
  await dragOnSurface(page, 'path-handle-out-1', { x: 0.8, y: 0.45 });
  const d2 = await canvasPathD(page);
  expect(d2).not.toBe(d1);

  // Click an empty spot to add a 5th point.
  await page.getByTestId('path-editor-surface').scrollIntoViewIfNeeded();
  const s = (await page.getByTestId('path-editor-surface').boundingBox())!;
  await page.mouse.click(s.x + s.width * 0.5, s.y + s.height * 0.95);
  await expect(page.getByTestId('path-point-count')).toHaveText('5');

  // Smooth/corner toggle on the new (selected) point.
  await expect(page.getByTestId('path-point-4').or(page.getByTestId('path-point-3')).first()).toBeVisible();
  const smoothBtn = page.getByTestId('path-toggle-smooth');
  await smoothBtn.click();
  await expect(page.locator('[data-testid^="path-point-"][data-smooth="true"][data-selected="true"]')).toHaveCount(1);
  await smoothBtn.click();
  await expect(page.locator('[data-testid^="path-point-"][data-smooth="true"][data-selected="true"]')).toHaveCount(0);

  // Delete the selected point.
  await page.getByTestId('path-delete-point').click();
  await expect(page.getByTestId('path-point-count')).toHaveText('4');

  // Close the shape: path ends with Z.
  await page.getByTestId('path-closed').check();
  expect(await canvasPathD(page)).toMatch(/Z$/);
  const dFinal = await canvasPathD(page);
  await page.screenshot({ path: 'test-results/vector-path-editor-v1.png' });

  // Persistence across reload.
  await page.waitForTimeout(1500);
  await page.reload();
  await expect(page.getByTestId('main-canvas')).toBeVisible();
  expect(await canvasPathD(page)).toBe(dFinal);

  // Export a PNG and check it downloads.
  await page.getByTestId('editor-export-btn').click();
  await page.getByTestId('export-menu-images').click();
  await page.getByTestId('export-format-png').click();
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 30000 }),
    page.getByTestId('export-start-btn').click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.(png|zip)$/);
});
