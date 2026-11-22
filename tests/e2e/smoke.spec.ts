import { test, expect } from '@playwright/test';

test('homepage loads and displays app title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/SlideThread/);
  await expect(page.locator('h1')).toHaveText('SlideThread');
});
