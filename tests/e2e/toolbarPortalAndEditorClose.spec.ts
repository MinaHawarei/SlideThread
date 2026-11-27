/**
 * Inline canvas editor: no toolbar (formatting lives in the Element Properties panel) and close paths.
 *
 * Tests:
 *  - The inline editor opens with no toolbar on three desktop sizes and on touch.
 *  - Editor closes on: outside workspace click, right-panel click, Escape.
 *  - Edits are preserved on every close path.
 */
import { test, expect, type Page } from '@playwright/test';

// Helper: boot into editor and land on the second slide of a demo project
async function bootEditor(page: Page, viewportWidth = 1280, viewportHeight = 800) {
  await page.setViewportSize({ width: viewportWidth, height: viewportHeight });
  await page.goto('/');
  await expect(page.locator('[data-testid="start-screen"]')).toBeVisible({ timeout: 15000 });
  await page.getByTestId('demo-en-btn').click();
  await expect(page.getByTestId('editor-desktop')).toBeVisible({ timeout: 15000 });
  // Go to slide 2 for a text-rich slide
  const nextBtn = page.getByTestId('canvas-next-btn');
  if (await nextBtn.isEnabled()) {
    await nextBtn.click();
  }
}

// Helper: open the inline editor on the first text element visible
async function openEditor(page: Page, elementId = 'body') {
  const hitEl = page.getByTestId(`element-hit-${elementId}`).first();
  if (await hitEl.count() > 0) {
    await hitEl.dblclick({ force: true });
  } else {
    // Fall back to title
    await page.getByTestId('element-hit-title').first().dblclick({ force: true });
  }
  await expect(page.getByTestId('element-hit-title').first().getByTestId('rich-text-editor-container')).toBeVisible({ timeout: 5000 });
}

function inlineTitleEditor(page: Page) {
  return page.getByTestId('element-hit-title').first().getByTestId('rich-text-editor-container');
}

function inlineTitleInput(page: Page) {
  return inlineTitleEditor(page).getByTestId('rich-text-contenteditable');
}

function renderedTitle(page: Page) {
  return page.getByTestId('workspace-stage').locator('.slide-title-h1, .slide-title-h2');
}

test.describe('Inline editor has no toolbar (desktop)', () => {
  for (const [vpW, vpH] of [[1280, 800], [1024, 700], [1200, 900]] as const) {
    test(`No inline toolbar at ${vpW}×${vpH}`, async ({ page }) => {
      test.setTimeout(60000);
      await bootEditor(page, vpW, vpH);
      await openEditor(page, 'title');
      await expect(inlineTitleInput(page)).toBeVisible();
      await expect(page.locator('[data-rich-text-toolbar="true"]')).toHaveCount(0);
      // The only formatting toolbar is the one embedded in the Element Properties panel.
      await expect(page.getByTestId('rich-text-floating-toolbar')).toHaveCount(1);
      await expect(page.getByTestId('element-properties-panel').getByTestId('rich-text-floating-toolbar')).toHaveCount(1);
    });
  }
});

test.describe('Task 1 — Editor close paths preserve edits', () => {
  test('Close on workspace click — text is kept', async ({ page }) => {
    test.setTimeout(45000);
    await bootEditor(page, 1280, 800);
    await openEditor(page, 'title');

    // Type something
    await inlineTitleInput(page).click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.type('EDITED_TEXT_WORKSPACE');

    // Click the gray workspace area (outside the slide)
    const workspace = page.getByTestId('workspace-stage');
    const wsBox = await workspace.boundingBox();
    if (wsBox) {
      // Click far top-left corner which is outside the slide
      await page.mouse.click(wsBox.x + 8, wsBox.y + 8);
    }

    // Editor should be gone
    await expect(inlineTitleEditor(page)).not.toBeVisible({ timeout: 3000 });
    await expect(renderedTitle(page)).toContainText('EDITED_TEXT_WORKSPACE');
  });

  test('Close on Escape — text is kept', async ({ page }) => {
    test.setTimeout(45000);
    await bootEditor(page, 1280, 800);
    await openEditor(page, 'title');

    await inlineTitleInput(page).click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.type('EDITED_TEXT_ESCAPE');

    await page.keyboard.press('Escape');
    await expect(inlineTitleEditor(page)).not.toBeVisible({ timeout: 3000 });
    await expect(renderedTitle(page)).toContainText('EDITED_TEXT_ESCAPE');
  });

  test('Close on right-side panel click — text is kept', async ({ page }) => {
    test.setTimeout(45000);
    await bootEditor(page, 1280, 800);
    await openEditor(page, 'title');
    await inlineTitleInput(page).click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.type('EDITED_TEXT_PANEL');

    const inspector = page.getByTestId('inspector');
    await expect(inspector).toBeVisible();
    await inspector.click();
    await expect(inlineTitleEditor(page)).not.toBeVisible({ timeout: 3000 });
    await expect(renderedTitle(page)).toContainText('EDITED_TEXT_PANEL');
  });
});

test.describe('Inline editor has no toolbar (touch)', () => {
  test.use({ hasTouch: true, isMobile: true });
  test('Mobile double tap opens the inline editor with no toolbar or icons', async ({ page }) => {
    test.setTimeout(45000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.getByTestId('demo-en-btn').click();

    // Mobile layout: the editor mounts asynchronously, so wait for it instead of skipping.
    await expect(page.getByTestId('editor-mobile')).toBeVisible({ timeout: 15000 });

    // Enter editing mode
    const titleHit = page.getByTestId('element-hit-title').first();
    await expect(titleHit).toBeVisible({ timeout: 10000 });
    // Double tap, re-measuring each time: the canvas animates into place and selecting can shift it.
    for (let tap = 0; tap < 2; tap += 1) {
      let last = '';
      let frame = await titleHit.boundingBox();
      for (let i = 0; i < 40 && JSON.stringify(frame) !== last; i += 1) {
        last = JSON.stringify(frame);
        await page.waitForTimeout(150);
        frame = await titleHit.boundingBox();
      }
      if (!frame) throw new Error('title frame is not visible');
      await page.touchscreen.tap(frame.x + frame.width / 2, frame.y + frame.height / 2);
    }

    await expect(inlineTitleInput(page)).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-rich-text-toolbar="true"]')).toHaveCount(0);
    await expect(page.getByTestId('rich-text-floating-toolbar')).toHaveCount(0);

    // Escape closes
    await page.keyboard.press('Escape');
    await expect(inlineTitleEditor(page)).not.toBeVisible({ timeout: 3000 });
  });
});
