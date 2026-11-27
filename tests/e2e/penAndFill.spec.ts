import { test, expect } from '@playwright/test';

async function open(page: import('@playwright/test').Page) {
  await page.addInitScript(() => { if (!sessionStorage.getItem('seeded')) { localStorage.clear(); sessionStorage.setItem('seeded', '1'); } });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/editor');
  await expect(page.getByTestId('main-canvas')).toBeVisible();
}

test('pen tool draws a freehand path that is added as an editable shape', async ({ page }) => {
  test.setTimeout(90000);
  await open(page);
  await page.getByTestId('rail-tool-pen').click();
  const surface = page.getByTestId('pen-draw-surface');
  await expect(surface).toBeVisible();
  const box = (await surface.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.6);
  await page.mouse.down();
  for (let i = 1; i <= 20; i++) {
    await page.mouse.move(box.x + box.width * (0.2 + i * 0.03), box.y + box.height * (0.6 - Math.sin(i / 3) * 0.15), { steps: 2 });
  }
  await page.mouse.up();
  const drawn = page.getByTestId('main-canvas').locator('[data-testid^="shape-path-"]');
  await expect(drawn).toHaveCount(1);
  const d = await drawn.locator('path').getAttribute('d');
  expect(d && d.length).toBeGreaterThan(20);
  // A stray click (no drag) must not create a shape.
  await page.mouse.click(box.x + 20, box.y + 20);
  await expect(drawn).toHaveCount(1);
  // Escape leaves pen mode.
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('pen-draw-surface')).toHaveCount(0);
});

test('library shape gets a fill and outline; new assets keep their aspect on a 4:5 slide', async ({ page }) => {
  test.setTimeout(90000);
  await open(page);
  await page.getByTestId('add-shape-badge-star').click();
  const asset = page.getByTestId('main-canvas').locator('[data-testid^="shape-asset-"]').first();
  await expect(asset).toBeVisible();
  const wrap = page.getByTestId('main-canvas').locator('[data-extra-kind="shape"]').first();
  const b = (await wrap.boundingBox())!;
  expect(Math.abs(b.width / b.height - 1), 'new shape is square on screen').toBeLessThan(0.08);
  await expect(page.getByTestId('asset-style-controls')).toBeVisible();
  await page.getByTestId('asset-fill-color').fill('#ff0000');
  await expect(asset.locator('svg').first()).toHaveAttribute('fill', '#ff0000');
  await expect(asset.locator('svg path').first()).toHaveAttribute('fill', '#ff0000');
  await expect(asset.locator('svg path').first()).not.toHaveAttribute('fill-opacity', /.+/);
  await page.getByTestId('asset-stroke-color').fill('#00ff00');
  await expect(asset).toHaveCSS('color', 'rgb(0, 255, 0)');
  await page.getByTestId('asset-fill-none').click();
  await expect(asset.locator('svg').first()).toHaveAttribute('fill', 'none');
});
