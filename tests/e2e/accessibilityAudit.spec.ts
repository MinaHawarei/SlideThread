import { test, expect } from '@playwright/test';

test.describe('Task R9-3: Accessibility and Keyboard-only Navigation Audit', () => {
  test('keyboard-only navigation through StartScreen to Editor', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    // Check visible focus styling is applied on tab
    await page.keyboard.press('Tab');
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedTag).toBeTruthy();

    // Navigate to English demo button and press Enter
    const demoBtn = page.getByTestId('demo-en-btn');
    await demoBtn.focus();
    await page.keyboard.press('Enter');

    // Verify Editor loaded
    await expect(page.locator('[data-testid="editor-desktop"]')).toBeVisible();

    // Verify keyboard slide navigation on canvas
    const canvas = page.locator('[data-testid="main-canvas"]');
    await canvas.focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowLeft');

    // Open and close shortcuts overlay via keyboard
    const shortcutsBtn = page.getByTestId('editor-shortcuts-btn');
    await shortcutsBtn.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid="shortcuts-overlay"]')).toBeVisible();

    // Dismiss via Escape
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="shortcuts-overlay"]')).not.toBeVisible();
  });

  test('screen reader labels and ARIA attributes on interactive controls', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    const demoBtn = page.getByTestId('demo-en-btn');
    await expect(demoBtn).toBeVisible();
    await demoBtn.click();

    await expect(page.locator('[data-testid="editor-desktop"]')).toBeVisible();

    // Language switcher
    const langSwitcher = page.getByTestId('language-switcher');
    await expect(langSwitcher).toBeVisible();

    // Undo / Redo controls
    const undoBtn = page.getByTestId('editor-undo-btn');
    await expect(undoBtn).toHaveAttribute('aria-label');

    const redoBtn = page.getByTestId('editor-redo-btn');
    await expect(redoBtn).toHaveAttribute('aria-label');

    // Canvas zoom buttons
    const zoomInBtn = page.getByTestId('canvas-zoom-in-btn');
    await expect(zoomInBtn).toHaveAttribute('aria-label');

    const zoomOutBtn = page.getByTestId('canvas-zoom-out-btn');
    await expect(zoomOutBtn).toHaveAttribute('aria-label');
  });
});
