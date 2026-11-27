/**
 * Mobile viewport (390x844, touch) Arabic editing: the inline editor shows no toolbar or icons,
 * Arabic text typed through the editor lands on the slide with RTL direction and survives a reload.
 */
import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

test('mobile Arabic: no inline toolbar, RTL text kept after reload', async ({ page }) => {
  test.setTimeout(70000);
  await page.goto('/');
  await expect(page.getByTestId('start-screen')).toBeVisible({ timeout: 15000 });
  await page.getByTestId('demo-ar-btn').click();
  const title = page.getByTestId('element-hit-title').first();
  await expect(title).toBeVisible({ timeout: 15000 });

  let box = (await title.boundingBox())!;
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(600);
  box = (await title.boundingBox())!;
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  const editor = page.getByTestId('rich-text-contenteditable').first();
  await expect(editor).toBeVisible({ timeout: 8000 });

  await expect(page.locator('[data-rich-text-toolbar="true"]')).toHaveCount(0);
  await expect(page.getByTestId('rich-text-floating-toolbar')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/mobile-arabic-no-toolbar-v1.png' });

  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('عنوان من الموبايل');
  await page.keyboard.press('Escape');
  const heading = page.locator('.slide-canvas .slide-title-h1, .slide-canvas .slide-title-h2').first();
  await expect(heading).toContainText('عنوان من الموبايل');
  await expect.poll(() => heading.evaluate((el) => (el.closest('[dir]') as HTMLElement | null)?.getAttribute('dir') ?? getComputedStyle(el).direction)).toBe('rtl');

  await page.waitForTimeout(800);
  await page.reload();
  await expect(page.locator('.slide-canvas .slide-title-h1, .slide-canvas .slide-title-h2').first()).toContainText('عنوان من الموبايل', { timeout: 15000 });
});
