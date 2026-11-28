import { test, expect } from '@playwright/test';

test('assets library is grouped, labelled and stays open after adding an asset', async ({ page }) => {
  test.setTimeout(60000);
  await page.addInitScript(() => { if (!sessionStorage.getItem('seeded')) { localStorage.clear(); sessionStorage.setItem('seeded', '1'); } });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/editor');
  await page.getByTestId('rail-tool-media').click();
  for (const group of ['shapes', 'icons', 'emoji', 'stickers']) {
    await expect(page.getByTestId(`assets-group-${group}`)).toBeVisible();
  }
  const items = await page.locator('[data-testid^="asset-item-"]').count();
  expect(items, 'library holds well over the old 50 items').toBeGreaterThan(90);
  // Every item shows a visible text label, not only a screen-reader label.
  await expect(page.getByTestId('asset-item-hexagon')).toContainText('Hexagon');
  await expect(page.getByTestId('asset-item-calendar')).toContainText('Calendar');
  // Add two assets in a row without going back through the tab bar.
  await page.getByTestId('asset-item-hexagon').click();
  await expect(page.getByTestId('assets-grid')).toBeVisible();
  await expect(page.getByTestId('element-properties-panel')).toBeVisible();
  await page.getByTestId('asset-item-calendar').click();
  await expect(page.getByTestId('main-canvas').locator('[data-extra-kind="shape"]')).toHaveCount(2);
});
