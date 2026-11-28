import { test, expect } from '@playwright/test';
import { selectGalleryTemplate } from './helpers/wizard';

test('Start creating opens a blank project, not Weave, and the editor is in view', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.getByTestId('start-wizard-btn').click();
  await page.getByTestId('orientation-portrait').click();
  await page.getByTestId('create-submit').click();
  const editor = page.getByTestId('editor-desktop');
  await expect(editor).toBeVisible({ timeout: 20000 });
  // The editor starts at the top of the page even though the Start button sits far down Home.
  await expect.poll(async () => (await editor.boundingBox())?.y ?? -1).toBe(0);
  const canvas = page.getByTestId('main-canvas');
  await expect(canvas).not.toContainText(/tech-mesh/i);
  await expect(page.locator('[data-template-id]').first()).not.toHaveAttribute('data-template-id', 'tech-mesh');
  await expect(page.getByText('npx create-slidethread@latest')).toHaveCount(0);
  await expect(page.getByText('ARCHITECTURE')).toHaveCount(0);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'test-results/blank-editor-after-v2.png' });
});

test('a template card still opens that template with its own look', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await selectGalleryTemplate(page, 'tech-mesh');
  await page.getByTestId('orientation-portrait').click();
  await page.getByTestId('create-submit').click();
  await expect(page.getByTestId('editor-desktop')).toBeVisible({ timeout: 20000 });
  await expect(page.locator('[data-template-id]').first()).toHaveAttribute('data-template-id', 'tech-mesh');
});
