import { test, expect } from '@playwright/test';

test('Spike page generates and allows downloading PDF and ZIP archives', async ({ page }) => {
  test.setTimeout(45000);
  await page.goto('/spike');
  await expect(page.locator('h1')).toHaveText(/Phase 0 Export Spike/);

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
