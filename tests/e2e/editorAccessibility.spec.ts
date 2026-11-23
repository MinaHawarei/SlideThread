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
}

test('keyboard editing, numeric inspector, and live announcements work in the browser', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await createEditor(page);
  const title = page.getByTestId('element-hit-title');
  await title.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByTestId('canvas-live-announcement')).toContainText('title moved');
  await expect(page.getByTestId('element-numeric-inspector')).toBeVisible();
  const x = page.getByRole('spinbutton', { name: 'X position (%)' });
  await x.fill('20');
  await expect(x).toHaveValue('20');
});

test('keyboard accessibility review matrix', async ({ page }) => {
  test.setTimeout(120000);
  await createEditor(page);
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
      } else {
        await page.getByTestId('element-hit-title').focus();
        await expect(page.getByTestId('element-numeric-inspector')).toBeVisible();
      }
      for (const direction of ['ltr', 'rtl']) {
        if (await page.locator('html').getAttribute('dir') !== direction) await page.getByTestId('language-switcher').click();
        await expect(page.locator('html')).toHaveAttribute('dir', direction);
        await page.screenshot({ path: `docs/ux-review/R3-3/editor-${width}x${height}-${theme}-${direction}.png` });
      }
    }
  }
});
