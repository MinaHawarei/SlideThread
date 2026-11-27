/**
 * Every element of every built-in slide type must be selectable on the canvas, show its Element Properties
 * panel with size controls, and actually change size on the rendered slide (keyboard scale and drag handle).
 * Locked elements must not be selectable on the canvas but must stay unlockable from the Layers tab.
 */
import { test, expect, type Page } from '@playwright/test';
import { SLOT_SELECTORS } from '../../src/core/elementModel';

const ELEMENTS: Record<string, string[]> = {
  cover: ['tag', 'title', 'body', 'rule'],
  explain: ['title', 'body', 'media'],
  rule: ['title', 'condLabel', 'cond', 'resLabel', 'res', 'note'],
  code: ['title', 'code', 'note'],
  compare: ['title', 'l1', 't1', 'l2', 't2'],
  stat: ['value', 'label', 'note'],
  quote: ['text', 'author'],
  image: ['media', 'caption'],
  cta: ['media', 'name', 'handle', 'title', 'body', 'action'],
};

async function createEditor(page: Page) {
  await page.route('**/_vercel/insights/**', (route) => route.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/editor');
  await expect(page.getByTestId('editor-desktop')).toBeVisible({ timeout: 15000 });
}

async function nodeWidth(page: Page, id: string): Promise<number | undefined> {
  const selector = SLOT_SELECTORS[id]!;
  return page.evaluate((sel) => {
    const canvas = document.querySelector('[data-testid="main-canvas"] .slide-canvas');
    const node = canvas?.querySelector<HTMLElement>(sel);
    return node ? node.getBoundingClientRect().width : undefined;
  }, selector);
}

for (const [type, ids] of Object.entries(ELEMENTS)) {
  test(`${type} slide: every element is selectable, has size controls and resizes`, async ({ page }) => {
    test.setTimeout(120000);
    await createEditor(page);
    if (type !== 'cover') {
      await page.getByTestId('rail-add-slide-type-btn').click();
      await page.getByTestId(`type-option-${type}`).click();
    }
    await page.waitForTimeout(600);
    for (const id of ids) {
      const hit = page.getByTestId(`element-hit-${id}`);
      if ((await nodeWidth(page, id)) === undefined) {
        // Empty field: nothing is rendered, so there must be no phantom frame on the canvas.
        await expect(hit, `${type}/${id} is empty so it has no canvas frame`).toHaveCount(0);
        continue;
      }
      await expect(hit, `${type}/${id} has a canvas hit area`).toHaveCount(1);
      await hit.focus();
      await expect(page.getByTestId('element-properties-panel'), `${type}/${id} panel opens`).toBeVisible();
      await expect(page.getByTestId('sidebar-element-width'), `${type}/${id} width control`).toBeVisible();
      await expect(page.getByTestId('sidebar-element-scale'), `${type}/${id} scale control`).toBeVisible();
      await expect(page.getByTestId(`resize-${id}`), `${type}/${id} resize handle`).toBeVisible();
      const before = await nodeWidth(page, id);
      if (before === undefined) continue; // the element has no rendered content on this slide (empty field), so only selection is checked
      // Panel scale control changes the rendered size.
      await page.getByTestId('sidebar-element-scale').fill('150');
      await expect.poll(() => nodeWidth(page, id), `${type}/${id} scale 150 changes rendered width`).toBeGreaterThan(before * 1.2);
      await page.getByTestId('sidebar-element-scale').fill('100');
      await expect.poll(() => nodeWidth(page, id), `${type}/${id} scale 100 restores width`).toBeLessThan(before * 1.1);
      // Dragging the resize handle changes the rendered size.
      await page.waitForTimeout(400); // let the overlay re-measure before reading the handle position
      const handle = page.getByTestId(`resize-${id}`);
      const box = await handle.boundingBox();
      expect(box, `${type}/${id} handle box`).toBeTruthy();
      const w0 = (await nodeWidth(page, id))!;
      await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
      await page.mouse.down();
      await page.mouse.move(box!.x + box!.width / 2 + 80, box!.y + box!.height / 2 + 40, { steps: 6 });
      await page.mouse.up();
      await expect.poll(() => nodeWidth(page, id), `${type}/${id} drag handle grows element`).toBeGreaterThan(w0 * 1.05);
      await page.getByTestId('sidebar-element-scale').fill('100');
      // Keyboard scale ("+") on the canvas element changes the rendered size.
      await hit.focus();
      const afterReset = (await nodeWidth(page, id))!;
      await page.keyboard.press('+');
      await expect.poll(() => nodeWidth(page, id), `${type}/${id} + key grows element`).toBeGreaterThan(afterReset * 1.02);
      await page.getByTestId('sidebar-element-scale').fill('100');
    }
  });
}

test('locked element is not selectable on the canvas but can be unlocked from the Layers tab', async ({ page }) => {
  await createEditor(page);
  await page.getByTestId('element-hit-title').focus();
  await page.getByTestId('sidebar-lock-btn').click();
  await page.getByTestId('properties-deselect-btn').click();
  await expect(page.getByTestId('element-properties-panel')).toHaveCount(0);
  const hit = page.getByTestId('element-hit-title');
  await expect(hit).toHaveAttribute('data-locked', 'true');
  expect(await hit.evaluate((node) => getComputedStyle(node).pointerEvents)).toBe('none');
  // Real mouse click at the title position, plus a double click, must not select or edit.
  const title = page.locator('[data-testid="main-canvas"] .slide-canvas .slide-title-h1').first();
  const box = (await title.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.getByTestId('element-properties-panel')).toHaveCount(0);
  await expect(page.getByTestId('element-hit-title').getByTestId('rich-text-contenteditable')).toHaveCount(0);
  // Keyboard focus cannot reach it either.
  await expect(hit).toHaveAttribute('tabindex', '-1');
  // Layers tab still lists it and can unlock it.
  await page.getByTestId('tab-layers').click();
  await expect(page.getByTestId('layer-row-title')).toBeVisible();
  await page.getByRole('button', { name: /unlock/i }).first().click();
  await expect(page.getByTestId('element-hit-title')).not.toHaveAttribute('data-locked', 'true');
  await page.getByTestId('element-hit-title').focus();
  await expect(page.getByTestId('element-properties-panel')).toBeVisible();
});

test('inline canvas text editing shows no formatting toolbar', async ({ page }) => {
  await createEditor(page);
  await page.getByTestId('element-hit-title').dblclick();
  await expect(page.getByTestId('element-hit-title').getByTestId('rich-text-contenteditable')).toBeVisible();
  await expect(page.getByTestId('rich-text-floating-toolbar')).toHaveCount(1); // only the embedded one inside the Element Properties panel
  await expect(page.getByTestId('element-properties-panel').getByTestId('rich-text-floating-toolbar')).toHaveCount(1);
  await expect(page.locator('[data-rich-text-toolbar="true"]')).toHaveCount(0);
});
