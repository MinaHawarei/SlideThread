import { test, expect, type Page } from '@playwright/test';

async function createEditor(page: Page) {
  await page.goto('/');
  await page.getByTestId('start-wizard-btn').click();
  await page.getByTestId('platform-linkedin').click();
  await page.getByTestId('wizard-next-btn').click();
  await page.getByTestId('type-carousel').click();
  await page.getByTestId('wizard-next-btn').click();
  await page.getByTestId('format-r_4_5').click();
  await page.getByTestId('wizard-next-btn').click();
  await page.getByTestId('template-tech-mesh').click();
  await page.getByTestId('wizard-create-btn').click();
  await expect(page.locator('[data-testid="editor-desktop"], [data-testid="editor-mobile"]')).toBeVisible({ timeout: 15000 });
}

async function toggleLayers(page: Page) {
  const button = page.getByTestId('layers-toggle');
  await button.focus();
  await page.keyboard.press('Enter');
}

test('layers panel locks, hides, and reorders template slots', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await createEditor(page);
  await page.getByTestId('layers-toggle').click();
  const title = page.locator('[data-testid="main-canvas"] .slide-canvas .slide-title-h1');
  await page.getByRole('button', { name: 'Hide title' }).click();
  await expect(title).toHaveCSS('visibility', 'hidden');
  await page.getByRole('button', { name: 'Show title' }).click();
  await expect(title).toHaveCSS('visibility', 'visible');
  await page.getByRole('button', { name: 'Lock title' }).click();
  await expect(page.getByTestId('element-hit-title')).toHaveAttribute('tabindex', '-1');
  await page.getByRole('button', { name: 'Unlock title' }).click();
  await page.getByRole('button', { name: 'Move title backward' }).click();
  const rows = await page.locator('#canvas-layers-panel li').evaluateAll((items) => items.map((item) => (item as HTMLElement).dataset.testid));
  expect(rows.indexOf('layer-row-body')).toBeLessThan(rows.indexOf('layer-row-title'));
});

test('selection and layers review matrix', async ({ page }) => {
  test.setTimeout(120000);
  await createEditor(page);
  for (const [width, height] of [[360, 800], [768, 1024], [1440, 900]] as const) {
    await page.setViewportSize({ width, height });
    await expect(page.getByTestId(width < 768 ? 'mobile-bottom-tabs' : 'tab-design')).toBeVisible();
    for (const theme of ['light', 'dark']) {
      if (width < 768) await page.getByTestId('mobile-tab-design').click();
      else await page.getByTestId('tab-design').click();
      await page.getByTestId(`design-theme-${theme}`).click();
      if (width < 768) {
        await page.getByTestId('mobile-sheet-close-btn').click();
        await page.getByTestId('mobile-tab-slides').click();
      }
      if (width < 768) await page.getByTestId('element-hit-title').click();
      else await page.getByTestId('element-hit-title').focus();
      await toggleLayers(page);
      for (const direction of ['ltr', 'rtl']) {
        if (await page.locator('html').getAttribute('dir') !== direction) await page.getByTestId('language-switcher').click();
        await expect(page.locator('html')).toHaveAttribute('dir', direction);
        await page.evaluate(({ mode }) => { document.documentElement.dataset.theme = mode; }, { mode: theme });
        if (!await page.getByTestId('canvas-layers-panel').isVisible()) await toggleLayers(page);
        await expect(page.getByTestId('canvas-layers-panel')).toBeVisible();
        await page.screenshot({ path: `docs/ux-review/R3-5/editor-${width}x${height}-${theme}-${direction}.png` });
      }
      if (await page.getByTestId('canvas-layers-panel').isVisible()) await toggleLayers(page);
    }
  }
});
