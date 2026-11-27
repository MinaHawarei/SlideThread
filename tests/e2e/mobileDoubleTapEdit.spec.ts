import { test, expect, type Locator, type Page } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

async function stableCenter(locator: Locator) {
  let last = '';
  let box = await locator.boundingBox();
  for (let i = 0; i < 40; i += 1) {
    const key = JSON.stringify(box);
    if (key === last) break;
    last = key;
    await locator.page().waitForTimeout(150);
    box = await locator.boundingBox();
  }
  if (!box) throw new Error('element frame is not visible');
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

async function createCarousel(page: Page) {
  await page.goto('/');
  await page.goto('/gallery');
  await page.getByTestId('use-template-tech-mesh').click({ force: true });
  await page.getByTestId('platform-linkedin').click();
  await page.getByTestId('type-carousel').click();
  await page.getByTestId('format-r_4_5').click();
  await page.getByTestId('orientation-portrait').click();
  await page.getByTestId('create-submit').click();
}

test('mobile: one tap selects only; double tap opens the inline editor; typing is kept', async ({ page }) => {
  await createCarousel(page);
  const title = page.getByTestId('element-hit-title');
  await expect(title).toBeVisible();

  let p = await stableCenter(title);
  await page.touchscreen.tap(p.x, p.y);
  await expect(title).toHaveAttribute('aria-current', 'true');
  await expect(page.getByTestId('rich-text-contenteditable')).toHaveCount(0);

  // Wait out the double-tap window so the next tap is a fresh first tap.
  await page.waitForTimeout(600);
  p = await stableCenter(title);
  await page.touchscreen.tap(p.x, p.y);
  await expect(page.getByTestId('rich-text-contenteditable')).toHaveCount(0);

  // Quick second tap at the same spot: editor opens.
  p = await stableCenter(title);
  await page.touchscreen.tap(p.x, p.y);
  const editor = page.getByTestId('rich-text-contenteditable');
  await expect(editor).toBeVisible();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.type('Tap typed title');
  await expect(editor).toContainText('Tap typed title');

  // Leave editing and confirm the text reached the slide.
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { level: 1, name: 'Tap typed title' }).first()).toBeVisible();
});

test('mobile: two touch pointer taps open the editor even when the browser sends no dblclick', async ({ page }) => {
  await createCarousel(page);
  const title = page.getByTestId('element-hit-title');
  await expect(title).toBeVisible();
  const p = await stableCenter(title);
  // Raw pointer events only: some touch browsers never fire dblclick when touch-action is none.
  await page.evaluate(({ x, y }) => {
    const el = document.querySelector('[data-testid="element-hit-title"]')!;
    const fire = (type: string) =>
      el.dispatchEvent(new PointerEvent(type, { pointerId: 7, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y, bubbles: true, cancelable: true }));
    fire('pointerdown');
    fire('pointerup');
    fire('pointerdown');
    fire('pointerup');
  }, p);
  await expect(page.getByTestId('rich-text-contenteditable')).toBeVisible();
});

test('mobile: two slow touch taps do not open the editor', async ({ page }) => {
  await createCarousel(page);
  const title = page.getByTestId('element-hit-title');
  await expect(title).toBeVisible();
  const p = await stableCenter(title);
  const tap = () =>
    page.evaluate(({ x, y }) => {
      const el = document.querySelector('[data-testid="element-hit-title"]')!;
      const fire = (type: string) =>
        el.dispatchEvent(new PointerEvent(type, { pointerId: 7, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y, bubbles: true, cancelable: true }));
      fire('pointerdown');
      fire('pointerup');
    }, p);
  await tap();
  await page.waitForTimeout(700);
  await tap();
  await expect(page.getByTestId('rich-text-contenteditable')).toHaveCount(0);
});

test('mobile Edit tab: type, bold and save subtitle text from the properties sheet', async ({ page }) => {
  await createCarousel(page);
  const sub = page.getByTestId('element-hit-body');
  await expect(sub).toBeVisible();
  const slideSub = page.locator('.slide-canvas .slide-sub').first();
  const weightOf = () =>
    slideSub.evaluate((node) => {
      const inner = node.querySelector('strong, b, [style*="font-weight"]') ?? node;
      return Number.parseInt(getComputedStyle(inner).fontWeight, 10);
    });
  const before = await weightOf();
  expect(before).toBeLessThan(600);

  const p = await stableCenter(sub);
  await page.touchscreen.tap(p.x, p.y);
  await page.getByTestId('mobile-tab-edit').tap();
  const sheet = page.getByTestId('mobile-bottom-sheet');
  await expect(sheet).toBeVisible();
  const editor = sheet.getByTestId('rich-text-contenteditable');
  await expect(editor).toBeVisible();
  await editor.tap();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.type('Sheet typed subtitle');
  await page.keyboard.press('ControlOrMeta+A');
  await sheet.getByTestId('toolbar-bold').tap();
  await expect(editor).toContainText('Sheet typed subtitle');
  await page.screenshot({ path: 'test-results/mobile-edit-sheet-typed.png' });
  await page.getByTestId('mobile-sheet-close-btn').tap();
  await expect(slideSub).toHaveText('Sheet typed subtitle');
  expect(await weightOf()).toBeGreaterThanOrEqual(600);
});

test('mobile: edited subtitle and bold survive a reload', async ({ page }) => {
  await createCarousel(page);
  const sub = page.getByTestId('element-hit-body');
  await expect(sub).toBeVisible();
  const p = await stableCenter(sub);
  await page.touchscreen.tap(p.x, p.y);
  await page.getByTestId('mobile-tab-edit').tap();
  const sheet = page.getByTestId('mobile-bottom-sheet');
  const editor = sheet.getByTestId('rich-text-contenteditable');
  await expect(editor).toBeVisible();
  await editor.tap();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.type('Persisted subtitle');
  await page.keyboard.press('ControlOrMeta+A');
  await sheet.getByTestId('toolbar-bold').tap();
  await page.getByTestId('mobile-sheet-close-btn').tap();
  const slideSub = page.locator('.slide-canvas .slide-sub').first();
  await expect(slideSub).toHaveText('Persisted subtitle');
  // Let the debounced project save run before reloading.
  await page.waitForTimeout(1500);
  await page.reload();
  await expect(page.getByTestId('editor-mobile')).toBeVisible({ timeout: 15000 });
  const after = page.locator('.slide-canvas .slide-sub').first();
  await expect(after).toHaveText('Persisted subtitle');
  const weight = await after.evaluate((node) => Number.parseInt(getComputedStyle(node.querySelector('strong, b, [style*="font-weight"]') ?? node).fontWeight, 10));
  expect(weight).toBeGreaterThanOrEqual(600);
  await page.screenshot({ path: 'test-results/mobile-subtitle-after-reload-final.png' });
});
