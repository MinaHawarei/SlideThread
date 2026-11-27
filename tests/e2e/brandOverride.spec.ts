import { test, expect } from '@playwright/test';

test.describe('Brand Override System E2E (Spec §5.5)', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage before test
    await page.addInitScript(() => {
      localStorage.clear();
    });
  });

  test('selecting signature opens brand override popover, updates project only, applies to defaults, and resets', async ({ page }) => {
    await page.goto('/editor');
    await page.waitForLoadState('networkidle');

    const canvas = page.getByTestId('main-canvas');
    await expect(canvas).toBeVisible();

    // 1. Select signature on canvas
    const sigHit = canvas.getByTestId('element-hit-signature');
    await expect(sigHit).toBeVisible();
    await sigHit.click();

    // 2. Brand override popover opens
    const popover = page.getByTestId('brand-override-popover');
    await expect(popover).toBeVisible();

    const nameInput = popover.getByTestId('brand-override-name-input');
    const handleInput = popover.getByTestId('brand-override-handle-input');
    const resetBtn = popover.getByTestId('brand-override-reset-btn');
    const applyBtn = popover.getByTestId('brand-override-apply-defaults-btn');

    // Initially, no override, so action buttons are disabled
    await expect(resetBtn).toBeDisabled();
    await expect(applyBtn).toBeDisabled();

    // 3. Edit name and handle for this project
    await nameInput.fill('Project Custom Name');
    await handleInput.fill('@projectcustom');

    // Action buttons are now enabled
    await expect(resetBtn).toBeEnabled();
    await expect(applyBtn).toBeEnabled();

    // Verify canvas signature reflects the override immediately
    const sigBar = canvas.getByTestId('signature-bar');
    await expect(sigBar.getByText('Project Custom Name')).toBeVisible();
    await expect(sigBar.getByText('@projectcustom')).toBeVisible();

    // Verify BrandInspector shows the active override banner. Switching inspector tabs deselects the
    // element (and so closes the canvas popover), so select the signature again before applying.
    await page.getByTestId('tab-brand').click();
    const overrideBanner = page.getByTestId('brand-override-active-banner');
    await expect(overrideBanner).toBeVisible();
    await sigHit.click();
    await expect(popover).toBeVisible();

    // 4. Click "Apply to defaults" in popover
    await applyBtn.click();

    // Override is cleared, banner disappears
    await expect(overrideBanner).not.toBeVisible();

    // Check defaults in BrandInspector now hold the new values
    await page.getByTestId('tab-brand').click();
    const brandNameInput = page.getByTestId('brand-name-input');
    const brandHandleInput = page.getByTestId('brand-handle-input');
    await expect(brandNameInput).toHaveValue('Project Custom Name');
    await expect(brandHandleInput).toHaveValue('@projectcustom');

    // 5. Override again, then Reset
    await sigHit.click();
    await expect(popover).toBeVisible();

    await nameInput.fill('Temporary Project Name');
    await expect(sigBar.getByText('Temporary Project Name')).toBeVisible();
    await expect(resetBtn).toBeEnabled();

    await resetBtn.click();

    // Reverts to the default settings
    await expect(sigBar.getByText('Project Custom Name')).toBeVisible();
    await expect(resetBtn).toBeDisabled();
  });
});
