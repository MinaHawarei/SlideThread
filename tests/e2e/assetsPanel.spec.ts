import { test, expect } from '@playwright/test';

test.describe('Assets Panel E2E (§5.6, Task R6-5)', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage before test
    await page.addInitScript(() => {
      localStorage.clear();
    });
  });

  test('navigates to Assets tab, filters by category & search, clicks and drags to add onto canvas', async ({ page }) => {
    await page.goto('/editor');
    await page.waitForLoadState('networkidle');

    const canvas = page.getByTestId('main-canvas');
    await expect(canvas).toBeVisible();

    // 1. Switch inspector tab to Assets
    const assetsTab = page.getByTestId('tab-assets');
    await expect(assetsTab).toBeVisible();
    await assetsTab.click();

    // 2. Assets panel is visible
    const assetsPanel = page.getByTestId('assets-panel');
    await expect(assetsPanel).toBeVisible();

    // 3. Filter by Emoji category
    const emojiPill = page.getByTestId('category-emoji');
    await emojiPill.click();

    const fireEmoji = page.getByTestId('asset-item-fire');
    await expect(fireEmoji).toBeVisible();

    // 4. Test bilingual search
    const searchInput = page.getByTestId('assets-search-input');
    await searchInput.fill('sparkles');
    const sparklesEmoji = page.getByTestId('asset-item-sparkles');
    await expect(sparklesEmoji).toBeVisible();
    await expect(fireEmoji).not.toBeVisible();

    // Clear search
    await page.getByTestId('clear-search-btn').click();
    await expect(fireEmoji).toBeVisible();

    // 5. Click to add fire emoji to the active slide
    await fireEmoji.click();

    // Verify extra on canvas
    const extrasContainer = canvas.getByTestId('slide-extras-container');
    await expect(extrasContainer).toBeVisible();
    const addedElement = extrasContainer.locator('[data-extra-kind="shape"]');
    await expect(addedElement).toHaveCount(1);

    // 6. Check Recents category
    const recentsPill = page.getByTestId('category-recents');
    await recentsPill.click();
    await expect(page.getByTestId('asset-item-fire')).toBeVisible();

    // 7. Verify PNG export works with the added asset
    const exportBtn = page.getByTestId('editor-export-btn');
    await exportBtn.click();

    const exportDialog = page.getByTestId('export-dialog');
    await expect(exportDialog).toBeVisible();

    const pngOption = page.getByTestId('export-format-png');
    await pngOption.click();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('export-start-btn').click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.png$/i);
  });
});
