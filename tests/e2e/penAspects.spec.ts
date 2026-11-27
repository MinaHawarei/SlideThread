import { test, expect, type Page } from '@playwright/test';

async function create(page: Page, fmt: string) {
  await page.goto('/');
  await page.goto('/gallery');
  await page.getByTestId('use-template-tech-mesh').click({ force: true });
  await page.getByTestId(fmt === 'r_9_16' ? 'platform-instagram' : 'platform-linkedin').click();
  await page.getByTestId(fmt === 'r_9_16' ? 'type-story' : 'type-carousel').click();
  await page.getByTestId(`format-${fmt}`).click();
  if (fmt !== 'r_1_1') await page.getByTestId(fmt === 'r_16_9' ? 'orientation-landscape' : 'orientation-portrait').click();
  await page.getByTestId('create-submit').click();
  await expect(page.getByTestId('editor-desktop')).toBeVisible({ timeout: 15000 });
}

for (const fmt of ['r_9_16', 'r_16_9', 'r_1_1']) {
  test(`pen path and converted shape land inside the slide on ${fmt}`, async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await create(page, fmt);
    await page.getByTestId('rail-tool-elements').click();
    await page.getByTestId('rail-tool-bezier').click();
    const b = (await page.getByTestId('bezier-pen-surface').boundingBox())!;
    for (const [x, y] of [[0.25, 0.25], [0.75, 0.25], [0.75, 0.75], [0.25, 0.25]] as Array<[number, number]>) await page.mouse.click(b.x + b.width * x, b.y + b.height * y);
    const slide = (await page.getByTestId('main-canvas').locator('.slide-canvas').boundingBox())!;
    const pathBox = (await page.getByTestId('main-canvas').locator('[data-testid^="shape-path-"]').first().boundingBox())!;
    expect(pathBox.x).toBeGreaterThanOrEqual(slide.x - 1);
    expect(pathBox.y).toBeGreaterThanOrEqual(slide.y - 1);
    expect(pathBox.x + pathBox.width).toBeLessThanOrEqual(slide.x + slide.width + 1);
    expect(pathBox.y + pathBox.height).toBeLessThanOrEqual(slide.y + slide.height + 1);
    // The drawn triangle spans about half the slide in each direction.
    expect(pathBox.width / slide.width).toBeGreaterThan(0.35);
    expect(pathBox.height / slide.height).toBeGreaterThan(0.35);

    await page.getByTestId('assets-search-input').fill('hexagon');
    await page.getByTestId('assets-grid').getByRole('button').first().click();
    await page.getByTestId('convert-to-path').click();
    const boxes = await page.getByTestId('main-canvas').locator('[data-testid^="shape-path-"]').evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return r.width / r.height; }));
    expect(boxes).toHaveLength(2);
    // A hexagon keeps a sane (not stretched) aspect.
    expect(boxes[1]).toBeGreaterThan(0.7);
    expect(boxes[1]).toBeLessThan(1.5);
  });
}
