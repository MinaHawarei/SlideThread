import { test, expect } from '@playwright/test';

test('canvas selects, moves, and resets a layout slot through normalized overrides', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  await page.goto('/gallery');
  await page.getByTestId('use-template-tech-mesh').click({ force: true });
  await page.getByTestId('platform-linkedin').click();
  await page.getByTestId('type-carousel').click();
  await page.getByTestId('format-r_4_5').click();
  await page.getByTestId('orientation-portrait').click();
  await page.getByTestId('create-submit').click();

  const title = page.getByTestId('element-hit-title');
  await expect(title).toBeVisible();
  await title.click();
  await expect(page.getByTestId('sidebar-reset-title')).toBeVisible();
  const before = await title.evaluate((node) => (node as HTMLElement).style.left);
  const box = await title.boundingBox();
  if (!box) throw new Error('Title manipulation frame is not visible');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 30, box.y + box.height / 2 + 20);
  await page.mouse.up();
  await expect.poll(() => title.evaluate((node) => (node as HTMLElement).style.left)).not.toBe(before);
  await expect(page.locator('[data-testid="snap-guide"]')).toHaveCount(0);
  await page.getByTestId('sidebar-reset-title').click();
  await expect.poll(async () => Number.parseFloat(await title.evaluate((node) => (node as HTMLElement).style.left))).toBeCloseTo(Number.parseFloat(before), 3);
});

test('manipulation overlay review matrix', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('/');
  await page.goto('/gallery');
  await page.getByTestId('use-template-tech-mesh').click({ force: true });
  await page.getByTestId('platform-linkedin').click();
  await page.getByTestId('type-carousel').click();
  await page.getByTestId('format-r_4_5').click();
  await page.getByTestId('orientation-portrait').click();
  await page.getByTestId('create-submit').click();
  await expect(page.getByTestId('manipulation-layer')).toBeVisible();

  const sizes = [[360, 800], [768, 1024], [1440, 900]] as const;
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    for (const theme of ['light', 'dark']) {
      if (width < 640) await page.getByTestId('mobile-tab-design').click();
      else await page.getByTestId('tab-design').click();
      await page.getByTestId(`design-theme-${theme}`).click();
      if (width < 640) {
        await page.getByTestId('mobile-sheet-close-btn').click();
        await page.getByTestId('mobile-tab-slides').click();
      }
      for (const direction of ['ltr', 'rtl']) {
        await page.evaluate((dir) => { document.documentElement.dir = dir; }, direction);
        await expect(page.locator('html')).toHaveAttribute('dir', direction);
        await page.evaluate(({ theme: currentTheme }) => {
          document.documentElement.dataset.theme = currentTheme;
        }, { theme });
        await page.screenshot({ path: `docs/ux-review/R3-2/editor-${width}x${height}-${theme}-${direction}.png` });
      }
    }
  }
});
