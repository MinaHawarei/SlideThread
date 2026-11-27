import { test, expect } from '@playwright/test';

const TYPES = ['cover', 'explain', 'rule', 'code', 'compare', 'stat', 'quote', 'image', 'cta'];

test('every selection frame lies inside the slide on every slide type', async ({ page }) => {
  test.setTimeout(110000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/editor');
  await expect(page.getByTestId('editor-desktop')).toBeVisible({ timeout: 15000 });
  for (const type of TYPES) {
    if (type !== 'cover') {
      await page.getByTestId('rail-add-slide-type-btn').click();
      await page.getByTestId(`type-option-${type}`).click();
    }
    await page.waitForTimeout(600);
    const result = await page.evaluate(() => {
      const slide = document.querySelector('[data-testid="main-canvas"] .slide-canvas, [data-testid="main-canvas"] [class*="slide-canvas"]') as HTMLElement | null;
      const canvas = document.querySelector('[data-testid="main-canvas"]') as HTMLElement;
      const hits = [...document.querySelectorAll('[data-testid^="element-hit-"]')] as HTMLElement[];
      const frame = (slide ?? canvas).getBoundingClientRect();
      const outside: string[] = [];
      for (const h of hits) {
        const r = h.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) continue;
        if (r.left < frame.left - 4 || r.top < frame.top - 4 || r.right > frame.right + 4 || r.bottom > frame.bottom + 4) {
          outside.push(h.getAttribute('data-testid') ?? '?');
        }
      }
      return { count: hits.length, outside, haveSlide: !!slide };
    });
    expect(result.count, `${type} has selectable frames`).toBeGreaterThan(0);
    expect(result.outside, `${type} frames outside the slide`).toEqual([]);
  }
});
