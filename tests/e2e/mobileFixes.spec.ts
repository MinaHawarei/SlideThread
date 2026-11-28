import { test, expect, type Page } from '@playwright/test';

async function setLanguage(page: Page, lang: 'en' | 'ar') {
  await page.addInitScript((l) => {
    localStorage.setItem('slidethread:locale', JSON.stringify({ state: { locale: l }, version: 0 }));
  }, lang);
}

for (const width of [320, 390]) {
  for (const lang of ['en', 'ar'] as const) {
    test.describe(`Mobile Fixes (${width}px, ${lang})`, () => {
      test.use({ viewport: { width, height: 844 } });

      test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => localStorage.clear());
        await setLanguage(page, lang);
      });

      test('1. Header hamburger & logo order, drawer side, and no horizontal overflow', async ({ page }) => {
        const routes = ['/', '/gallery', '/settings', '/preview?template=tech-mesh'];
        for (const route of routes) {
          await page.goto(route);
          await page.waitForLoadState('networkidle');

          // No horizontal overflow
          const overflow = await page.evaluate(() => ({
            scrollWidth: document.documentElement.scrollWidth,
            innerWidth: window.innerWidth,
          }));
          expect(overflow.scrollWidth, `overflow on ${route}`).toBeLessThanOrEqual(overflow.innerWidth);

          const toggle = page.getByTestId('mobile-nav-toggle');
          await expect(toggle, `toggle visible on ${route}`).toBeVisible();
          const toggleBox = await toggle.boundingBox();
          expect(toggleBox).not.toBeNull();

          // The brand link: a text wordmark in the app nav, a logo mark on the template preview header
          const headerLogo = page.locator('header a[href="/"][dir="ltr"]:visible').first();
          const logoBox = await headerLogo.boundingBox();
          expect(logoBox).not.toBeNull();

          // The layout never mirrors: the hamburger stays left of the logo in both languages.
          expect(toggleBox!.x, `${lang} hamburger left of logo on ${route}`).toBeLessThan(logoBox!.x);

          // Open drawer and check it opens from the button's side
          await toggle.click();
          const drawer = page.getByTestId('mobile-nav-drawer');
          await expect(drawer).toBeVisible();
          const drawerBox = await drawer.boundingBox();
          expect(drawerBox).not.toBeNull();
          // The layout never mirrors: the drawer opens from the left in both languages.
          expect(drawerBox!.x).toBeLessThanOrEqual(2);

          await page.getByTestId('mobile-nav-close').click();
          await expect(drawer).not.toBeVisible();
        }
      });

      test('2 & 3. Mobile editor Undo/Redo and inline Branding Overview in Edit panel', async ({ page }) => {
        await page.goto('/editor');
        await page.waitForLoadState('networkidle');

        // No horizontal overflow
        const overflow = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
        }));
        expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth);

        // Undo & Redo buttons visible, initially disabled, direction-appropriate icons
        const undoBtn = page.getByTestId('mobile-editor-undo-btn');
        const redoBtn = page.getByTestId('mobile-editor-redo-btn');
        await expect(undoBtn).toBeVisible();
        await expect(redoBtn).toBeVisible();
        await expect(undoBtn).toBeDisabled();
        await expect(redoBtn).toBeDisabled();

        // Icons are SVG now (approved mobile redesign); RTL swaps them in code.
        await expect(undoBtn.locator('svg')).toBeVisible();
        await expect(redoBtn.locator('svg')).toBeVisible();

        // Tap signature element on canvas -> should NOT open floating popover, SHOULD open Edit sheet with inline branding controls
        const sigHit = page.getByTestId('element-hit-signature');
        await expect(sigHit).toBeVisible();
        await sigHit.click();

        await expect(page.getByTestId('brand-override-popover')).toHaveCount(0);
        const sheet = page.getByTestId('mobile-bottom-sheet');
        await expect(sheet).toBeVisible();
        const inlineBrand = sheet.getByTestId('brand-override-inline');
        await expect(inlineBrand).toBeVisible();

        // Check sheet has no horizontal overflow
        const sheetOverflow = await sheet.evaluate((el) => ({
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
        }));
        expect(sheetOverflow.scrollWidth).toBeLessThanOrEqual(sheetOverflow.clientWidth);

        // Update branding name and verify canvas updates
        const nameInput = inlineBrand.getByTestId('brand-override-name-input');
        await nameInput.fill('Mobile Brand Test');
        await expect(
          page.getByTestId('mobile-scaled-slide-container').getByTestId('signature-bar').getByText('Mobile Brand Test')
        ).toBeVisible();

        // Reset button should now be enabled and reset back
        const resetBtn = inlineBrand.getByTestId('brand-override-reset-btn');
        await expect(resetBtn).toBeEnabled();
        await resetBtn.click();
        await expect(resetBtn).toBeDisabled();

        // Close sheet, test Undo/Redo
        await page.getByTestId('mobile-sheet-close-btn').click();
        await expect(sheet).not.toBeVisible();

        // Add text element via Assets tab to create a history entry
        await page.getByTestId('mobile-tab-media').click();
        await page.getByTestId('add-text-btn').click();
        await expect(undoBtn).toBeEnabled();
        await undoBtn.click();
        await expect(redoBtn).toBeEnabled();
        await redoBtn.click();
      });
    });
  }
}
