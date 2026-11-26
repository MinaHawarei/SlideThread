/**
 * Save this project's design as a template: moved title, hidden body and an added shape are captured, the dialog
 * reports skipped content, the saved package survives reload, and a new project from it reproduces the design.
 */
import { test, expect, type Page } from '@playwright/test';
import { finishLockedWizard } from './helpers/wizard';

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
  await expect(page.getByTestId('editor-desktop')).toBeVisible({ timeout: 15000 });
}

/** Position of an element relative to the slide canvas, in percent, so it is independent of zoom. */
const relBox = (page: Page, selector: string) => page.evaluate((sel) => {
  const canvas = document.querySelector('[data-testid="main-canvas"] .slide-canvas') as HTMLElement;
  const el = canvas.querySelector(sel) as HTMLElement;
  const c = canvas.getBoundingClientRect(); const b = el.getBoundingClientRect();
  return { x: (b.x - c.x) / c.width * 100, y: (b.y - c.y) / c.height * 100 };
}, selector);

test('saved design reproduces moved title, hidden body and an added shape', async ({ page }) => {
  test.setTimeout(70000);
  await page.addInitScript(() => { if (!sessionStorage.getItem('seeded')) { localStorage.clear(); sessionStorage.setItem('seeded', '1'); } });
  await page.setViewportSize({ width: 1440, height: 900 });
  await createEditor(page);
  const base = await relBox(page, '.slide-title-h1');
  const subVisibleBefore = await page.getByTestId('main-canvas').locator('.slide-canvas').first().evaluate((canvas) => Array.from(canvas.querySelectorAll('.slide-sub, .slide-body')).filter((el) => (el as HTMLElement).getBoundingClientRect().width > 0 && getComputedStyle(el).visibility !== 'hidden').length);
  expect(subVisibleBefore, 'the cover subtitle is visible before it is hidden').toBeGreaterThan(0);

  // Move the title with the keyboard, hide the body, add a rectangle.
  await page.getByTestId('element-hit-title').focus();
  for (let i = 0; i < 6; i++) await page.keyboard.press('Shift+ArrowRight');
  for (let i = 0; i < 6; i++) await page.keyboard.press('Shift+ArrowDown');
  const moved = await relBox(page, '.slide-title-h1');
  expect(moved.x).toBeGreaterThan(base.x + 3);
  expect(moved.y).toBeGreaterThan(base.y + 3);
  await page.getByTestId('tab-layers').click();
  await page.getByRole('button', { name: 'Hide body' }).click();
  await page.getByTestId('tab-slide').click();
  await page.getByTestId('add-shape-line-arrow').click();
  const shapes = page.getByTestId('main-canvas').getByTestId('slide-extras-container').locator('> *');
  const shapeCount = await shapes.count();
  expect(shapeCount).toBeGreaterThan(0);

  // Dialog: empty name is rejected, summary shows aspect and the cover design source.
  await page.getByTestId('tab-design').click();
  await page.getByTestId('design-save-template-btn').click();
  await expect(page.getByTestId('save-design-aspect')).toHaveText('portrait');
  await expect(page.getByTestId('save-design-type-cover')).toContainText('slide 1');
  await page.getByTestId('save-design-submit').click();
  await expect(page.getByTestId('save-design-error')).toContainText(/name/i);
  await page.getByTestId('save-design-name').fill('Moved Title Look');
  await page.screenshot({ path: 'test-results/save-design-dialog-v1.png' });
  await page.getByTestId('save-design-submit').click();
  await expect(page.getByTestId('save-design-done')).toBeVisible({ timeout: 20000 });
  await page.getByTestId('save-design-close').click();

  // Survives a reload and appears in the gallery.
  await page.goto('/gallery');
  await page.reload();
  await expect(page.getByTestId('user-template-card-my-moved-title-look')).toBeVisible({ timeout: 15000 });
  await page.getByTestId('use-user-template-my-moved-title-look').click();
  await finishLockedWizard(page);
  await expect(page.getByTestId('main-canvas')).toBeVisible({ timeout: 20000 });

  const again = await relBox(page, '.slide-title-h1');
  expect(Math.abs(again.x - moved.x), `x ${again.x} vs ${moved.x}`).toBeLessThan(1.5);
  expect(Math.abs(again.y - moved.y), `y ${again.y} vs ${moved.y}`).toBeLessThan(1.5);
  // The hidden cover subtitle stays hidden in the new project (absent or not visible).
  const subVisible = await page.getByTestId('main-canvas').locator('.slide-canvas').first().evaluate((canvas) => Array.from(canvas.querySelectorAll('.slide-sub, .slide-body')).filter((el) => { const r = (el as HTMLElement).getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; }).length);
  expect(subVisible).toBe(0);
  expect(await page.getByTestId('main-canvas').getByTestId('slide-extras-container').locator('> *').count()).toBeGreaterThanOrEqual(shapeCount);
  await page.screenshot({ path: 'test-results/save-design-used-v1.png' });
});

test('a design saved from a user-package base exports and imports on a fresh browser profile', async ({ page, browser }) => {
  test.setTimeout(100000);
  await page.addInitScript(() => { if (!sessionStorage.getItem('seeded')) { localStorage.clear(); sessionStorage.setItem('seeded', '1'); } });
  await page.setViewportSize({ width: 1440, height: 900 });
  await createEditor(page);
  await page.getByTestId('tab-slide').click();
  await page.getByTestId('add-shape-line-arrow').click();
  await page.getByTestId('tab-design').click();
  await page.getByTestId('design-save-template-btn').click();
  await page.getByTestId('save-design-name').fill('First Look');
  await page.getByTestId('save-design-submit').click();
  await expect(page.getByTestId('save-design-done')).toBeVisible({ timeout: 20000 });

  // Second generation: the base is now a user package.
  await page.goto('/gallery');
  await page.getByTestId('use-user-template-my-first-look').click();
  await finishLockedWizard(page);
  await expect(page.getByTestId('main-canvas')).toBeVisible({ timeout: 20000 });
  await page.getByTestId('element-hit-title').focus();
  for (let i = 0; i < 5; i++) await page.keyboard.press('Shift+ArrowDown');
  const moved = await relBox(page, '.slide-title-h1');
  await page.getByTestId('tab-design').click();
  await page.getByTestId('design-save-template-btn').click();
  // The arrow that came from the base is kept (bundled), not reported as skipped.
  await expect(page.getByTestId('save-design-skipped')).toHaveCount(0);
  await page.getByTestId('save-design-name').fill('Second Look');
  await page.getByTestId('save-design-submit').click();
  await expect(page.getByTestId('save-design-done')).toBeVisible({ timeout: 20000 });

  await page.goto('/gallery');
  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('export-user-template-my-second-look').click();
  const download = await downloadPromise;
  const zipPath = `test-results/${download.suggestedFilename()}`;
  await download.saveAs(zipPath);

  // Fresh profile has neither First Look nor any other template: import must succeed on its own.
  const fresh = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page2 = await fresh.newPage();
  await page2.goto('/gallery');
  await page2.getByTestId('template-zip-input').setInputFiles(zipPath);
  await expect(page2.getByTestId('template-import-error')).toHaveCount(0);
  await expect(page2.getByTestId('user-template-card-my-second-look')).toBeVisible({ timeout: 20000 });
  await expect(page2.getByTestId('user-template-card-my-first-look')).toHaveCount(0);
  await page2.getByTestId('use-user-template-my-second-look').click();
  await finishLockedWizard(page2);
  await expect(page2.getByTestId('main-canvas')).toBeVisible({ timeout: 20000 });
  const imported = await relBox(page2, '.slide-title-h1');
  expect(Math.abs(imported.y - moved.y), `y ${imported.y} vs ${moved.y}`).toBeLessThan(1.5);
  expect(await page2.getByTestId('main-canvas').getByTestId('slide-extras-container').locator('> *').count(), 'bundled arrow survives transfer').toBeGreaterThan(0);
  await page2.screenshot({ path: 'test-results/save-design-transferred-v1.png' });
  await fresh.close();
});
