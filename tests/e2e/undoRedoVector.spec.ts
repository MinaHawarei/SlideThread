import { test, expect, type Page } from '@playwright/test';

const paths = (page: Page) => page.getByTestId('main-canvas').locator('[data-testid^="shape-path-"]');

test('undo/redo covers Bezier pen paths, convert to path and fill changes', async ({ page }) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/editor');
  await expect(page.getByTestId('main-canvas')).toBeVisible();
  await page.getByTestId('rail-tool-draw').click();
  await page.getByTestId('rail-tool-bezier').click();
  const b = (await page.getByTestId('bezier-pen-surface').boundingBox())!;
  for (const [x, y] of [[0.3, 0.3], [0.7, 0.3], [0.5, 0.7], [0.3, 0.3]] as Array<[number, number]>) await page.mouse.click(b.x + b.width * x, b.y + b.height * y);
  await expect(paths(page)).toHaveCount(1);
  await page.getByTestId('path-fill-color').fill('#00ff00');
  await expect(paths(page).locator('path')).toHaveAttribute('fill', '#00ff00');
  await page.getByTestId('editor-undo-btn').click();
  await expect(paths(page).locator('path')).toHaveAttribute('fill', 'none');
  await page.getByTestId('editor-redo-btn').click();
  await expect(paths(page).locator('path')).toHaveAttribute('fill', '#00ff00');
  await page.getByTestId('editor-undo-btn').click();
  await page.getByTestId('editor-undo-btn').click();
  await expect(paths(page)).toHaveCount(0);
  await page.getByTestId('editor-redo-btn').click();
  await expect(paths(page)).toHaveCount(1);

  // Convert a library shape, then undo returns it to a library asset.
  // (Drawing selected the path, which flipped the dock to Properties; back to Slide tab.)
  await page.getByTestId('tab-slide').click();
  await page.getByTestId('add-shape-hexagon').click();
  await page.getByTestId('convert-to-path').click();
  await expect(paths(page)).toHaveCount(2);
  await page.getByTestId('editor-undo-btn').click();
  await expect(paths(page)).toHaveCount(1);
  await expect(page.getByTestId('main-canvas').locator('[data-testid^="shape-asset-"]')).toHaveCount(1);
});

test('undo/redo restores layer order after a reorder', async ({ page }) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.getByTestId('demo-en-btn').click();
  await expect(page.getByTestId('editor-desktop')).toBeVisible();
  const order = () => page.locator('[data-testid="layers-panel"] li').evaluateAll((items) => items.map((i) => (i as HTMLElement).dataset.testid));
  const before = await order();
  await page.getByRole('button', { name: 'Move title backward' }).click();
  const moved = await order();
  expect(moved).not.toEqual(before);
  await page.getByTestId('editor-undo-btn').click();
  expect(await order()).toEqual(before);
  await page.getByTestId('editor-redo-btn').click();
  expect(await order()).toEqual(moved);
});
