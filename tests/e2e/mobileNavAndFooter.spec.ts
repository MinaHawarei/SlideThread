import { test, expect } from '@playwright/test';

test.describe('Mobile Navigation Drawer and Footer follow-up', () => {
  test('Part A: footer shows centered logo, vertical separator, and V 1.0.0 on non-editor pages', async ({ page }) => {
    for (const path of ['/', '/gallery', '/settings']) {
      await page.goto(path);
      const footer = page.getByTestId('app-footer');
      await expect(footer).toBeVisible();

      const brandVersion = page.getByTestId('footer-brand-version');
      await expect(brandVersion).toBeVisible();
      await expect(brandVersion).toHaveAttribute('dir', 'ltr');

      const versionText = page.getByTestId('footer-version');
      await expect(versionText).toBeVisible();
      await expect(versionText).toHaveText('V 1.0.0');

      // Assert version is plain text without badge / pill container classes
      const versionClass = await versionText.getAttribute('class');
      expect(versionClass).not.toContain('bg-stone');
      expect(versionClass).not.toContain('rounded-full');
      expect(versionClass).not.toContain('border');
    }
  });

  test('Part B: mobile drawer opens as full-height side drawer with all links at 390px on Home and Gallery', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    for (const path of ['/', '/gallery']) {
      await page.goto(path);

      const toggle = page.getByTestId('mobile-nav-toggle');
      await expect(toggle).toBeVisible();
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');

      // Click hamburger
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');

      const drawer = page.getByTestId('mobile-nav-drawer');
      await expect(drawer).toBeVisible();

      // Check drawer height is full screen (approx 844px), not header height (76px)
      const box = await drawer.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThan(600);
      expect(box!.width).toBeGreaterThanOrEqual(280);

      // Verify all links are visible
      const homeLink = page.getByTestId('mobile-drawer-home');
      const galleryLink = page.getByTestId('mobile-drawer-gallery');
      const settingsLink = page.getByTestId('mobile-drawer-settings');

      await expect(homeLink).toBeVisible();
      await expect(galleryLink).toBeVisible();
      await expect(settingsLink).toBeVisible();

      // Verify language switcher is NOT in the drawer
      await expect(page.locator('#mobile-nav-drawer [data-testid="language-switcher"]')).toHaveCount(0);

      // Press Escape closes drawer
      await page.keyboard.press('Escape');
      await expect(drawer).not.toBeVisible();
      await expect(toggle).toBeFocused();
    }
  });

  test('Part B: mobile drawer navigation and overlay dismissal in Arabic (layout never mirrors)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/settings');

    // Switch to Arabic in settings
    await page.getByTestId('settings-lang-ar-btn').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');

    // Open drawer
    const toggle = page.getByTestId('mobile-nav-toggle');
    await toggle.click();

    const drawer = page.getByTestId('mobile-nav-drawer');
    await expect(drawer).toBeVisible();
    // The layout never mirrors: the drawer keeps its physical left placement.
    await expect(drawer).not.toHaveAttribute('dir');
    await expect(drawer).toHaveClass(/left-0/);

    // Click Gallery link -> navigates and closes drawer
    await page.getByTestId('mobile-drawer-gallery').click();
    await expect(page).toHaveURL(/\/gallery$/);
    await expect(drawer).not.toBeVisible();

    // Reopen drawer on Gallery
    await page.getByTestId('mobile-nav-toggle').click();
    await expect(page.getByTestId('mobile-nav-drawer')).toBeVisible();

    // Click overlay -> closes drawer
    // The drawer is always on the left now; click the overlay outside it (x > drawer width 288).
    await page.getByTestId('mobile-nav-overlay').click({ position: { x: 340, y: 300 } });
    await expect(page.getByTestId('mobile-nav-drawer')).not.toBeVisible();

    // Check no horizontal overflow
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(hasOverflow).toBe(false);
  });

  test('Part B: drawer auto-closes on viewport resize across 768px breakpoint', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    await page.getByTestId('mobile-nav-toggle').click();
    await expect(page.getByTestId('mobile-nav-drawer')).toBeVisible();

    // Resize to desktop (768px)
    await page.setViewportSize({ width: 768, height: 900 });

    await expect(page.getByTestId('mobile-nav-drawer')).not.toBeVisible();
    const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
    expect(bodyOverflow).toBe('');
  });

  test('Zero horizontal overflow audit across 320, 360, 390, 768, 1280 px', async ({ page }) => {
    for (const width of [320, 360, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 800 });
      for (const path of ['/', '/gallery', '/settings', '/preview?template=bold-marketing']) {
        await page.goto(path);
        const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
        expect(hasOverflow, `Overflow on ${path} at width ${width}`).toBe(false);
      }
    }
  });
});
