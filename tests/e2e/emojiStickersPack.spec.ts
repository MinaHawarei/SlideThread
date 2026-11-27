import { test, expect } from '@playwright/test';

test.describe('Emoji and Stickers Pack E2E (§5.6, Task R6-4)', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage before test
    await page.addInitScript(() => {
      localStorage.clear();
    });
  });

  test('adds an emoji and a presentation sticker, renders on canvas, and exports to PNG', async ({ page }) => {
    // Open editor
    await page.goto('/editor');
    await page.waitForLoadState('networkidle');

    const canvas = page.getByTestId('main-canvas');
    await expect(canvas).toBeVisible();

    // Find the emoji/stickers picker in the sidebar inspector
    const picker = page.getByTestId('emoji-stickers-picker');
    await expect(picker).toBeVisible();

    // 1. Add fire emoji from emoji tab
    const fireEmojiBtn = page.getByTestId('add-emoji-fire');
    await expect(fireEmojiBtn).toBeVisible();
    await fireEmojiBtn.click();

    // Verify emoji was added to canvas extras
    const extrasContainer = canvas.getByTestId('slide-extras-container');
    await expect(extrasContainer).toBeVisible();

    const emojiElement = extrasContainer.locator('[data-extra-kind="shape"]').first();
    await expect(emojiElement).toBeVisible();
    await expect(emojiElement.locator('svg')).toBeVisible();

    // Adding an element selects it and swaps the inspector to element properties.
    // Escape deselects, which brings the slide inspector (and the picker) back.
    await page.keyboard.press('Escape');
    await expect(picker).toBeVisible();

    // 2. Switch to stickers tab and add pro tip badge
    const stickersTab = page.getByTestId('tab-stickers');
    await expect(stickersTab).toBeVisible();
    await stickersTab.click();

    const proTipBtn = page.getByTestId('add-sticker-sticker-pro-tip');
    await expect(proTipBtn).toBeVisible();
    await proTipBtn.click();

    // Now there should be two extra elements on the canvas
    await expect(extrasContainer.locator('[data-extra-kind="shape"]')).toHaveCount(2);

    // 3. Test export with emoji & stickers rendered
    const exportBtn = page.getByTestId('editor-export-btn');
    await exportBtn.click();

    const exportDialog = page.getByTestId('export-dialog');
    await expect(exportDialog).toBeVisible();

    // Switch export format to PNG
    const pngOption = page.getByTestId('export-format-png');
    await pngOption.click();

    // Trigger download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('export-start-btn').click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.png$/i);
  });
});
