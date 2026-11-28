import { test, expect, type Page } from '@playwright/test';
import { selectGalleryTemplate } from './helpers/wizard';

async function createEditor(page: Page) {
  await page.goto('/');
  await selectGalleryTemplate(page, 'tech-mesh');
  await page.getByTestId('platform-linkedin').click();
  await page.getByTestId('type-carousel').click();
  await page.getByTestId('format-r_4_5').click();
  await page.getByTestId('orientation-portrait').click();
  await page.getByTestId('create-submit').click();
}

/** Language lives on the Settings page (there is no switcher in the editor), so go there and come back to the saved project. */
async function setDirection(page: Page, direction: 'ltr' | 'rtl', width: number) {
  const locale = direction === 'rtl' ? 'ar' : 'en';
  if ((await page.locator('html').getAttribute('lang')) === locale) return;
  await page.goto('/settings');
  await page.getByTestId(direction === 'rtl' ? 'settings-lang-ar-btn' : 'settings-lang-en-btn').click();
  await page.goto('/editor');
  await expect(page.getByTestId(width < 640 ? 'editor-mobile' : 'editor-desktop')).toBeVisible({ timeout: 15000 });
}

test('keyboard editing, numeric inspector, and live announcements work in the browser', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await createEditor(page);
  const title = page.getByTestId('element-hit-title');
  await title.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByTestId('canvas-live-announcement')).toContainText('title moved');
  await expect(page.getByTestId('sidebar-x-position')).toBeVisible();
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
      if (width < 640) await page.getByTestId('mobile-tab-templates').click();
      else await page.getByTestId('tab-design').click();
      await page.getByTestId(`design-theme-${theme}`).click();
      if (width < 640) {
        await page.getByTestId('mobile-sheet-close-btn').click();
        await page.getByTestId('mobile-tab-slides').click();
      } else {
        await page.getByTestId('element-hit-title').focus();
        await expect(page.getByTestId('sidebar-x-position')).toBeVisible();
      }
      for (const direction of ['ltr', 'rtl'] as const) {
        await setDirection(page, direction, width);
        await expect(page.locator('html')).toHaveAttribute('lang', direction === 'rtl' ? 'ar' : 'en');
        await page.screenshot({ path: `docs/ux-review/R3-3/editor-${width}x${height}-${theme}-${direction}.png` });
      }
    }
  }
});
