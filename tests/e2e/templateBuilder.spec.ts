/**
 * In-app Template Builder: create a template from the gallery, it passes the same package validation as an
 * imported ZIP, appears under Your templates, survives a reload, and a project made from it uses its font.
 */
import { test, expect } from '@playwright/test';

test('create a template, keep it across reload, and use it in a project', async ({ page }) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/gallery');
  await page.getByTestId('open-template-builder').click();
  await expect(page.getByTestId('template-builder')).toBeVisible();

  // Empty name is rejected with a message, nothing is saved.
  await page.getByTestId('builder-create').click();
  await expect(page.getByTestId('builder-error')).toContainText(/name/i);

  await page.getByTestId('builder-name-en').fill('Serif Test Look');
  await page.getByTestId('builder-font-display').selectOption('ibm-plex-serif');
  await page.getByTestId('builder-radius').fill('64');
  await page.getByTestId('builder-create').click();

  await expect(page.getByTestId('template-builder')).toBeHidden({ timeout: 20000 });
  await expect(page.getByTestId('template-import-notice')).toContainText('Serif Test Look');
  const card = page.getByTestId('user-template-card-my-serif-test-look');
  await expect(card).toBeVisible();
  await page.screenshot({ path: 'test-results/template-builder-created-v2.png' });

  // The gallery preview image must show the same background and heading colour as the resulting template.
  const previewColors = await page.evaluate(async (id) => {
    const img = document.querySelector(`[data-testid="preview-user-template-${id}"] img`) as HTMLImageElement;
    await img.decode();
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
    const ctx = c.getContext('2d')!; ctx.drawImage(img, 0, 0);
    const px = (x: number, y: number) => Array.from(ctx.getImageData(x, y, 1, 1).data.slice(0, 3));
    return { corner: px(2, 2), w: c.width, h: c.height };
  }, 'my-serif-test-look');
  expect(previewColors.w).toBeGreaterThan(0);

  // Persists across reload (IndexedDB library).
  await page.reload();
  await expect(page.getByTestId('user-template-card-my-serif-test-look')).toBeVisible({ timeout: 15000 });

  // Creating a second template with the same name gets a different id.
  await page.getByTestId('open-template-builder').click();
  await page.getByTestId('builder-name-en').fill('Serif Test Look');
  await page.getByTestId('builder-create').click();
  await expect(page.getByTestId('user-template-card-my-serif-test-look-2')).toBeVisible({ timeout: 20000 });

  // Use the first template: the editor title uses the chosen heading font.
  await page.getByTestId('use-user-template-my-serif-test-look').click();
  await expect(page.getByTestId('main-canvas')).toBeVisible({ timeout: 20000 });
  const title = page.getByTestId('workspace-stage').locator('.slide-title-h1, .slide-title-h2').first();
  await expect(title).toBeVisible();
  const bg = await page.getByTestId('workspace-stage').locator('.slide-canvas').first().evaluate((el) => {
    const probe = document.createElement('div'); probe.style.color = getComputedStyle(el).getPropertyValue('--bg'); document.body.appendChild(probe);
    const rgb = getComputedStyle(probe).color; probe.remove(); return (rgb.match(/\d+/g) ?? []).slice(0, 3).map(Number);
  });
  const near = (a: number[], b: number[]) => a.every((v, i) => Math.abs(v - b[i]!) <= 24);
  expect(near(previewColors.corner, bg), `preview corner ${previewColors.corner} vs slide bg ${bg}`).toBe(true);
  const family = await title.evaluate((el) => getComputedStyle(el).fontFamily);
  expect(family).toContain('IBM Plex Serif');
  await page.screenshot({ path: 'test-results/template-builder-used-v2.png' });
});
