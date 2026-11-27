/**
 * Template group 2: each pk-* built-in is offered by the wizard, opens in the editor,
 * renders its cover and the generic explain slide, and exports a full-size, non-blank 4:5 PNG.
 * Set G2_SHOTS=<dir> to also save canvas screenshots (used for the review montage).
 */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { openTemplateDialog } from './helpers/wizard';

const IDS = ['pk-sunny-pop', 'pk-collage-pink', 'pk-peach-clean', 'pk-electric-blue', 'pk-noir-red', 'pk-arabic-cream-blue', 'pk-arabic-gold', 'pk-arabic-sand', 'pk-ai-violet', 'pk-binary-light'];

for (const id of IDS) {
  test(`group 2 template ${id}: wizard, editor render and PNG export`, async ({ page }) => {
    test.setTimeout(70000);
    await page.route('**/_vercel/insights/**', (route) => route.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await openTemplateDialog(page, id);
    await page.getByTestId('platform-linkedin').click();
    await page.getByTestId('type-carousel').click();
    await page.getByTestId('format-r_4_5').click();
    await page.getByTestId('orientation-portrait').click();
    await page.getByTestId('create-submit').click();
    await expect(page.getByTestId('editor-desktop')).toBeVisible({ timeout: 15000 });
    const canvas = page.getByTestId('main-canvas');
    await expect(canvas).toBeVisible();
    await page.waitForTimeout(800);
    const shots = process.env.G2_SHOTS;
    if (shots) await canvas.screenshot({ path: `${shots}/${id}-cover.png` });
    await page.locator('[data-testid^="rail-slide-"]').nth(1).click();
    await page.waitForTimeout(800);
    if (shots) await canvas.screenshot({ path: `${shots}/${id}-explain.png` });
    await page.getByTestId('editor-export-btn').click();
    await page.getByTestId('export-format-png').click();
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('export-start-btn').click()]);
    const bytes = await fs.promises.readFile((await download.path())!);
    expect(bytes.subarray(1, 4).toString()).toBe('PNG');
    expect(bytes.readUInt32BE(16)).toBe(1080);
    expect(bytes.readUInt32BE(20)).toBe(1350);
    expect(bytes.length, 'backdrop art makes the PNG far larger than a blank one').toBeGreaterThan(60_000);
  });
}
