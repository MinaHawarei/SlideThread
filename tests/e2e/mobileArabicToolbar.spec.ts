/**
 * Mobile viewport (390x844, touch) Arabic editing: the inline toolbar is fully inside the viewport,
 * Arabic text typed through the editor lands on the slide with RTL direction and survives a reload.
 */
import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

const BUTTONS = ['toolbar-bold', 'toolbar-dir-ltr', 'toolbar-dir-rtl', 'toolbar-done'];

test('mobile Arabic: toolbar inside viewport, RTL text kept after reload', async ({ page }) => {
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

  const toolbar = page.locator('[data-rich-text-toolbar="true"]');
  await expect(toolbar).toBeVisible();
  for (const tid of BUTTONS) {
    const b = await toolbar.getByTestId(tid).boundingBox();
    expect(b, `${tid} missing`).not.toBeNull();
    expect(b!.x, `${tid} left`).toBeGreaterThanOrEqual(0);
    expect(b!.y, `${tid} top`).toBeGreaterThanOrEqual(0);
    expect(b!.x + b!.width, `${tid} right`).toBeLessThanOrEqual(391);
    expect(b!.y + b!.height, `${tid} bottom`).toBeLessThanOrEqual(845);
  }
  await page.screenshot({ path: 'test-results/mobile-arabic-toolbar-v1.png' });

  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('عنوان من الموبايل');
  await page.keyboard.press('ControlOrMeta+a');
  await toolbar.getByTestId('toolbar-dir-rtl').tap();
  await toolbar.getByTestId('toolbar-done').tap();
  const heading = page.locator('.slide-canvas .slide-title-h1, .slide-canvas .slide-title-h2').first();
  await expect(heading).toContainText('عنوان من الموبايل');
  await expect.poll(() => heading.evaluate((el) => (el.closest('[dir]') as HTMLElement | null)?.getAttribute('dir') ?? getComputedStyle(el).direction)).toBe('rtl');

  await page.waitForTimeout(800);
  await page.reload();
  await expect(page.locator('.slide-canvas .slide-title-h1, .slide-canvas .slide-title-h2').first()).toContainText('عنوان من الموبايل', { timeout: 15000 });
});
