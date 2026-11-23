import { test, expect } from '@playwright/test';

test.describe('Component Gallery Route (/gallery)', () => {
  test('searches templates, filters categories, and persists favorites', async ({ page }) => {
    await page.goto('/gallery');
    await page.getByTestId('gallery-search').fill('Weave');
    await expect(page.getByTestId('gallery-template-card')).toHaveCount(1);
    await expect(page.getByTestId('gallery-template-card')).toHaveAttribute('data-template-id', 'tech-mesh');

    await page.getByTestId('gallery-search').fill('');
    const categories = page.getByTestId('gallery-category');
    await expect(categories.locator('option')).toHaveCount(8); // All + six populated categories (coding, marketing, education, lifestyle, personal-brand, general, heritage)
    await expect(categories.locator('option[value="coptic"]')).toHaveCount(0);
    await expect(categories.locator('option[value="islamic"]')).toHaveCount(0);
    await categories.selectOption('marketing');
    await expect(page.getByTestId('gallery-template-card')).toHaveCount(1);
    await expect(page.getByTestId('gallery-template-card')).toHaveAttribute('data-template-id', 'bold-marketing');

    await page.getByTestId('gallery-category').selectOption('all');
    await page.getByTestId('favorite-tech-mesh').click();
    await page.getByTestId('favorites-filter').click();
    await expect(page.getByTestId('gallery-template-card')).toHaveCount(1);
    await expect(page.getByTestId('gallery-template-card')).toHaveAttribute('data-template-id', 'tech-mesh');
    await page.reload();
    await expect(page.getByTestId('favorite-tech-mesh')).toHaveAttribute('aria-pressed', 'true');
    await page.getByTestId('favorites-filter').click();
    await page.getByTestId('favorite-tech-mesh').click();
  });

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

  test('verifies the five starter template previews (Spec §7.1, Task R2-6)', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/gallery');
    await page.getByTestId('type-select').selectOption('cover');
    await page.getByTestId('aspect-select').selectOption('portrait');

    const templates = ['tech-mesh', 'clean-minimal', 'bold-marketing', 'soft-gradient', 'heritage-geometric'] as const;

    for (const tmpl of templates) {
      // Select template
      const templateSelect = page.getByTestId('template-select');
      await templateSelect.selectOption(tmpl);

      // Verify canvas elements received template class and data attribute
      const canvases = page.locator('.slide-canvas');
      const firstCanvas = canvases.first();
      const className = tmpl === 'tech-mesh' ? 'network' : tmpl === 'clean-minimal' ? 'clean' : tmpl === 'bold-marketing' ? 'bold' : tmpl === 'soft-gradient' ? 'soft' : 'heritage';
      await expect(firstCanvas).toHaveClass(new RegExp(`template-${className}`));
      await expect(firstCanvas).toHaveAttribute('data-template-id', tmpl);
      const preview = page.locator('[data-testid="template-preview-card"] img');
      await expect.poll(() => preview.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);

      // Verify specific template markers
      if (tmpl === 'tech-mesh') {
        await expect(page.getByTestId('network-bg-svg').first()).toBeVisible();
      } else if (tmpl === 'soft-gradient') {
        await expect(page.getByTestId('soft-gradient-bg').first()).toBeVisible();
      } else if (tmpl === 'heritage-geometric') {
        await expect(page.getByTestId('heritage-geometric-bg').first()).toBeVisible();
      } else {
        await expect(page.getByTestId('network-bg-svg')).toHaveCount(0);
      }

    }

    // Verify Light Theme Snapshot
    const themeBtn = page.getByTestId('toggle-theme');
    await themeBtn.click();
    await expect(page.getByTestId('toggle-theme')).toContainText('Light');
    await expect(page.locator('[data-testid="template-preview-card"] img')).toBeVisible();

    // Verify Arabic RTL Snapshot
    const langBtn = page.getByTestId('toggle-lang');
    await langBtn.click();
    await expect(page.getByTestId('toggle-lang')).toContainText('العربية');
    await expect(page.locator('[data-testid="template-preview-card"] img')).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });
});

