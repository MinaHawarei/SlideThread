import { test, expect } from '@playwright/test';

test.describe('Gate G3 Verification Flow', () => {
  test('Complete flow on desktop: Start -> Wizard -> Editor, format/template/color/theme switching with lossless content, keyboard nav, and no console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    // Vercel Analytics requests /_vercel/insights/script.js, which only exists on Vercel. Locally that is an
    // expected 404 whose console line carries no URL, so network failures are checked per response instead.
    const badResponses: string[] = [];
    page.on('response', (res) => {
      if (res.status() >= 400 && !res.url().includes('/_vercel/insights/')) badResponses.push(`${res.status()} ${res.url()}`);
    });
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !msg.text().startsWith('Failed to load resource')) {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      consoleErrors.push(err.message);
    });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    // 1. Start Screen loads
    await expect(page.locator('[data-testid="start-screen"]')).toBeVisible();

    // 2. Click Start Guided Flow to enter Wizard
    await page.goto('/gallery');
    await page.getByTestId('gallery-template-card').first().waitFor();
    // Gallery is paginated now; walk pages until the tech-mesh card exists.
    const galleryNext = page.getByTestId('gallery-page-next');
    for (let i = 0; i < 10 && (await page.getByTestId('use-template-tech-mesh').count()) === 0 && (await galleryNext.count()) > 0 && (await galleryNext.isEnabled()); i++) await galleryNext.click();
    await page.getByTestId('use-template-tech-mesh').click({ force: true });
    await page.getByTestId('platform-linkedin').click();
    await page.getByTestId('type-carousel').click();
    await page.getByTestId('format-r_4_5').click();
    await page.getByTestId('orientation-portrait').click();
    await page.getByTestId('create-submit').click();

    // 3. Desktop Editor loads
    await expect(page.locator('[data-testid="editor-desktop"]')).toBeVisible();
    await expect(page.locator('[data-testid="slide-rail"]')).toBeVisible();
    await expect(page.locator('[data-testid="main-canvas"]')).toBeVisible();
    await expect(page.locator('[data-testid="inspector"]')).toBeVisible();

    // 4. Edit slide content in SlideInspector
    const titleInput = page.locator('[data-testid="field-title"]');
    await titleInput.fill('My Custom E2E Hook Title');

    // Verify title reflects on canvas
    await expect(page.locator('[data-testid="scaled-slide-container"]')).toContainText('My Custom E2E Hook Title');

    // 5. Add a second slide
    await page.locator('[data-testid="rail-add-slide-btn"]').click();
    // Second slide is now active, edit its title
    await titleInput.fill('Second Slide Core Concept');
    await expect(page.locator('[data-testid="scaled-slide-container"]')).toContainText('Second Slide Core Concept');

    // 6. Test Format Switching via ChangeFormatDialog
    await page.locator('[data-testid="tab-design"]').click();
    await page.locator('[data-testid="design-change-format-btn"]').click();
    await expect(page.locator('[data-testid="change-format-dialog"]')).toBeVisible();

    // Choose 1:1 Square
    await page.locator('[data-testid="change-format-option-r_1_1"]').click();
    await page.locator('[data-testid="apply-change-format-btn"]').click();
    await expect(page.locator('[data-testid="change-format-dialog"]')).not.toBeVisible();

    // 7. The template is chosen at creation: no template picker in the Design tab.
    await expect(page.locator('[data-testid="design-template-clean-minimal"]')).toHaveCount(0);

    // 8. Test Color Switching (choose emerald green preset #10B981)
    await page.locator('[data-testid="design-preset-10B981"]').click();

    // 9. Test Theme Switching (switch to light mode)
    await page.locator('[data-testid="design-theme-light"]').click();

    // 10. Lossless Content Verification: Content is 100% preserved
    // Check added slide content (currently active)
    await expect(page.locator('[data-testid="scaled-slide-container"]')).toContainText('Second Slide Core Concept');

    // Select slide 1 and verify its custom title is still preserved
    const firstSlideThumbnail = page.locator('[data-testid^="rail-slide-"]').first();
    await firstSlideThumbnail.click();
    await expect(page.locator('[data-testid="scaled-slide-container"]')).toContainText('My Custom E2E Hook Title');

    // 11. Keyboard Navigation in Editor
    // Navigate with ArrowRight to slide 2
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('[data-testid="canvas-counter-label"]')).toContainText('2');

    // Navigate with ArrowLeft back to slide 1
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('[data-testid="scaled-slide-container"]')).toContainText('My Custom E2E Hook Title');

    // Select last slide via thumbnail and verify its content remains intact
    await page.locator('[data-testid^="rail-slide-"]').last().click();
    await expect(page.locator('[data-testid="scaled-slide-container"]')).toContainText('Second Slide Core Concept');

    // 12. Export Button is visible and ready
    await expect(page.locator('[data-testid="editor-export-btn"]')).toBeVisible();

    // 13. Verify Zero Console Errors
    expect(consoleErrors).toEqual([]);
    expect(badResponses).toEqual([]);
  });

  test('Complete flow on mobile phone viewport (390x844): Start -> Demo Project -> Mobile Editor, swipe gestures, tabs, and bottom sheet', async ({ page }) => {
    const consoleErrors: string[] = [];
    // Vercel Analytics requests /_vercel/insights/script.js, which only exists on Vercel. Locally that is an
    // expected 404 whose console line carries no URL, so network failures are checked per response instead.
    const badResponses: string[] = [];
    page.on('response', (res) => {
      if (res.status() >= 400 && !res.url().includes('/_vercel/insights/')) badResponses.push(`${res.status()} ${res.url()}`);
    });
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !msg.text().startsWith('Failed to load resource')) {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      consoleErrors.push(err.message);
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    // 1. Start Screen loads on mobile
    await expect(page.locator('[data-testid="start-screen"]')).toBeVisible();

    // 2. Open a demo project directly from mobile StartScreen
    await page.locator('[data-testid="demo-en-btn"]').click();

    // 3. Mobile Editor loads
    await expect(page.locator('[data-testid="editor-mobile"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-bottom-tabs"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-thumbnail-strip"]')).toBeVisible();

    // 4. Test Slide Navigation via floating Next button
    const nextBtn = page.locator('[data-testid="mobile-next-slide-btn"]');
    await expect(nextBtn).toBeVisible();
    await nextBtn.click();

    // 5. Open Edit Tab -> Bottom Sheet opens
    await page.locator('[data-testid="mobile-tab-edit"]').click();
    await expect(page.locator('[data-testid="mobile-bottom-sheet"]')).toBeVisible();
    await expect(page.locator('[data-testid="slide-inspector"]')).toBeVisible();

    // Close bottom sheet
    await page.locator('[data-testid="mobile-sheet-close-btn"]').click();
    await expect(page.locator('[data-testid="mobile-bottom-sheet"]')).not.toBeVisible();

    // 6. Templates tool -> Bottom Sheet opens with Design inspector
    await page.locator('[data-testid="mobile-tab-templates"]').click();
    await expect(page.locator('[data-testid="mobile-bottom-sheet"]')).toBeVisible();
    await expect(page.locator('[data-testid="design-inspector"]')).toBeVisible();

    // Brand subtab lives in the Edit sheet's Design card now
    await page.locator('[data-testid="mobile-tab-edit"]').click();
    await page.locator('[data-testid="mobile-design-subtab-brand"]').click();
    await expect(page.locator('[data-testid="brand-inspector"]')).toBeVisible();

    // Close bottom sheet via Escape key
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="mobile-bottom-sheet"]')).not.toBeVisible();

    // 7. Open Export sheet from the top-bar Export button
    await page.locator('[data-testid="mobile-export-btn"]').click();
    await expect(page.locator('[data-testid="mobile-bottom-sheet"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-export-images"]')).toBeVisible();

    // 8. Verify Zero Console Errors
    expect(consoleErrors).toEqual([]);
    expect(badResponses).toEqual([]);
  });
});
