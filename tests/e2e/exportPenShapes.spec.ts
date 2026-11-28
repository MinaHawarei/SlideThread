import { test, expect, type Page } from '@playwright/test';
import * as fs from 'fs';

async function exportPng(page: Page) {
  await page.getByTestId('editor-export-btn').click();
  await page.getByTestId('export-menu-images').click();
  await page.getByTestId('export-format-png').click();
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('export-start-btn').click()]);
  const p = await download.path();
  return fs.readFileSync(p!).toString('base64');
}
async function pixel(page: Page, b64: string, fx: number, fy: number) {
  return page.evaluate(async ({ b64, fx, fy }) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(Math.floor(img.width * fx), Math.floor(img.height * fy), 1, 1).data;
    return { r: d[0] ?? 0, g: d[1] ?? 0, b: d[2] ?? 0 };
  }, { b64, fx, fy });
}

async function drawSquare(page: Page) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.getByTestId('demo-en-btn').click();
  await expect(page.getByTestId('editor-desktop')).toBeVisible();
  await page.getByTestId('rail-tool-draw').click();
  await page.getByTestId('rail-tool-bezier').click();
  const b = (await page.getByTestId('bezier-pen-surface').boundingBox())!;
  for (const [x, y] of [[0.3, 0.3], [0.7, 0.3], [0.7, 0.7], [0.3, 0.7], [0.3, 0.3]] as Array<[number, number]>) await page.mouse.click(b.x + b.width * x, b.y + b.height * y);
}
const isRed = (c: { r: number; g: number; b: number }) => c.r > 200 && c.g < 60 && c.b < 60;

test('exported PNG contains a Bezier-pen path filled red', async ({ page }) => {
  test.setTimeout(50000);
  await drawSquare(page);
  await page.getByTestId('path-fill-color').fill('#ff0000');
  expect(isRed(await pixel(page, await exportPng(page), 0.5, 0.5))).toBe(true);
});

test('exported PNG leaves a closed pen path hollow (No fill) in the middle', async ({ page }) => {
  test.setTimeout(50000);
  await drawSquare(page);
  await expect(page.getByTestId('path-fill-none')).toHaveAttribute('aria-pressed', 'true');
  expect(isRed(await pixel(page, await exportPng(page), 0.5, 0.5))).toBe(false);
});
