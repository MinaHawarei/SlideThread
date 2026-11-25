import { test, expect } from '@playwright/test';
import JSZip from 'jszip';
import { copyFile, readFile } from 'node:fs/promises';
import sharp from 'sharp';

const id = `composition-fixture-${Date.now().toString(36)}`;
const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#ff6b35"/><circle cx="20" cy="20" r="9" fill="#ffffff"/></svg>';

async function fixtureZip(): Promise<Buffer> {
  const zip = new JSZip();
  const manifest = {
    schema: 1, id, name: { en: 'Composition Fixture', ar: 'اختبار التكوين' }, author: { name: 'SlideThread tests' }, license: 'MIT',
    categories: ['general'], tags: ['fixture'], colorFlexible: true,
    theme: { fonts: { display: 'ibm-plex-sans', body: 'ibm-plex-sans-arabic', mono: 'jetbrains-mono' } },
    layouts: { cover: 'cover-centered' }, assets: { mark: 'assets/mark.svg' },
    composition: { cover: { portrait: { elements: [
      { id: 'fixture-tag', kind: 'text', binding: 'tag', x: 0.08, y: 0.08, w: 0.45, h: 0.06, rotation: 0, z: 2, locked: false, text: { type: 'doc', blocks: [{ type: 'p', runs: [{ text: 'EDITABLE TAG' }] }] } },
      { id: 'fixture-chip', kind: 'text', x: 0.08, y: 0.65, w: 0.40, h: 0.08, rotation: 0, z: 3, locked: false, backgroundColor: '#123456', cornerRadius: 12, textStyle: { font: 'ibm-plex-serif', size: 22, weight: 600, italic: true, color: '#ffffff' }, text: { type: 'doc', blocks: [{ type: 'p', runs: [{ text: 'npm run build' }] }] } },
      { id: 'fixture-text', kind: 'text', x: 0.08, y: 0.82, w: 0.84, h: 0.13, rotation: 0, z: 4, locked: false, textStyle: { font: 'ibm-plex-sans-arabic', size: 20, color: '#ff00aa' }, text: { type: 'doc', blocks: [{ type: 'p', runs: [{ text: 'مرحبا mixed Arabic and English — this is a long composition text for wrapping and RTL verification.' }] }] } },
      { id: 'fixture-image', kind: 'image', x: 0.76, y: 0.65, w: 0.16, h: 0.16, rotation: 0, z: 5, locked: false, assetId: 'mark', filters: { grayscale: 0 } },
      { id: 'fixture-shape', kind: 'shape', shape: 'rectangle', x: 0.54, y: 0.65, w: 0.16, h: 0.08, rotation: 0, z: 6, locked: false, fill: '#ff6b35', cornerRadius: 8, strokeColor: '#ffffff', strokeWidth: 2 },
    ] } } },
  };
  zip.file(`${id}/template.json`, JSON.stringify(manifest));
  zip.file(`${id}/assets/mark.svg`, svg);
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

test('ZIP composition creates isolated editable native layers that persist after source removal and export', async ({ page }) => {
  test.setTimeout(180000);
  await page.setViewportSize({ width: 1280, height: 900 });
  page.setDefaultTimeout(15000);
  await page.goto('/gallery');
  await page.getByTestId('template-zip-input').setInputFiles({ name: `${id}.zip`, mimeType: 'application/zip', buffer: await fixtureZip() });
  await expect(page.getByTestId('template-import-notice')).toBeVisible({ timeout: 30000 });
  await page.getByTestId(`use-user-template-${id}`).click();
  await expect(page.getByTestId('editor-desktop')).toBeVisible();
  await page.getByTestId('tab-layers').click();

  for (const elementId of ['fixture-tag', 'fixture-chip', 'fixture-text', 'fixture-image', 'fixture-shape']) {
    await expect(page.getByTestId(`layer-row-${elementId}`)).toBeVisible();
  }
  await expect(page.getByTestId('layer-row-tag')).toHaveCount(0); // semantic tag field is represented by the bound native text layer

  await page.getByTestId('layer-row-fixture-tag').getByRole('button').first().click();
  const tagEditor = page.getByTestId('rich-text-contenteditable');
  await expect(tagEditor).toBeVisible();
  await tagEditor.fill('UPDATED TAG');
  await page.getByTestId('tab-layers').click();
  await page.getByTestId('layer-row-fixture-chip').getByRole('button').first().click();
  await page.getByTestId('sidebar-typography-font').selectOption('ibm-plex-serif');
  await page.getByTestId('sidebar-typography-weight').selectOption('700');
  await page.getByTestId('sidebar-typography-italic').check();
  await page.getByTestId('tab-layers').click();
  await page.getByTestId('layer-row-fixture-shape').getByRole('button').first().click();
  await page.getByTestId('sidebar-corner-radius').fill('18');
  await page.getByTestId('tab-layers').click();
  await page.getByTestId('layer-row-fixture-image').getByRole('button').first().click();
  await page.getByTestId('sidebar-image-filters').locator('input[type=range]').first().fill('120');
  await expect(page.getByTestId('main-canvas').getByTestId('image-extra-mask-fixture-image')).toBeVisible();
  await page.getByTestId('tab-layers').click();
  await page.getByTestId('layer-row-fixture-shape').getByRole('button').first().click();
  const shapeLayer = page.getByTestId('main-canvas').getByTestId('extra-element-fixture-shape');
  await page.getByTestId('sidebar-x-position').fill('52');
  await page.getByTestId('sidebar-y-position').fill('70');
  await page.getByTestId('sidebar-element-width').fill('20');
  await page.getByTestId('sidebar-rotation-input').fill('15');
  await expect.poll(async () => shapeLayer.evaluate((node) => (node as HTMLElement).style.transform)).toBe('rotate(15deg)');
  await page.getByTestId('editor-undo-btn').click();
  await expect.poll(async () => shapeLayer.evaluate((node) => (node as HTMLElement).style.transform)).toBe('rotate(0deg)');
  await page.getByTestId('editor-redo-btn').click();
  await expect.poll(async () => shapeLayer.evaluate((node) => (node as HTMLElement).style.transform)).toBe('rotate(15deg)');
  await page.getByTestId('tab-layers').click();
  await page.getByTestId('layer-row-fixture-shape').getByRole('button').first().click();
  await page.getByTestId('sidebar-lock-btn').click();
  await expect(page.getByTestId('sidebar-lock-btn')).toContainText('Unlock');
  await page.getByTestId('sidebar-lock-btn').click();
  await page.getByTestId('sidebar-hide-btn').click();
  await expect(shapeLayer).toHaveCount(0);
  await page.getByTestId('sidebar-hide-btn').click();
  await expect(shapeLayer).toBeVisible();
  const oldZ = await shapeLayer.evaluate((node) => (node as HTMLElement).style.zIndex);
  await page.getByTestId('sidebar-layer-up').click();
  await expect.poll(async () => shapeLayer.evaluate((node) => (node as HTMLElement).style.zIndex)).not.toBe(oldZ);
  await page.getByTestId('sidebar-duplicate-btn').click();
  await page.getByTestId('tab-layers').click();
  const duplicateRows = page.getByTestId('layers-list').locator('[data-testid^="layer-row-fixture-shape_copy_"]');
  await expect(duplicateRows).toHaveCount(1);
  await page.getByTestId('editor-undo-btn').click();
  await page.getByTestId('tab-layers').click();
  await expect(duplicateRows).toHaveCount(0);
  await page.getByTestId('editor-redo-btn').click();
  await page.getByTestId('tab-layers').click();
  await expect(duplicateRows).toHaveCount(1);
  await page.getByTestId('editor-undo-btn').click();
  await page.getByTestId('tab-layers').click();
  await expect(duplicateRows).toHaveCount(0);

  // Missing square-specific composition falls back to the existing normalized instance geometry.
  await page.getByTestId('editor-change-format-btn').click();
  await page.getByTestId('change-format-option-r_1_1').click();
  await page.getByTestId('apply-change-format-btn').click();
  await expect.poll(async () => page.getByTestId('main-canvas').getByTestId('extra-element-fixture-shape').evaluate((node) => (node as HTMLElement).style.left)).toBe('52%');
  await expect.poll(async () => page.getByTestId('main-canvas').getByTestId('extra-element-fixture-shape').evaluate((node) => (node as HTMLElement).style.width)).toBe('20%');
  await page.reload();
  await expect(page.getByTestId('editor-desktop')).toBeVisible();
  await page.getByTestId('tab-layers').click();
  await expect(page.getByTestId('layer-row-fixture-chip')).toBeVisible();
  await page.getByTestId('layer-row-fixture-tag').getByRole('button').first().click();
  await expect(page.getByTestId('main-canvas').getByTestId('text-extra-fixture-tag')).toContainText('UPDATED TAG');
  await expect(page.getByTestId('main-canvas').getByTestId('shape-rectangle-fixture-shape')).toHaveCSS('border-radius', '18px');

  await page.getByTestId('editor-export-btn').click();
  await page.getByTestId('export-format-png').click();
  const [pngDownload] = await Promise.all([page.waitForEvent('download'), page.getByTestId('export-start-btn').click()]);
  const pngPath = await pngDownload.path();
  expect(pngPath).toBeTruthy();
  await copyFile(pngPath!, '/tmp/slidethread-stage3-composition.png');
  const png = await readFile(pngPath!);
  const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
  expect(info.width).toBeGreaterThan(500);
  expect(data.some((value, index) => index % info.channels === 0 && value > 200)).toBe(true);

  await page.getByTestId('editor-export-btn').click();
  await page.getByTestId('export-format-pdf').click();
  const [pdfDownload] = await Promise.all([page.waitForEvent('download'), page.getByTestId('export-start-btn').click()]);
  const pdfPath = await pdfDownload.path();
  expect(pdfPath).toBeTruthy();
  const pdf = await readFile(pdfPath!);
  expect(pdf.toString('latin1', 0, 5)).toBe('%PDF-');
  await copyFile(pdfPath!, '/tmp/slidethread-stage3-composition.pdf');

  // Source-package deletion does not affect the project snapshot or its embedded SVG asset.
  await page.goto('/gallery');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByTestId(`delete-user-template-${id}`).click();
  await expect(page.getByTestId(`user-template-card-${id}`)).toHaveCount(0);
  await page.goBack();
  await expect(page.getByTestId('editor-desktop')).toBeVisible();
  await expect(page.getByTestId('main-canvas').getByTestId('image-extra-mask-fixture-image')).toBeVisible();
});
