import { expect, test } from '@playwright/test';

// /ux-preview is a DEV-only route (import.meta.env.DEV), absent from the production build CI serves.
// Run it with SPIKE_DEV=1 against the Vite dev server (PLAYWRIGHT_TEST_BASE_URL=http://localhost:5199).
test.skip(!process.env.SPIKE_DEV, 'dev-only route /ux-preview: needs the Vite dev server, run with SPIKE_DEV=1');

test.describe('R0-6 UX direction preview', () => {
  test('switches directions, built pages, gallery states, theme, and language', async ({ page }) => {
    await page.goto('/ux-preview');

    const preview = page.locator('main.ux-preview');
    await expect(preview).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Atelier' })).toBeVisible();

    await page.locator('.ux-control-group').nth(0).getByRole('button').nth(1).click();
    await expect(page.getByRole('heading', { name: 'Signal' })).toBeVisible();
    await expect(preview).toHaveClass(/direction-signal/);

    await page.locator('.ux-page-links').getByRole('button', { name: 'Editor' }).click();
    await expect(page.getByRole('heading', { name: 'Design systems that scale' })).toBeVisible();
    await expect(page.getByRole('complementary', { name: 'Editor tools' })).toBeVisible();

    await page.locator('.ux-page-links').getByRole('button', { name: 'Gallery' }).click();
    await page.getByRole('button', { name: 'Empty', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Nothing here yet.' })).toBeVisible();
    await page.getByRole('button', { name: 'Error', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'The gallery could not load.' })).toBeVisible();
    await page.getByRole('button', { name: 'Loading', exact: true }).click();
    await expect(page.locator('.ux-skeleton-card')).toBeVisible();

    await page.locator('.ux-theme-toggle').click();
    await expect(preview).toHaveClass(/theme-dark/);
    await page.getByTestId('language-switcher').click();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.getByRole('heading', { name: 'اجعل فكرتك القادمة تستحق التوقف عندها.' })).toBeVisible();
  });
});
