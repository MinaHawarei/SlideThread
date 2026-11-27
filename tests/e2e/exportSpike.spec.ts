import { test, expect } from '@playwright/test';

// /spike is a development-only route (App.tsx registers it only when import.meta.env.DEV), so these tests can not run against the
// production preview server Playwright starts. Run them against `npm run dev` with PLAYWRIGHT_TEST_BASE_URL set and SPIKE_DEV=1.
// Without that the skip is reported with this reason; it is not silent.
test.skip(!process.env.SPIKE_DEV, 'dev-only /spike route: needs the dev server and SPIKE_DEV=1');

test('Spike page generates and allows downloading PDF and ZIP archives', async ({ page }) => {
  test.setTimeout(45000);
  await page.goto('/spike');
  await expect(page.locator('h1')).toHaveText(/Phase 0 Export Spike/, { timeout: 15000 });

  // Select square format to keep single-slide capture fast
  const formatSelect = page.locator('select');
  await expect(formatSelect).toBeVisible();
  await formatSelect.selectOption('square_1_1');

  // Test Export PDF
  const btnPdf = page.locator('[data-testid="btn-export-pdf"]');
  await expect(btnPdf).toBeEnabled();
  await btnPdf.click();

  const downloadLink = page.locator('[data-testid="download-export-link"]');
  await expect(downloadLink).toBeVisible({ timeout: 20000 });
  await expect(downloadLink).toContainText('.pdf');

  // Test Export ZIP
  const btnZip = page.locator('[data-testid="btn-export-zip"]');
  await expect(btnZip).toBeEnabled();
  await btnZip.click();

  await expect(downloadLink).toBeVisible({ timeout: 20000 });
  await expect(downloadLink).toContainText('.zip');
});
