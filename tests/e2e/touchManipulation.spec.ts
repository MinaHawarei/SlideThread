import { test, expect, type Page } from '@playwright/test';
import { setDirection } from './helpers/direction';

test.use({ viewport: { width: 360, height: 800 }, hasTouch: true, isMobile: true });

async function createEditor(page: Page) {
  await page.goto('/');
  await page.goto('/gallery');
  await page.getByTestId('use-template-tech-mesh').click({ force: true });
  await page.getByTestId('platform-linkedin').click();
  await page.getByTestId('type-carousel').click();
  await page.getByTestId('format-r_4_5').click();
  await page.getByTestId('orientation-portrait').click();
  await page.getByTestId('create-submit').click();
}

test('mobile canvas exposes touch targets at both required widths', async ({ page }) => {
  for (const [width, height] of [[360, 800], [390, 844]] as const) {
    // Fresh project per width: scaling the same title twice hits the geometry clamp.
    await page.setViewportSize({ width, height });
    await createEditor(page);
    const title = page.getByTestId('element-hit-title');
    await title.tap();
    const toolbar = page.getByTestId('mobile-selection-toolbar');
    await expect(toolbar).toBeVisible();
    const buttons = toolbar.getByRole('button');
    await expect(buttons).toHaveCount(3);
    for (let i = 0; i < 3; i += 1) {
      const box = await buttons.nth(i).boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
      expect(box?.width).toBeGreaterThanOrEqual(44);
    }
    // Slots now also expose a resize handle; the toolbar Scale buttons must visibly change the slot.
    await expect(page.getByTestId('resize-title')).toBeVisible();

    const before = await title.evaluate((node) => Number.parseFloat((node as HTMLElement).style.width));
    await toolbar.getByRole('button', { name: 'Scale down' }).tap();
    await expect.poll(async () => Number.parseFloat(await title.evaluate((node) => (node as HTMLElement).style.width))).toBeLessThan(before);
  }
});

test('touch manipulation review matrix', async ({ page }) => {
  test.setTimeout(120000);
  await createEditor(page);
  for (const [width, height] of [[360, 800], [768, 1024], [1440, 900]] as const) {
    await page.setViewportSize({ width, height });
    await expect(page.getByTestId(width < 768 ? 'mobile-bottom-tabs' : 'tab-design')).toBeVisible();
    for (const theme of ['light', 'dark']) {
      if (width < 640) await page.getByTestId('mobile-tab-design').click();
      else await page.getByTestId('tab-design').click();
      await page.getByTestId(`design-theme-${theme}`).click();
      if (width < 640) {
        await page.getByTestId('mobile-sheet-close-btn').click();
        await page.getByTestId('mobile-tab-slides').click();
      }
      if (width < 768) await page.getByTestId('element-hit-title').click();
      else await page.getByTestId('element-hit-title').focus();
      for (const direction of ['ltr', 'rtl']) {
        await setDirection(page, direction as 'ltr' | 'rtl');
        await expect(page.locator('html')).toHaveAttribute('dir', direction);
        await page.evaluate(({ mode }) => { document.documentElement.dataset.theme = mode; }, { mode: theme });
        await page.screenshot({ path: `docs/ux-review/R3-4/editor-${width}x${height}-${theme}-${direction}.png` });
      }
    }
  }
});
