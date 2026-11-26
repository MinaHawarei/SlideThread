/**
 * The two built-in full-carousel packs are offered by the New Carousel wizard like the other starters:
 * pick each, create the project, and export the cover as PNG at the real 4:5 size.
 */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';

for (const id of ['golden-hour-viral', 'neon-grid-process']) {
  test(`wizard offers built-in ${id} and its PNG export is a full-size, non-blank image`, async ({ page }) => {
    test.setTimeout(70000);
    await page.route('**/_vercel/insights/**', (route) => route.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.getByTestId('start-wizard-btn').click();
    await page.getByTestId('platform-linkedin').click();
    await page.getByTestId('wizard-next-btn').click();
    await page.getByTestId('type-carousel').click();
    await page.getByTestId('wizard-next-btn').click();
    await page.getByTestId('format-r_4_5').click();
    await page.getByTestId('wizard-next-btn').click();
    await expect(page.getByTestId(`template-${id}`)).toBeVisible();
    await page.getByTestId(`template-${id}`).click();
    await page.getByTestId('wizard-create-btn').click();
    await expect(page.getByTestId('editor-desktop')).toBeVisible({ timeout: 15000 });
    await page.getByTestId('editor-export-btn').click();
    await page.getByTestId('export-format-png').click();
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('export-start-btn').click()]);
    const bytes = await fs.promises.readFile((await download.path())!);
    expect(bytes.subarray(1, 4).toString()).toBe('PNG');
    expect(bytes.readUInt32BE(16)).toBe(1080);
    expect(bytes.readUInt32BE(20)).toBe(1350);
    expect(bytes.length, 'a backdrop-art cover is far larger than a blank PNG').toBeGreaterThan(60_000);
  });
}
