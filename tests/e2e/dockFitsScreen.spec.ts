import { test, expect } from '@playwright/test';

// The right dock never scrolls as a whole: all three cards stay on screen and long content scrolls inside a card.
for (const vh of [720, 900]) {
  test(`dock cards fit the screen at 1440x${vh} with Properties open`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: vh });
    await page.goto('/');
    await page.getByTestId('demo-en-btn').click();
    await expect(page.getByTestId('editor-desktop')).toBeVisible({ timeout: 15000 });
    await page.getByTestId('canvas-next-btn').click();
    await page.getByTestId('element-hit-title').first().click({ force: true });
    const m = await page.evaluate(() => {
      const dock = document.querySelector('[data-testid="inspector"]') as HTMLElement;
      const rect = (id: string) => (document.querySelector(`[data-testid="${id}"]`) as HTMLElement).getBoundingClientRect();
      return {
        layersBottom: rect('dock-card-layers').bottom,
        layersTop: rect('dock-card-layers').top,
        dockBottom: dock.getBoundingClientRect().bottom,
        vh: window.innerHeight,
        pageOverflow: document.documentElement.scrollHeight > window.innerHeight,
      };
    });
    expect(m.layersBottom).toBeLessThanOrEqual(m.vh);
    expect(m.layersTop).toBeLessThan(m.vh - 100);
    expect(m.pageOverflow).toBe(false);
    // Layers header is clickable (collapse works as before).
    await page.getByTestId('dock-card-layers-head').click();
    await expect(page.getByTestId('dock-card-layers-head')).toHaveAttribute('aria-expanded', 'false');
  });
}
