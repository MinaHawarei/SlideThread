import { test, expect } from '@playwright/test';

test.describe('Component Gallery Route (/gallery)', () => {
  test('renders all 9 slide types across aspect classes without errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/gallery');

    // Title should be visible
    await expect(page.getByRole('heading', { name: 'SlideThread Component Gallery' })).toBeVisible();

    // All 9 section titles should be present
    const expectedTypes = ['cover', 'explain', 'rule', 'compare', 'code', 'stat', 'quote', 'image', 'cta'];
    for (const type of expectedTypes) {
      await expect(page.getByRole('heading', { name: `${type} Slide` })).toBeVisible();
    }

    // Toggle theme to Light
    const themeBtn = page.locator('button:has-text("Dark"), button:has-text("Light")');
    await themeBtn.click();
    await expect(page.locator('button:has-text("Light")')).toBeVisible();

    // Toggle language to Arabic
    const langBtn = page.locator('button:has-text("English"), button:has-text("العربية")');
    await langBtn.click();
    await expect(page.locator('button:has-text("العربية")')).toBeVisible();

    // Code container should still be LTR
    const codeContainer = page.locator('.code-container').first();
    await expect(codeContainer).toHaveAttribute('dir', 'ltr');

    // Filter to a specific slide type (e.g. quote)
    const typeSelect = page.locator('select').first();
    await typeSelect.selectOption('quote');
    await expect(page.getByRole('heading', { name: 'quote Slide' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'explain Slide' })).not.toBeVisible();

    expect(consoleErrors).toEqual([]);
  });
});
