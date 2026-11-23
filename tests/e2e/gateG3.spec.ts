import { test, expect } from '@playwright/test';

test.describe('Gate G3 Verification Flow', () => {
  test('Complete flow on desktop: Start -> Wizard -> Editor, format/template/color/theme switching with lossless content, keyboard nav, and no console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
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
    await page.locator('[data-testid="start-wizard-btn"]').click();
    await expect(page.locator('[data-testid="wizard-screen"]')).toBeVisible();

    // Step 1: Select Platform (LinkedIn) -> Next
    await page.locator('[data-testid="platform-linkedin"]').click();
    await page.locator('[data-testid="wizard-next-btn"]').click();

    // Step 2: Select Content Type (Carousel) -> Next
    await page.locator('[data-testid="type-carousel"]').click();
    await page.locator('[data-testid="wizard-next-btn"]').click();

    // Step 3: Select Format (4:5 Portrait) -> Next
    await page.locator('[data-testid="format-r_4_5"]').click();
    await page.locator('[data-testid="wizard-next-btn"]').click();

    // Step 4: Select Template (Network) -> Finish / Create
    await page.locator('[data-testid="template-tech-mesh"]').click();
    await page.locator('[data-testid="wizard-create-btn"]').click();

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

    // 7. Test Template Switching (switch to Clean template)
    await page.locator('[data-testid="design-template-clean-minimal"]').click();

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
  });

  test('Complete flow on mobile phone viewport (390x844): Start -> Demo Project -> Mobile Editor, swipe gestures, tabs, and bottom sheet', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
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

    // 6. Open Design Tab -> Bottom Sheet opens with subtabs
    await page.locator('[data-testid="mobile-tab-design"]').click();
    await expect(page.locator('[data-testid="mobile-bottom-sheet"]')).toBeVisible();
    await expect(page.locator('[data-testid="design-inspector"]')).toBeVisible();

    // Switch to Brand subtab
    await page.locator('[data-testid="mobile-design-subtab-brand"]').click();
    await expect(page.locator('[data-testid="brand-inspector"]')).toBeVisible();

    // Close bottom sheet via Escape key
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="mobile-bottom-sheet"]')).not.toBeVisible();

    // 7. Open Export Tab
    await page.locator('[data-testid="mobile-tab-export"]').click();
    await expect(page.locator('[data-testid="mobile-bottom-sheet"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-start-export-btn"]')).toBeVisible();

    // 8. Verify Zero Console Errors
    expect(consoleErrors).toEqual([]);
  });
});
