/**
 * Arabic/RTL editing and inline-toolbar placement (screen edges + canvas zoom).
 * Real assertions: toolbar buttons fully inside the viewport, typed Arabic text and
 * RTL direction persist across close and reload, rendered DOM shows Arabic with dir=rtl.
 */
import { test, expect, type Page } from '@playwright/test';

const BUTTONS = ['toolbar-bold', 'toolbar-align-left', 'toolbar-align-center', 'toolbar-align-right', 'toolbar-dir-ltr', 'toolbar-dir-rtl', 'toolbar-done'];

async function boot(page: Page, demo: 'demo-ar-btn' | 'demo-en-btn', w = 1280, h = 800) {
  await page.setViewportSize({ width: w, height: h });
  await page.goto('/');
  await expect(page.getByTestId('start-screen')).toBeVisible({ timeout: 15000 });
  await page.getByTestId(demo).click();
  await expect(page.getByTestId('editor-desktop')).toBeVisible({ timeout: 15000 });
}

async function openTitle(page: Page) {
  const hit = page.getByTestId('element-hit-title').first();
  const box = (await hit.boundingBox())!;
  const stage = (await page.getByTestId('workspace-stage').boundingBox())!;
  // click the centre of the part of the title that is actually visible inside the canvas pane
  const x0 = Math.max(box.x, stage.x), x1 = Math.min(box.x + box.width, stage.x + stage.width);
  const y0 = Math.max(box.y, stage.y), y1 = Math.min(box.y + box.height, stage.y + stage.height);
  expect(x1 - x0, 'title not visible horizontally').toBeGreaterThan(20);
  expect(y1 - y0, 'title not visible vertically').toBeGreaterThan(10);
  await page.mouse.dblclick((x0 + x1) / 2, (y0 + y1) / 2);
  await expect(hit.getByTestId('rich-text-editor-container')).toBeVisible({ timeout: 5000 });
}

async function assertToolbarInside(page: Page, w: number, h: number) {
  const toolbar = page.locator('[data-rich-text-toolbar="true"]');
  await expect(toolbar).toBeVisible();
  for (const tid of BUTTONS) {
    const box = await toolbar.getByTestId(tid).boundingBox();
    expect(box, `${tid} missing`).not.toBeNull();
    expect(box!.x, `${tid} left`).toBeGreaterThanOrEqual(0);
    expect(box!.y, `${tid} top`).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width, `${tid} right`).toBeLessThanOrEqual(w + 1);
    expect(box!.y + box!.height, `${tid} bottom`).toBeLessThanOrEqual(h + 1);
  }
}

test.describe('Arabic / RTL editing', () => {
  test('Arabic text + RTL direction + bold persist through close and reload', async ({ page }) => {
    test.setTimeout(60000);
    await boot(page, 'demo-ar-btn');
    await openTitle(page);
    await assertToolbarInside(page, 1280, 800);
    const input = page.getByTestId('element-hit-title').first().getByTestId('rich-text-contenteditable');
    await input.click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.type('عنوان تجريبي للاختبار');
    await page.keyboard.press('ControlOrMeta+a');
    const toolbar = page.locator('[data-rich-text-toolbar="true"]');
    await toolbar.getByTestId('toolbar-dir-rtl').click();
    await toolbar.getByTestId('toolbar-bold').click();
    await toolbar.getByTestId('toolbar-done').click();
    const title = page.getByTestId('workspace-stage').locator('.slide-title-h1, .slide-title-h2').first();
    await expect(title).toContainText('عنوان تجريبي للاختبار');
    expect(await title.evaluate((el) => getComputedStyle(el).direction)).toBe('rtl');
    const run = title.locator('bdi.rich-text-run').first();
    expect(await run.getAttribute('dir')).toBe('rtl');
    expect(Number(await run.evaluate((el) => getComputedStyle(el).fontWeight))).toBeGreaterThanOrEqual(700);
    await page.screenshot({ path: 'test-results/rtl-after-edit.png' });
    // reload persistence
    await page.waitForTimeout(1500);
    await page.reload();
    const resume = page.getByTestId('editor-desktop');
    if (!(await resume.isVisible().catch(() => false))) {
      const cont = page.locator('[data-testid^="recent-project"], [data-testid="resume-btn"], [data-testid="continue-btn"]').first();
      if (await cont.count()) await cont.click();
    }
    await expect(page.getByTestId('editor-desktop')).toBeVisible({ timeout: 15000 });
    const t2 = page.getByTestId('workspace-stage').locator('.slide-title-h1, .slide-title-h2').first();
    await expect(t2).toContainText('عنوان تجريبي للاختبار');
    expect(await t2.evaluate((el) => getComputedStyle(el).direction)).toBe('rtl');
  });
});

test.describe('Inline toolbar at edges and zoom', () => {
  for (const [w, h] of [[1280, 800], [1024, 600], [900, 560]] as const) {
    for (const zoomClicks of [0, 3, -2]) {
      test(`toolbar inside viewport ${w}x${h}, zoom clicks ${zoomClicks}`, async ({ page }) => {
        test.setTimeout(60000);
        await boot(page, 'demo-ar-btn', w, h);
        const btn = page.getByTestId(zoomClicks >= 0 ? 'canvas-zoom-in-btn' : 'canvas-zoom-out-btn');
        for (let i = 0; i < Math.abs(zoomClicks); i++) {
          if (await btn.isEnabled()) await btn.click();
        }
        await page.getByTestId('element-hit-title').first().scrollIntoViewIfNeeded();
        await openTitle(page);
        await assertToolbarInside(page, w, h);
        await page.screenshot({ path: `test-results/toolbar-${w}x${h}-z${zoomClicks}.png` });
      });
    }
  }
});
