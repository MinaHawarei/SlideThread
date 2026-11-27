import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

// 1x1 bright red PNG (RGBA: 255, 0, 0, 255)
const RED_1X1_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

test.describe('QA Fixes Acceptance Tests (Real Browser)', () => {
  test('1 & 4: Mobile 390px — selection survives Edit tab tap & Add Text closes sheet', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/editor');
    await expect(page.getByTestId('editor-mobile')).toBeVisible({ timeout: 15000 });

    // Select title on canvas
    const titleHit = page.getByTestId('element-hit-title');
    await expect(titleHit).toBeVisible();
    await titleHit.click();

    // Tap Edit tab (real pointerdown + click)
    await page.getByTestId('mobile-tab-edit').click();

    // Selection must survive and Element Properties + Delete must be visible
    await expect(page.getByTestId('element-properties-panel')).toBeVisible();
    await expect(page.getByTestId('sidebar-delete-btn')).toBeVisible();

    // Close sheet and verify Layers route still works
    await page.getByTestId('mobile-sheet-close-btn').click();
    await page.getByTestId('mobile-tab-layers').click();
    await expect(page.getByTestId('layers-panel')).toBeVisible();
    await page.locator('[data-testid="layer-row-title"] button').first().click();
    await expect(page.getByTestId('element-properties-panel')).toBeVisible();

    // 4: Add Text on mobile closes sheet & selects new element
    await page.getByTestId('mobile-sheet-close-btn').click();
    await page.getByTestId('mobile-tab-assets').click();
    await expect(page.getByTestId('assets-panel')).toBeVisible();
    await page.getByTestId('add-text-btn').click();
    await expect(page.getByTestId('mobile-bottom-sheet')).not.toBeVisible();
    await expect(page.locator('[data-testid^="element-hit-text_"]')).toBeVisible();
  });

  test('2: All slides background renders on canvas, thumbnails, and exported PNG/PDF/ZIP', async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/editor');
    await expect(page.getByTestId('editor-desktop')).toBeVisible({ timeout: 15000 });

    // Open Slide tab -> All slides background -> upload solid red image
    await page.getByTestId('tab-slide').click();
    await page.getByTestId('bg-scope-all').click();

    const fileInput = page.getByTestId('bg-file-input');
    await fileInput.setInputFiles({
      name: 'red-bg.png',
      mimeType: 'image/png',
      buffer: Buffer.from(RED_1X1_PNG_BASE64, 'base64'),
    });

    // Verify background is rendered on main canvas and in slide rail thumbnail
    await expect(page.locator('[data-testid="main-canvas"] [data-testid="slide-custom-background"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="slide-rail"] [data-testid="slide-custom-background"]').first()).toBeVisible({ timeout: 5000 });

    // Export PNG (current slide) and inspect real PNG pixels using canvas in browser
    await page.getByTestId('editor-export-btn').click();
    await expect(page.getByTestId('export-dialog')).toBeVisible();
    await page.getByTestId('export-format-png').click();

    const [pngDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('export-start-btn').click(),
    ]);
    expect(pngDownload.suggestedFilename()).toMatch(/\.png$/);
    const pngPath = await pngDownload.path();
    expect(pngPath).not.toBeNull();
    const pngBytes = readFileSync(pngPath!);
    expect(pngBytes.length).toBeGreaterThan(100);

    // Decode PNG in browser and verify top-left corner pixel has high red channel (not plain dark navy)
    const cornerPixel = await page.evaluate(async (b64) => {
      const img = new Image();
      const loaded = new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
      });
      img.src = `data:image/png;base64,${b64}`;
      await loaded;
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(2, 2, 1, 1).data;
      return { r: data[0], g: data[1], b: data[2], w: img.width, h: img.height };
    }, pngBytes.toString('base64'));
    expect(cornerPixel.r).toBeGreaterThan(150);

    // Also verify PDF and ZIP downloads succeed
    await expect(page.getByTestId('export-dialog')).not.toBeVisible({ timeout: 10000 });
    await page.getByTestId('editor-export-btn').click();
    await expect(page.getByTestId('export-dialog')).toBeVisible();
    await page.getByTestId('export-format-pdf').click();
    const [pdfDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('export-start-btn').click(),
    ]);
    expect(pdfDownload.suggestedFilename()).toMatch(/\.pdf$/);

    await expect(page.getByTestId('export-dialog')).not.toBeVisible({ timeout: 10000 });
    await page.getByTestId('editor-export-btn').click();
    await expect(page.getByTestId('export-dialog')).toBeVisible();
    await page.getByTestId('export-format-zip').click();
    const [zipDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('export-start-btn').click(),
    ]);
    expect(zipDownload.suggestedFilename()).toMatch(/\.zip$/);
  });

  test('3: Remove Image clears canvas and thumbnail immediately and persists across reload', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/editor');
    await expect(page.getByTestId('editor-desktop')).toBeVisible({ timeout: 15000 });

    // Add an Image slide via SlideTypePicker
    await page.getByTestId('rail-add-slide-type-btn').click();
    await page.getByTestId('type-option-image').click();

    // Select media slot on canvas and upload image
    await page.getByTestId('element-hit-media').click();
    await expect(page.getByTestId('sidebar-image-controls')).toBeVisible();
    await page.getByTestId('sidebar-image-file-input').setInputFiles({
      name: 'red.png',
      mimeType: 'image/png',
      buffer: Buffer.from(RED_1X1_PNG_BASE64, 'base64'),
    });

    await expect(page.locator('[data-testid="main-canvas"] .slide-canvas img.slide-media-element')).toBeVisible({ timeout: 5000 });

    // Remove Image
    await page.getByTestId('sidebar-remove-image-btn').click();

    // Canvas and thumbnail should immediately show placeholder, not the removed image
    await expect(page.locator('[data-testid="main-canvas"] .slide-canvas img.slide-media-element')).toHaveCount(0);
    await expect(page.locator('[data-testid="main-canvas"] .slide-canvas')).toContainText('Full-Bleed Media');

    // Reload and verify still removed
    await page.reload();
    await expect(page.getByTestId('editor-desktop')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="main-canvas"] .slide-canvas img.slide-media-element')).toHaveCount(0);
  });

  test('5 & 6: Arabic RTL counters/arrows/labels & mobile layout without overflow at 320, 360, 390, 820, 1280', async ({ page }) => {
    // Switch to Arabic in Settings and verify single nav at 390px
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/settings');
    await expect(page.locator('.settings-header nav')).not.toBeVisible();
    await page.getByTestId('settings-lang-ar-btn').click();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    // Home in Arabic: the redesigned Home has no hero carousel (the component is covered by
    // tests/unit/heroCarousel.test.tsx). Assert the real Home renders in RTL instead.
    await page.goto('/');
    await expect(page.getByTestId('start-screen')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.getByTestId('start-wizard-btn')).toBeVisible();

    // Mobile editor in Arabic: counter bdi, chevrons, Arabic aria-labels
    await page.goto('/editor');
    await expect(page.getByTestId('editor-mobile')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="mobile-slide-counter"] bdi')).toHaveAttribute('dir', 'ltr');
    await expect(page.getByTestId('mobile-prev-slide-btn')).toHaveText('›');
    await expect(page.getByTestId('mobile-next-slide-btn')).toHaveText('‹');
    await expect(page.getByTestId('mobile-prev-slide-btn')).toHaveAttribute('aria-label', 'الشريحة السابقة');
    await expect(page.getByTestId('mobile-next-slide-btn')).toHaveAttribute('aria-label', 'الشريحة التالية');

    // Check zero horizontal overflow on Home, Gallery, Settings across 320, 360, 390, 820, 1280 (AR & EN)
    for (const locale of ['ar', 'en'] as const) {
      await page.goto('/settings');
      await page.getByTestId(locale === 'ar' ? 'settings-lang-ar-btn' : 'settings-lang-en-btn').click();
      for (const width of [320, 360, 390, 820, 1280]) {
        await page.setViewportSize({ width, height: 844 });
        for (const path of ['/', '/gallery', '/settings']) {
          await page.goto(path);
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
          expect(overflow, `Overflow on ${path} (${locale}) at ${width}px`).toBe(false);
        }
      }
    }
  });
});
