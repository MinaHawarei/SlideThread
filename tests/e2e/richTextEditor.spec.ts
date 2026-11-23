import { test, expect, type Page } from '@playwright/test';

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
}

test('in-place editing and floating toolbar formatting (R4-2, §5.3)', async ({ page }) => {
  await createEditor(page);
  await page.setViewportSize({ width: 1440, height: 900 });

  // 1. Select title element
  const titleHit = page.getByTestId('element-hit-title');
  await titleHit.click();

  // 2. Click edit button on selection toolbar
  const editBtn = page.getByTestId('edit-text-btn-title');
  await expect(editBtn).toBeVisible();
  await editBtn.click();

  // 3. Verify editor container and floating toolbar appear
  const editorContainer = page.getByTestId('rich-text-editor-container');
  await expect(editorContainer).toBeVisible();

  const toolbar = page.getByTestId('rich-text-floating-toolbar');
  await expect(toolbar).toBeVisible();

  // 4. Focus editor, select text, and apply formatting
  const contentEditable = page.getByTestId('rich-text-contenteditable');
  await contentEditable.click();
  await page.keyboard.press('ControlOrMeta+a');

  const boldBtn = page.getByTestId('toolbar-bold');
  const underlineBtn = page.getByTestId('toolbar-underline');
  const highlightBtn = page.getByTestId('toolbar-highlight');
  const alignCenterBtn = page.getByTestId('toolbar-align-center');
  const dirRtlBtn = page.getByTestId('toolbar-dir-rtl');

  await boldBtn.click();
  await expect(boldBtn).toHaveAttribute('aria-pressed', 'true');

  await underlineBtn.click();
  await expect(underlineBtn).toHaveAttribute('aria-pressed', 'true');

  await highlightBtn.click();
  await expect(highlightBtn).toHaveAttribute('aria-pressed', 'true');

  await alignCenterBtn.click();
  await expect(alignCenterBtn).toHaveAttribute('aria-pressed', 'true');

  await dirRtlBtn.click();

  // 5. Done editing
  const doneBtn = page.getByTestId('toolbar-done');
  await doneBtn.click();

  await expect(editorContainer).not.toBeVisible();
});

test('mobile docked toolbar above keyboard in mobile layout (R4-2, §5.3)', async ({ page }) => {
  await createEditor(page);
  await page.setViewportSize({ width: 360, height: 800 });

  // Double click title element to enter edit mode on mobile
  const titleHit = page.getByTestId('element-hit-title');
  await titleHit.dblclick({ force: true });

  // Verify docked toolbar at bottom
  const toolbar = page.getByTestId('rich-text-floating-toolbar');
  await expect(toolbar).toBeVisible();
  await expect(toolbar).toHaveCSS('position', 'fixed');
  await expect(toolbar).toHaveCSS('bottom', '0px');

  // Verify >=44px touch targets on mobile toolbar
  const boldBtn = page.getByTestId('toolbar-bold');
  const box = await boldBtn.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
});

test('rich text in-place editing 12-state review matrix (R4-2)', async ({ page }) => {
  test.setTimeout(120000);
  await createEditor(page);

  for (const [width, height] of [[360, 800], [768, 1024], [1440, 900]] as const) {
    await page.setViewportSize({ width, height });
    await expect(page.getByTestId(width < 768 ? 'mobile-bottom-tabs' : 'tab-design')).toBeVisible();

    for (const theme of ['light', 'dark']) {
      if (width < 768) await page.getByTestId('mobile-tab-design').click();
      else await page.getByTestId('tab-design').click();
      await page.getByTestId(`design-theme-${theme}`).click();

      if (width < 768) {
        await page.getByTestId('mobile-sheet-close-btn').click();
      }

      // Enter edit mode
      await page.getByTestId('element-hit-title').focus();
      await page.keyboard.press('Enter');
      await expect(page.getByTestId('rich-text-floating-toolbar')).toBeVisible();

      for (const direction of ['ltr', 'rtl']) {
        if (await page.locator('html').getAttribute('dir') !== direction) {
          await page.getByTestId('language-switcher').click();
        }
        await expect(page.locator('html')).toHaveAttribute('dir', direction);
        await page.evaluate(({ mode }) => { document.documentElement.dataset.theme = mode; }, { mode: theme });

        await page.screenshot({ path: `docs/ux-review/R4-2/editor-${width}x${height}-${theme}-${direction}.png` });
      }

      // Exit edit mode
      await page.keyboard.press('Escape');
    }
  }
});
