import { test, expect, type Page } from '@playwright/test';
import { selectGalleryTemplate } from './helpers/wizard';

async function createEditor(page: Page) {
  await page.goto('/');
  await selectGalleryTemplate(page, 'tech-mesh');
  await page.getByTestId('platform-linkedin').click();
  await page.getByTestId('type-carousel').click();
  await page.getByTestId('format-r_4_5').click();
  await page.getByTestId('orientation-portrait').click();
  await page.getByTestId('create-submit').click();
}

test('Counter system controls, styles, anchors, and collision handling (§5.4)', async ({ page }) => {
  await createEditor(page);
  await page.setViewportSize({ width: 1440, height: 900 });

  // Open Design Inspector tab
  await page.getByTestId('tab-design').click();

  // 1. Verify Counter toggle is visible and checked
  const toggle = page.getByTestId('counter-toggle');
  await expect(toggle).toBeVisible();
  await expect(toggle).toBeChecked();

  // 2. Initial state: signature is at 'bc', counter is at 'br' -> no collision initially
  const collisionWarning = page.getByTestId('counter-collision-warning');
  await expect(collisionWarning).not.toBeVisible();

  // Move counter to 'bc' (Bottom Center) where signature is anchored -> collision warning appears
  await page.getByTestId('counter-anchor-bc').click();
  await expect(collisionWarning).toBeVisible();

  // 3. Move counter to 'tl' (Top Left) -> collision warning disappears
  await page.getByTestId('counter-anchor-tl').click();
  await expect(collisionWarning).not.toBeVisible();

  // Check the counter element in main canvas
  const canvasCounterContainer = page.locator('[data-testid="scaled-slide-container"] .slide-counter-container');
  await expect(canvasCounterContainer).toBeVisible();
  await expect(canvasCounterContainer).toHaveAttribute('data-anchor', 'tl');

  // 4. Switch style to 'bar'
  await page.getByTestId('counter-style-bar').click();
  const counterBar = page.locator('[data-testid="scaled-slide-container"] [data-testid="slide-counter"]');
  await expect(counterBar).toHaveAttribute('data-style', 'bar');
  await expect(counterBar).toHaveAttribute('role', 'progressbar');

  // 5. Switch style to 'dots'
  await page.getByTestId('counter-style-dots').click();
  const counterDots = page.locator('[data-testid="scaled-slide-container"] [data-testid="slide-counter"]');
  await expect(counterDots).toHaveAttribute('data-style', 'dots');

  // 6. Switch back to 'number' and test format change
  await page.getByTestId('counter-style-number').click();
  await page.getByTestId('counter-format-n/nn').click();
  const counterNumber = page.locator('[data-testid="scaled-slide-container"] [data-testid="slide-counter"]');
  await expect(counterNumber).toHaveAttribute('data-style', 'number');
  await expect(counterNumber).toHaveText(/1 \/ \d+/);

  // 7. Test hide on first slide
  await page.getByTestId('counter-hide-first').click();
  // On slide 1 (first slide), counter should now be hidden
  await expect(canvasCounterContainer).not.toBeVisible();

  // 8. Toggle counter off completely
  await page.getByTestId('counter-hide-first').click(); // uncheck hide on first
  await expect(canvasCounterContainer).toBeVisible();
  await toggle.click(); // toggle counter off
  await expect(canvasCounterContainer).not.toBeVisible();
});
