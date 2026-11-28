import { test, expect, type Page } from '@playwright/test';
import { selectGalleryTemplate } from './helpers/wizard';
import { setDirection } from './helpers/direction';

async function createEditor(page: Page) {
  await page.goto('/');
  await selectGalleryTemplate(page, 'tech-mesh');
  await page.getByTestId('platform-linkedin').click();
  await page.getByTestId('type-carousel').click();
  await page.getByTestId('format-r_4_5').click();
  await page.getByTestId('orientation-portrait').click();
  await page.getByTestId('create-submit').click();
}

test('in-place editing opens without a toolbar; formatting is applied from the Element Properties panel (R4-2, §5.3)', async ({ page }) => {
  await createEditor(page);
  await page.setViewportSize({ width: 1440, height: 900 });

  const titleHit = page.getByTestId('element-hit-title');
  await titleHit.click();
  await titleHit.dblclick();

  const editorContainer = page.getByTestId('element-hit-title').getByTestId('rich-text-editor-container');
  await expect(editorContainer).toBeVisible();
  // No toolbar on the canvas itself
  await expect(page.locator('[data-rich-text-toolbar="true"]')).toHaveCount(0);
  await expect(page.getByTestId('element-hit-title').getByTestId('rich-text-floating-toolbar')).toHaveCount(0);

  // Format through the panel's editor + toolbar
  const panel = page.getByTestId('element-properties-panel');
  await panel.getByTestId('rich-text-contenteditable').click();
  await page.keyboard.press('ControlOrMeta+a');
  const toolbar = panel.getByTestId('rich-text-floating-toolbar');
  await expect(toolbar).toBeVisible();
  const boldBtn = toolbar.getByTestId('toolbar-bold');
  const underlineBtn = toolbar.getByTestId('toolbar-underline');
  const highlightBtn = toolbar.getByTestId('toolbar-highlight');
  const alignCenterBtn = toolbar.getByTestId('toolbar-align-center');

  await boldBtn.click();
  await expect(boldBtn).toHaveAttribute('aria-pressed', 'true');
  await underlineBtn.click();
  await expect(underlineBtn).toHaveAttribute('aria-pressed', 'true');
  await highlightBtn.click();
  await expect(highlightBtn).toHaveAttribute('aria-pressed', 'true');
  await alignCenterBtn.click();
  await expect(alignCenterBtn).toHaveAttribute('aria-pressed', 'true');
  await toolbar.getByTestId('toolbar-dir-rtl').click();
});

test('mobile: double tap opens inline editor with no docked toolbar (R4-2, §5.3)', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 360, height: 800 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await createEditor(page);

  const titleHit = page.getByTestId('element-hit-title');
  await expect(titleHit).toBeVisible();
  await page.waitForTimeout(800);
  let b = (await titleHit.boundingBox())!;
  await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
  await page.waitForTimeout(150);
  b = (await titleHit.boundingBox())!;
  await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);

  await expect(page.getByTestId('element-hit-title').getByTestId('rich-text-contenteditable')).toBeVisible();
  await expect(page.locator('[data-rich-text-toolbar="true"]')).toHaveCount(0);
  await expect(page.getByTestId('rich-text-floating-toolbar')).toHaveCount(0);
  await context.close();
});

test('rich text in-place editing 12-state review matrix (R4-2)', async ({ page }) => {
  test.setTimeout(120000);
  await createEditor(page);

  for (const [width, height] of [[360, 800], [768, 1024], [1440, 900]] as const) {
    await page.setViewportSize({ width, height });
    await expect(page.getByTestId(width < 768 ? 'mobile-bottom-tabs' : 'tab-design')).toBeVisible();

    for (const theme of ['light', 'dark']) {
      if (width < 768) await page.getByTestId('mobile-tab-templates').click();
      else await page.getByTestId('tab-design').click();
      await page.getByTestId(`design-theme-${theme}`).click();

      if (width < 768) {
        await page.getByTestId('mobile-sheet-close-btn').click();
      }

      // Enter edit mode
      await page.getByTestId('element-hit-title').focus();
      await page.keyboard.press('Enter');
      await expect(page.getByTestId('element-hit-title').getByTestId('rich-text-contenteditable')).toBeVisible();
      await expect(page.locator('[data-rich-text-toolbar="true"]')).toHaveCount(0);

      for (const direction of ['ltr', 'rtl']) {
        await setDirection(page, direction as 'ltr' | 'rtl');
        await expect(page.locator('html')).toHaveAttribute('lang', direction === 'rtl' ? 'ar' : 'en');
        await page.evaluate(({ mode }) => { document.documentElement.dataset.theme = mode; }, { mode: theme });

        await page.screenshot({ path: `docs/ux-review/R4-2/editor-${width}x${height}-${theme}-${direction}.png` });
      }

      // Exit edit mode
      await page.keyboard.press('Escape');
    }
  }
});
