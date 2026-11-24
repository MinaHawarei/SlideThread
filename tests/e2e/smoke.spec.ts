import { test, expect } from '@playwright/test';

test.describe('Production Preview Smoke Test', () => {
  test('home page renders and editor route loads without console or page errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('pageerror', (err) => {
      errors.push(`Page error: ${err.message}`);
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore expected external analytics script 404 in non-Vercel preview environments
        if (text.includes('_vercel/insights') || text.includes('404')) {
          return;
        }
        errors.push(`Console error: ${text}`);
      }
    });

    // 1. Home page renders
    await page.goto('/');
    await expect(page).toHaveTitle(/SlideThread/);
    await expect(page.getByTestId('start-screen')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('start-app-title')).toHaveText('SlideThread');
    await expect(page.getByTestId('hero-section')).toBeVisible();

    // 2. Editor route loads
    await page.goto('/editor');
    await expect(
      page.locator('[data-testid="editor-desktop"], [data-testid="editor-mobile"]')
    ).toBeVisible({ timeout: 10000 });

    // 3. Fail on any uncaught page errors or console errors
    expect(errors).toEqual([]);
  });
});
