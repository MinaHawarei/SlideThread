import { test, expect } from '@playwright/test';

test('Spike page captures slide using html-to-image and modern-screenshot', async ({ page }) => {
  await page.goto('/spike');
  await expect(page.locator('h1')).toHaveText(/Phase 0 Export Spike/, { timeout: 15000 });

  // Test html-to-image
  const btnHtmlToImage = page.locator('[data-testid="btn-capture-html-to-image"]');
  await expect(btnHtmlToImage).toBeEnabled();
  await btnHtmlToImage.click();

  // Await capture completion and verify status
  const captureStatus = page.locator('[data-testid="capture-status"]');
  await expect(captureStatus).toBeVisible({ timeout: 15000 });
  await expect(captureStatus).toContainText('html-to-image');

  // Verify preview image src is a valid data URL
  const previewImg = page.locator('[data-testid="captured-image-preview"]');
  await expect(previewImg).toBeVisible();
  const srcHtml = await previewImg.getAttribute('src');
  expect(srcHtml).toMatch(/^data:image\/png;base64,/);

  // Test modern-screenshot
  const btnModernScreenshot = page.locator('[data-testid="btn-capture-modern-screenshot"]');
  await expect(btnModernScreenshot).toBeEnabled();
  await btnModernScreenshot.click();

  await expect(captureStatus).toContainText('modern-screenshot', { timeout: 15000 });
  const srcModern = await previewImg.getAttribute('src');
  expect(srcModern).toMatch(/^data:image\/png;base64,/);
});
