import { test, expect } from '@playwright/test';
import { copyFile, readFile } from 'node:fs/promises';
import sharp from 'sharp';

test('text extra typography persists and reaches PNG/PDF export with local italic fonts', async ({ page }) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/editor');
  await expect(page.getByTestId('editor-desktop')).toBeVisible();
  await page.getByTestId('rail-tool-media').click();
  await page.getByTestId('add-text-btn').click();
  const richEditor = page.getByTestId('rich-text-contenteditable');
  await richEditor.fill('Typography export check — هذا نص عربي طويل mixed with English to verify shaping, bidi order, and wrapping across several words. مرحباً بالعالم.');

  const extra = page.getByTestId('main-canvas').locator('[data-testid^="text-extra-"]').last();
  await expect(page.getByTestId('sidebar-element-typography')).toBeVisible();
  await page.getByTestId('sidebar-x-position').fill('6');
  await page.getByTestId('sidebar-y-position').fill('78');
  await page.getByTestId('sidebar-element-width').fill('86');
  await page.getByTestId('sidebar-typography-font').selectOption('ibm-plex-serif');
  await page.getByTestId('sidebar-typography-size').fill('30');
  await page.getByTestId('sidebar-typography-weight').selectOption('600');
  await page.getByTestId('sidebar-typography-italic').check();
  await page.getByTestId('sidebar-typography-color').fill('#ff00aa');
  await page.getByTestId('sidebar-typography-letterSpacing').fill('0.2');
  await page.getByTestId('sidebar-typography-lineHeight').fill('1.3');

  await expect.poll(async () => extra.evaluate((node) => (node as HTMLElement).style.fontFamily)).toContain('IBM Plex Serif');
  await expect.poll(async () => extra.evaluate((node) => (node as HTMLElement).style.fontStyle)).toBe('italic');
  await expect.poll(async () => page.evaluate(() => document.fonts.check('italic 600 30px "IBM Plex Serif"', 'مرحبا Hello'))).toBe(true);
  await page.waitForTimeout(700); // allow the existing debounced project persistence to flush
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await page.reload();

  const restored = page.getByTestId('main-canvas').locator('[data-testid^="text-extra-"]').last();
  await expect.poll(async () => restored.evaluate((node) => (node as HTMLElement).style.fontFamily)).toContain('IBM Plex Serif');
  await expect.poll(async () => restored.evaluate((node) => (node as HTMLElement).style.fontSize)).toBe('30px');
  await expect.poll(async () => restored.evaluate((node) => (node as HTMLElement).style.color)).toBe('rgb(255, 0, 170)');
  await expect.poll(async () => page.evaluate(() => document.fonts.check('italic 600 30px "IBM Plex Serif"', 'مرحبا Hello'))).toBe(true);

  await page.getByTestId('editor-export-btn').click();
  await page.getByTestId('export-menu-images').click();
  await page.getByTestId('export-format-png').click();
  const [pngDownload] = await Promise.all([page.waitForEvent('download'), page.getByTestId('export-start-btn').click()]);
  const pngPath = await pngDownload.path();
  expect(pngPath).toBeTruthy();
  const png = await readFile(pngPath!);
  await copyFile(pngPath!, '/tmp/slidethread-stage2-typography.png');
  const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
  expect(info.width).toBeGreaterThan(500);
  let magentaPixels = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    if (data[i]! > 190 && data[i + 1]! < 90 && data[i + 2]! > 120) magentaPixels += 1;
  }
  expect(magentaPixels).toBeGreaterThan(80);

  await page.getByTestId('editor-export-btn').click();
  await page.getByTestId('export-menu-images').click();
  await page.getByTestId('export-format-pdf').click();
  const [pdfDownload] = await Promise.all([page.waitForEvent('download'), page.getByTestId('export-start-btn').click()]);
  const pdfPath = await pdfDownload.path();
  expect(pdfPath).toBeTruthy();
  const pdf = await readFile(pdfPath!);
  await copyFile(pdfPath!, '/tmp/slidethread-stage2-typography.pdf');
  expect(pdf.toString('latin1', 0, 5)).toBe('%PDF-');
  expect(pdf.toString('latin1')).toContain('/Subtype /Image');
});
