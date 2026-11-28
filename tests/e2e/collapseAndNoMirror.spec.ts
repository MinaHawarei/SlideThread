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
  await expect(page.locator('[data-testid="editor-desktop"], [data-testid="editor-mobile"]')).toBeVisible({ timeout: 15000 });
}

test('verify layers card collapse on desktop dock', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await createEditor(page);
  const head = page.getByTestId('dock-card-layers-head');
  await expect(head).toBeVisible();
  await expect(head).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByTestId('layers-panel')).toBeVisible();
  await page.screenshot({ path: '/downloads/patch4-collapse-desktop-layers-expanded.png' });
  await head.click();
  await expect(head).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByTestId('layers-panel')).toBeHidden();
  await page.screenshot({ path: '/downloads/patch4-collapse-desktop-layers-collapsed.png' });
  await page.getByTestId('rail-collapse-btn').click();
  await expect(page.getByTestId('rail-expand-btn')).toBeVisible();
  await page.screenshot({ path: '/downloads/patch4-collapse-desktop-rail-collapsed.png' });
  await page.getByTestId('rail-expand-btn').click();
  await expect(page.getByTestId('rail-collapse-btn')).toBeVisible();
  await page.getByTestId('dock-collapse-btn').click();
  await expect(page.getByTestId('dock-expand-btn')).toBeVisible();
  await page.screenshot({ path: '/downloads/patch4-collapse-desktop-dock-collapsed.png' });
});

test('verify layers card collapse in mobile edit sheet', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await createEditor(page);
  await page.getByTestId('mobile-tab-edit').click();
  const head = page.getByTestId('mobile-card-layers-head');
  await expect(head).toBeVisible();
  await expect(head).toHaveAttribute('aria-expanded', 'true');
  await page.screenshot({ path: '/downloads/patch4-collapse-mobile-layers-expanded.png' });
  await head.click();
  await expect(head).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByTestId('layers-panel')).toBeHidden();
  await page.screenshot({ path: '/downloads/patch4-collapse-mobile-layers-collapsed.png' });
});

test('no layout mirror in Arabic (desktop)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    window.localStorage.setItem('slidethread:locale', JSON.stringify({ state: { locale: 'ar' }, version: 0 }));
  });
  await createEditor(page);
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  const rail = await page.getByTestId('slide-rail').boundingBox();
  const canvas = await page.getByTestId('main-canvas').boundingBox();
  const dock = await page.getByTestId('inspector').boundingBox();
  expect(rail && canvas && dock).toBeTruthy();
  expect(rail!.x).toBeLessThan(canvas!.x);
  expect(dock!.x).toBeGreaterThan(canvas!.x);
  await page.screenshot({ path: '/downloads/patch4-nomirror-desktop-ar.png' });
});

test('no layout mirror in Arabic (mobile)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    window.localStorage.setItem('slidethread:locale', JSON.stringify({ state: { locale: 'ar' }, version: 0 }));
  });
  await createEditor(page);
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await expect(page.getByTestId('editor-mobile')).toBeVisible();
  await page.screenshot({ path: '/downloads/patch4-nomirror-mobile-ar.png' });
});
