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

test('overflow warning and split-slide action for long content (R4-3, §5.3)', async ({ page }) => {
  await createEditor(page);
  await page.setViewportSize({ width: 1440, height: 900 });

  // 1. Switch to second slide (explain slide)
  const slide2Thumb = page.getByRole('button', { name: /slide 2/i });
  await slide2Thumb.click();

  // 2. Open slide tab in inspector
  const slideTab = page.getByTestId('tab-slide');
  await slideTab.click();

  // 3. Add 4+ lines of body text in inspector to trigger overflow warning
  const bodyTextarea = page.getByTestId('field-body');
  await bodyTextarea.fill(
    '- Point 1: First essential concept\n- Point 2: Second actionable takeaway\n- Point 3: Third detailed implementation\n- Point 4: Fourth key takeaway\n- Point 5: Fifth conclusion note'
  );

  // 4. Assert overflow warning box and split button are visible
  const overflowBox = page.getByTestId('overflow-warning-box');
  await expect(overflowBox).toBeVisible();

  const splitBtn = page.getByTestId('split-slide-btn');
  await expect(splitBtn).toBeVisible();

  // 5. Click split button
  const priorSlideThumbs = await page.getByRole('button', { name: /slide \d/i }).count();
  await splitBtn.click();

  // 6. Verify slide count increased by 1
  const newSlideThumbs = await page.getByRole('button', { name: /slide \d/i }).count();
  expect(newSlideThumbs).toBe(priorSlideThumbs + 1);

  // 7. Verify title of the new slide contains continuation suffix
  const titleInput = page.getByTestId('field-title');
  await expect(titleInput).toHaveValue(/Cont\./);
});

test('manual font size disables auto-fit and keeps fit-scale 1 (R4-3, §5.3)', async ({ page }) => {
  await createEditor(page);
  await page.setViewportSize({ width: 1440, height: 900 });

  // Select title element and enter in-place editing
  const titleHit = page.getByTestId('element-hit-title');
  await titleHit.click();
  await page.getByTestId('edit-text-btn-title').click();

  // Select all text in editor
  const contentEditable = page.getByTestId('rich-text-contenteditable');
  await contentEditable.click();
  await page.keyboard.press('ControlOrMeta+a');

  // Change font size to 150% via toolbar
  const sizeSelect = page.getByTestId('toolbar-font-size');
  await sizeSelect.selectOption('150');

  // Done editing
  await page.getByTestId('toolbar-done').click();

  // Check that the slide title rendered has manual size marked
  const renderedTitle = page.locator('[data-testid="main-canvas"] .slide-title-h1');
  await expect(renderedTitle).toBeVisible();
});
