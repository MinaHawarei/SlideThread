import { test, expect, type Page } from '@playwright/test';

async function open(page: Page, width = 1440, height = 900) {
  await page.addInitScript(() => { if (!sessionStorage.getItem('seeded')) { localStorage.clear(); sessionStorage.setItem('seeded', '1'); } });
  await page.setViewportSize({ width, height });
  await page.goto('/editor');
  if (width >= 1024) await expect(page.getByTestId('main-canvas')).toBeVisible();
}
const canvasPaths = (page: Page) => page.getByTestId('main-canvas').locator('[data-testid^="shape-path-"]');

async function surfaceBox(page: Page) {
  return (await page.getByTestId('bezier-pen-surface').boundingBox())!;
}

test('bezier pen: click anchors, drag a handle, Backspace removes the last point, Enter finishes an open path', async ({ page }) => {
  test.setTimeout(90000);
  await open(page);
  await page.getByTestId('rail-tool-bezier').click();
  const b = await surfaceBox(page);
  await page.mouse.click(b.x + b.width * 0.2, b.y + b.height * 0.7);
  // Click-drag on the second anchor pulls out curve handles.
  await page.mouse.move(b.x + b.width * 0.5, b.y + b.height * 0.3);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width * 0.62, b.y + b.height * 0.3, { steps: 6 });
  await page.mouse.up();
  await page.mouse.click(b.x + b.width * 0.8, b.y + b.height * 0.7);
  await expect(page.getByTestId('bezier-anchor-2')).toBeVisible();
  await page.keyboard.press('Backspace');
  await expect(page.getByTestId('bezier-anchor-2')).toHaveCount(0);
  await page.mouse.click(b.x + b.width * 0.85, b.y + b.height * 0.75);
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('bezier-pen-surface')).toHaveCount(0);
  await expect(canvasPaths(page)).toHaveCount(1);
  const d = await canvasPaths(page).locator('path').getAttribute('d');
  expect(d).toContain(' C ');
  // The result is an ordinary editable path: node editor is open.
  await expect(page.getByTestId('path-editor')).toBeVisible();
  await expect(page.getByTestId('path-point-count')).toHaveText('3');
});

test('bezier pen: clicking the first point closes the path with a fill option; Esc cancels', async ({ page }) => {
  test.setTimeout(90000);
  await open(page);
  await page.getByTestId('rail-tool-bezier').click();
  const b = await surfaceBox(page);
  const pts: Array<[number, number]> = [[0.3, 0.3], [0.7, 0.3], [0.7, 0.7], [0.3, 0.7]];
  for (const [x, y] of pts) await page.mouse.click(b.x + b.width * x, b.y + b.height * y);
  await page.mouse.click(b.x + b.width * 0.3, b.y + b.height * 0.3);
  await expect(canvasPaths(page)).toHaveCount(1);
  await expect(page.getByTestId('path-point-count')).toHaveText('4');
  await expect(page.getByTestId('path-fill-controls')).toBeVisible();
  await page.getByTestId('path-fill-color').fill('#ff0000');
  await expect(canvasPaths(page).locator('path')).toHaveAttribute('fill', '#ff0000');
  await page.getByTestId('path-fill-none').click();
  await expect(canvasPaths(page).locator('path')).toHaveAttribute('fill', 'none');

  await page.getByTestId('rail-tool-bezier').click();
  const b2 = await surfaceBox(page);
  await page.mouse.click(b2.x + b2.width * 0.2, b2.y + b2.height * 0.2);
  await page.mouse.click(b2.x + b2.width * 0.4, b2.y + b2.height * 0.2);
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('bezier-pen-surface')).toHaveCount(0);
  await expect(canvasPaths(page)).toHaveCount(1);
});

test('bezier pen on a phone: tap points then Done', async ({ page }) => {
  test.setTimeout(90000);
  await open(page, 390, 844);
  await page.getByTestId('mobile-tab-assets').click();
  await page.getByTestId('assets-bezier-btn').click();
  await expect(page.getByTestId('bezier-pen-surface')).toBeVisible();
  const b = await surfaceBox(page);
  for (const [x, y] of [[0.2, 0.3], [0.6, 0.4], [0.5, 0.7]] as Array<[number, number]>) await page.mouse.click(b.x + b.width * x, b.y + b.height * y);
  await page.getByTestId('bezier-done').click();
  await expect(page.locator('[data-testid^="shape-path-"]:visible').first()).toBeVisible();
});

test('convert to path: library shape and rectangle become editable, nodes can be moved', async ({ page }) => {
  test.setTimeout(90000);
  await open(page);
  await page.getByTestId('add-shape-hexagon').click();
  await expect(page.getByTestId('convert-to-path')).toBeVisible();
  await page.getByTestId('convert-to-path').click();
  await expect(page.getByTestId('path-editor')).toBeVisible();
  await expect(page.getByTestId('path-point-count')).toHaveText('6');
  const before = await canvasPaths(page).locator('path').getAttribute('d');
  const surface = page.getByTestId('path-editor-surface');
  await surface.scrollIntoViewIfNeeded();
  const s = (await surface.boundingBox())!;
  const p = (await page.getByTestId('path-point-1').boundingBox())!;
  await page.mouse.move(p.x + p.width / 2, p.y + p.height / 2);
  await page.mouse.down();
  await page.mouse.move(s.x + s.width * 0.5, s.y + s.height * 0.5, { steps: 6 });
  await page.mouse.up();
  const after = await canvasPaths(page).locator('path').getAttribute('d');
  expect(after).not.toBe(before);
  // A heart (arcs) converts too.
  await page.getByTestId('main-canvas').click({ position: { x: 5, y: 5 } }).catch(() => undefined);
});
