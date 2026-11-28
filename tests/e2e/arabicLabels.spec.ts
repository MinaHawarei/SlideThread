import { test, expect } from '@playwright/test';
import { setDirection } from './helpers/direction';

test('Arabic UI has no leftover English on Gallery actions, slide type label, and pencil/pen tools', async ({ page }) => {
  test.setTimeout(90000);
  await page.route('**/_vercel/insights/**', (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await setDirection(page, 'rtl');
  await page.goto('/gallery');
  await expect(page.getByTestId('import-template-zip')).toHaveText('استيراد قالب ZIP');
  await expect(page.getByTestId('open-template-builder')).toHaveText('إنشاء قالب');
  await page.goto('/editor');
  await expect(page.getByTestId('editor-desktop')).toBeVisible();
  await expect(page.locator('label[for="slide-type-select"]')).toHaveText('نوع الشريحة');
  await expect(page.getByTestId('pen-tool')).toContainText('قلم رصاص');
  await expect(page.getByTestId('bezier-tool')).toContainText('قلم');
  await expect(page.getByTestId('pen-tool')).not.toContainText('Pencil');
});
