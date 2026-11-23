import { test, expect, type Page } from '@playwright/test';

async function createEditor(page: Page) {
  await page.goto('/');
  await page.getByTestId('start-wizard-btn').click();
  await page.getByTestId('platform-linkedin').click();
  await page.getByTestId('wizard-next-btn').click();
  await page.getByTestId('type-carousel').click();
  await page.getByTestId('wizard-next-btn').click();
  await page.getByTestId('format-r_4_5').click();
  await page.getByTestId('wizard-next-btn').click();
  await page.getByTestId('template-tech-mesh').click();
  await page.getByTestId('wizard-create-btn').click();
}

test('Signature system anchors, arrangements, sizes, shapes, and handles (§5.4)', async ({ page }) => {
  await createEditor(page);
  await page.setViewportSize({ width: 1440, height: 900 });

  // Open Brand Inspector tab
  await page.getByTestId('tab-brand').click();

  // 1. Verify Signature toggle is visible and checked
  const sigToggle = page.getByTestId('brand-signature-toggle');
  await expect(sigToggle).toBeVisible();
  await expect(sigToggle).toBeChecked();

  // Signature element in canvas
  const sigContainer = page.locator('[data-testid="scaled-slide-container"] .slide-signature-container');
  const sigBar = page.locator('[data-testid="scaled-slide-container"] [data-testid="signature-bar"]');
  await expect(sigBar).toBeVisible();

  // 2. Change anchor to 'tl' (Top Left)
  await page.getByTestId('sig-anchor-tl').click();
  await expect(sigContainer).toHaveClass(/sig-anchor-tl/);

  // 3. Change arrangement to 'stacked'
  await page.getByTestId('sig-arrangement-stacked').click();
  await expect(sigBar).toHaveAttribute('data-arrangement', 'stacked');

  // 4. Change size to 'lg'
  await page.getByTestId('sig-size-lg').click();
  await expect(sigBar).toHaveAttribute('data-size', 'lg');

  // 5. Change photo shape to 'square'
  await page.getByTestId('sig-shape-square').click();
  await expect(sigBar).toHaveAttribute('data-shape', 'square');

  // 6. Toggle handle off
  const handleToggle = page.getByTestId('sig-handle-toggle');
  await expect(handleToggle).toBeChecked();
  await handleToggle.click();
  await expect(handleToggle).not.toBeChecked();

  // Verify handle text is no longer in signature bar
  const handleEl = sigBar.locator('.sig-handle');
  await expect(handleEl).not.toBeVisible();

  // 7. Toggle signature off completely
  await sigToggle.click();
  await expect(sigBar).not.toBeVisible();
});
