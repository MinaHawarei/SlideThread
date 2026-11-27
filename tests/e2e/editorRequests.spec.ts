/**
 * Editor/gallery follow-ups:
 *  1. The Design tab has no template picker (the template is chosen at creation).
 *  2. The main color control really recolors every template: flexible starter, fixed starter, built-in packs.
 *  3. Recent Projects shows a readable format label, not r_4_5.
 *  4. Using a template in the Gallery opens the create dialog with that template already chosen.
 */
import { test, expect, type Page } from '@playwright/test';
import { finishLockedWizard } from './helpers/wizard';

const stub = (page: Page) => page.route('**/_vercel/insights/**', (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));

async function startFromGallery(page: Page, id: string) {
  await page.goto('/gallery');
  await page.getByTestId(`use-template-${id}`).click();
  await expect(page.getByTestId('create-dialog')).toBeVisible();
  await finishLockedWizard(page);
  await expect(page.getByTestId('editor-desktop')).toBeVisible({ timeout: 20000 });
}

const accOf = (page: Page) => page.evaluate(() => getComputedStyle(document.querySelector('[data-testid="main-canvas"] .slide-canvas') as HTMLElement).getPropertyValue('--acc').trim().toLowerCase());

test('gallery Use opens the create dialog with the template; orientation is required before create', async ({ page }) => {
  test.setTimeout(70000);
  await stub(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/gallery');
  await page.getByTestId('gallery-template-card').first().hover();
  await page.getByTestId('use-template-golden-hour-viral').click({ force: true });
  await expect(page).toHaveURL(/\/gallery/);
  await expect(page.getByTestId('create-dialog')).toContainText('Golden Hour Viral');
  await expect(page.getByTestId('create-submit')).toBeDisabled();
  await expect(page.getByTestId('orientation-required')).toBeVisible();
  await page.screenshot({ path: 'test-results/gallery-dialog-orientation-unselected-v1.png' });
  await page.getByTestId('orientation-portrait').click();
  await expect(page.getByTestId('create-submit')).toBeEnabled();
  await page.screenshot({ path: 'test-results/gallery-dialog-orientation-selected-v1.png' });
  await page.getByTestId('create-submit').click();
  await expect(page.getByTestId('editor-desktop')).toBeVisible({ timeout: 20000 });
  // The created project uses the preselected template (shown on the Recent Projects card).
  await page.waitForTimeout(1500);
  await page.goto('/');
  await expect(page.getByText(/4:5 • golden-hour-viral/)).toBeVisible();
});

for (const id of ['tech-mesh', 'heritage-geometric', 'golden-hour-viral', 'neon-grid-process']) {
  test(`main color recolors ${id} and the Design tab has no template picker`, async ({ page }) => {
    test.setTimeout(70000);
    await stub(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await startFromGallery(page, id);
    await page.getByTestId('tab-design').click();
    await expect(page.locator('[data-testid^="design-template-"]')).toHaveCount(0);
    const before = await accOf(page);
    await page.screenshot({ path: `test-results/color-${id}-before-v1.png` });
    await page.getByTestId('design-preset-10B981').click();
    await expect.poll(() => accOf(page)).toBe('#10b981');
    expect(before).not.toBe('#10b981');
    await expect(page.getByTestId('design-inspector')).toContainText(/#10b981/i);
    await page.screenshot({ path: `test-results/color-${id}-after-v1.png` });
    // Survives the autosave/reload.
    await page.waitForTimeout(1200);
    await page.reload();
    await expect(page.getByTestId('editor-desktop')).toBeVisible({ timeout: 20000 });
    expect(await accOf(page)).toBe('#10b981');
  });
}

test('golden pack hand-built cover text follows the main color (pixels)', async ({ page }) => {
  test.setTimeout(70000);
  await stub(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await startFromGallery(page, 'golden-hour-viral');
  const kicker = () => page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('[data-testid="main-canvas"] .slide-canvas *')).find((e) => e.children.length === 0 && e.textContent?.trim() === '4 TYPES') as HTMLElement;
    return getComputedStyle(el).color;
  });
  expect(await kicker()).toBe('rgb(238, 68, 35)'); // default orange, unchanged
  await page.getByTestId('tab-design').click();
  await page.getByTestId('design-preset-10B981').click();
  await expect.poll(kicker).toBe('rgb(16, 185, 129)');
  await page.getByTestId('main-canvas').screenshot({ path: 'test-results/golden-cover-emerald-v1.png' });
});

test('Recent Projects shows a readable format label', async ({ page }) => {
  test.setTimeout(70000);
  await stub(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await startFromGallery(page, 'tech-mesh');
  await page.waitForTimeout(1500);
  await page.goto('/');
  const list = page.getByTestId('recent-list');
  await expect(list).toBeVisible();
  await expect(list).toContainText('4:5');
  await expect(list).not.toContainText('r_4_5');
  await page.screenshot({ path: 'test-results/recent-projects-label-v1.png' });
});
