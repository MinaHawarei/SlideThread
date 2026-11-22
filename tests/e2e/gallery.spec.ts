import { test, expect } from '@playwright/test';

test.describe('Component Gallery Route (/gallery)', () => {
  test('renders all 9 slide types across aspect classes without errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/gallery');

    // Title should be visible
    await expect(page.getByRole('heading', { name: 'SlideThread Component Gallery' })).toBeVisible();

    // All 9 section titles should be present
    const expectedTypes = ['cover', 'explain', 'rule', 'compare', 'code', 'stat', 'quote', 'image', 'cta'];
    for (const type of expectedTypes) {
      await expect(page.getByRole('heading', { name: `${type} Slide` })).toBeVisible();
    }

    // Toggle theme to Light
    const themeBtn = page.getByTestId('toggle-theme');
    await themeBtn.click();
    await expect(page.getByTestId('toggle-theme')).toContainText('Light');

    // Toggle language to Arabic
    const langBtn = page.getByTestId('toggle-lang');
    await langBtn.click();
    await expect(page.getByTestId('toggle-lang')).toContainText('العربية');

    // Code container should still be LTR
    const codeContainer = page.locator('.code-container').first();
    await expect(codeContainer).toHaveAttribute('dir', 'ltr');

    // Filter to a specific slide type (e.g. quote)
    const typeSelect = page.getByTestId('type-select');
    await typeSelect.selectOption('quote');
    await expect(page.getByRole('heading', { name: 'quote Slide' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'explain Slide' })).not.toBeVisible();

    // Reset filter to all
    await typeSelect.selectOption('all');

    // Toggle safe zones on
    const safeZoneBtn = page.getByTestId('toggle-safe-zones');
    await safeZoneBtn.click();
    await expect(page.getByTestId('story-safe-zone-overlay').first()).toBeVisible();

    // Capture visual snapshot for Gate G1
    await page.screenshot({ path: 'tests/e2e/snapshots/gallery-g1.png', fullPage: true });

    expect(consoleErrors).toEqual([]);
  });

  test('captures and verifies template matrix across network, clean, and bold templates (Spec §7.1, Task P2-3)', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/gallery');

    const templates = ['network', 'clean', 'bold'] as const;

    for (const tmpl of templates) {
      // Select template
      const templateSelect = page.getByTestId('template-select');
      await templateSelect.selectOption(tmpl);

      // Verify canvas elements received template class and data attribute
      const canvases = page.locator('.slide-canvas');
      const firstCanvas = canvases.first();
      await expect(firstCanvas).toHaveClass(new RegExp(`template-${tmpl}`));
      await expect(firstCanvas).toHaveAttribute('data-template-id', tmpl);

      // Verify specific template markers
      if (tmpl === 'network') {
        await expect(page.getByTestId('network-bg-svg').first()).toBeVisible();
      } else {
        await expect(page.getByTestId('network-bg-svg')).toHaveCount(0);
      }

      // Capture full-page snapshot for this template
      await page.screenshot({ path: `tests/e2e/snapshots/gallery-tmpl-${tmpl}.png`, fullPage: true });
    }

    // Verify Light Theme Snapshot
    const themeBtn = page.getByTestId('toggle-theme');
    await themeBtn.click();
    await expect(page.getByTestId('toggle-theme')).toContainText('Light');
    await page.screenshot({ path: 'tests/e2e/snapshots/gallery-light-theme.png', fullPage: true });

    // Verify Arabic RTL Snapshot
    const langBtn = page.getByTestId('toggle-lang');
    await langBtn.click();
    await expect(page.getByTestId('toggle-lang')).toContainText('العربية');
    await page.screenshot({ path: 'tests/e2e/snapshots/gallery-arabic-rtl.png', fullPage: true });

    expect(consoleErrors).toEqual([]);
  });
});

