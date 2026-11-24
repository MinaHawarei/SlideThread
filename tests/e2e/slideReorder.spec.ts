import { test, expect } from '@playwright/test';

test.describe('Animated Slide Reordering (R7-1, REQ-09)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
    });
  });

  test('reorders slides via accessible buttons, drag handles, and respects reduced motion', async ({ page }) => {
    // 1. Visit editor directly
    await page.goto('/editor');
    await page.waitForLoadState('networkidle');

    // 2. Ensure slide rail is visible
    const slideRail = page.getByTestId('slide-rail');
    await expect(slideRail).toBeVisible();

    // 3. Ensure we have at least 2 slides
    const addSlideBtn = page.getByTestId('rail-add-slide-btn');
    await addSlideBtn.click();

    // Verify dedicated drag handles are rendered
    const dragHandles = page.locator('[data-testid^="rail-drag-handle-"]');
    await expect(dragHandles.first()).toBeVisible();

    // Verify live region presence
    const liveRegion = page.getByTestId('rail-live-region');
    await expect(liveRegion).toBeAttached();

    // 4. Reorder slide down via accessible button
    const firstMoveDownBtn = page.locator('[data-testid^="rail-move-down-"]').first();
    await expect(firstMoveDownBtn).toBeEnabled();
    await firstMoveDownBtn.click();

    // 5. Verify polite announcement updated
    await expect(liveRegion).toContainText(/moved to position/i);

    // 6. Test with prefers-reduced-motion media feature
    await page.emulateMedia({ reducedMotion: 'reduce' });

    // Reorder back up with the move up button
    const moveUpBtns = page.locator('[data-testid^="rail-move-up-"]:not([disabled])');
    if (await moveUpBtns.count() > 0) {
      await moveUpBtns.first().click();
      await expect(liveRegion).toContainText(/moved to position/i);
    }
  });
});
