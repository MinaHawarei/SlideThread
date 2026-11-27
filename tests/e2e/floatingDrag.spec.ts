import { test, expect, type Page } from '@playwright/test';

async function createEditor(page: Page) {
  await page.goto('/gallery');
  await page.getByTestId('use-template-tech-mesh').click({ force: true });
  await page.getByTestId('orientation-portrait').click();
  await page.getByTestId('create-submit').click();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.getByTestId('slide-rail')).toBeVisible();
}

async function box(page: Page) {
  await page.waitForTimeout(600); // selection frames re-measure the drawn slide after a short delay
  const b = await page.getByTestId('element-hit-counter').boundingBox();
  if (!b) throw new Error('counter not visible');
  return b;
}

async function dragCounter(page: Page, dx: number, dy: number) {
  const hit = page.getByTestId('element-hit-counter');
  await hit.click();
  const b = await hit.boundingBox();
  if (!b) throw new Error('counter hit frame not visible');
  const x = b.x + b.width / 2;
  const y = b.y + b.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx / 2, y + dy / 2, { steps: 5 });
  await page.mouse.move(x + dx, y + dy, { steps: 5 });
  await page.mouse.up();
}

test('counter drag: all slides by default, this slide only, and Reset to project', async ({ page }) => {
  await createEditor(page);
  const slides = page.locator('[data-testid^="rail-slide-"]');
  while ((await slides.count()) < 3) await page.getByTestId('rail-add-slide-btn').click();
  await expect.poll(() => slides.count()).toBeGreaterThanOrEqual(3);

  await slides.nth(1).click();
  const before = await box(page);
  await dragCounter(page, -60, -40);
  const moved = await box(page);
  expect(Math.abs(moved.x - before.x) + Math.abs(moved.y - before.y)).toBeGreaterThan(5);

  // Default scope is all slides: slide 3 follows.
  await slides.nth(2).click();
  const other = await box(page);
  expect(Math.abs(other.x - moved.x)).toBeLessThan(3);
  expect(Math.abs(other.y - moved.y)).toBeLessThan(3);

  // This slide only: slide 3 gets its own position, slide 2 keeps the project position.
  await page.getByTestId('element-hit-counter').click();
  await page.getByTestId('floating-scope-slide').click();
  await dragCounter(page, 40, 30);
  const own = await box(page);
  expect(Math.abs(own.x - moved.x) + Math.abs(own.y - moved.y)).toBeGreaterThan(5);
  await expect(page.getByTestId('floating-own-position')).toBeVisible();
  await slides.nth(1).click();
  const s2 = await box(page);
  expect(Math.abs(s2.x - moved.x)).toBeLessThan(3);
  expect(Math.abs(s2.y - moved.y)).toBeLessThan(3);

  // Reset to project on slide 3.
  await slides.nth(2).click();
  await page.getByTestId('element-hit-counter').click();
  await page.getByTestId('floating-reset-project').click();
  const reset = await box(page);
  expect(Math.abs(reset.x - moved.x)).toBeLessThan(3);
  expect(Math.abs(reset.y - moved.y)).toBeLessThan(3);
  await expect(page.getByTestId('floating-own-position')).toHaveCount(0);
});
