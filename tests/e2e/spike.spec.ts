import { test, expect } from '@playwright/test';

test('Spike page renders all 4 test slide sizes with required fidelity elements', async ({ page }) => {
  await page.goto('/spike');
  await expect(page.locator('h1')).toHaveText(/Phase 0 Export Spike/);

  // Check that all 4 formats are rendered
  const expectedFormats = [
    'spike-slide-1080x1350',
    'spike-slide-1080x1080',
    'spike-slide-1080x1920',
    'spike-slide-1920x1080',
  ];

  for (const id of expectedFormats) {
    const slide = page.locator(`[data-testid="${id}"]`);
    await expect(slide).toBeVisible();

    // Verify Arabic text presence
    await expect(slide.locator('h2')).toContainText('تَجْرِبَةُ التَّصْدِيرِ');

    // Verify code block presence
    await expect(slide.locator('code')).toContainText('fontsReady');

    // Verify SVG network background
    await expect(slide.locator('[data-testid="network-bg"]')).toBeVisible();

    // Verify circular avatar
    await expect(slide.locator('[data-testid="avatar-fallback"]')).toHaveText('M');
  }
});
