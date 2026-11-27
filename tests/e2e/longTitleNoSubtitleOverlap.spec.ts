/**
 * Long cover titles must not overlap the subtitle in any aspect, for every built-in template.
 * Geometry check on the rendered cover (title vs subtitle bounding boxes).
 */
import { test, expect, type Page } from '@playwright/test';
import { openTemplateDialog } from './helpers/wizard';

const TEMPLATES = ['clean-minimal', 'heritage-geometric', 'soft-gradient', 'bold-marketing', 'tech-mesh'];
// r_9_16 is only offered for the story content type, so it uses the story wizard path.
const FORMATS = ['r_1_1', 'r_4_5', 'r_9_16'] as const;
const TITLES = {
  en: 'Building the Future One Innovation at a Time in Eleven Words and Even More Words',
  ar: 'بناء المستقبل خطوة بخطوة من خلال الابتكار المستمر والعمل الجماعي المتقن في كل مرحلة',
};

type Box = { x: number; y: number; width: number; height: number };
const overlaps = (a: Box, b: Box, tol = 1) =>
  !(a.x + a.width - tol <= b.x || b.x + b.width - tol <= a.x || a.y + a.height - tol <= b.y || b.y + b.height - tol <= a.y);

async function createCover(page: Page, templateId: string, format: string) {
  await page.goto('/');
  await openTemplateDialog(page, templateId);
  await page.getByTestId(format === 'r_9_16' ? 'platform-instagram' : 'platform-linkedin').click();
  await page.getByTestId(format === 'r_9_16' ? 'type-story' : 'type-carousel').click();
  await page.getByTestId(`format-${format}`).click();
  if (format !== 'r_1_1') await page.getByTestId('orientation-portrait').click();
  await page.getByTestId('create-submit').click();
  await expect(page.getByTestId('editor-desktop')).toBeVisible({ timeout: 15000 });
}

for (const format of FORMATS) {
  for (const template of TEMPLATES) {
    for (const lang of ['en', 'ar'] as const) {
      test(`long ${lang} title does not overlap subtitle: ${template} ${format}`, async ({ page }) => {
        test.setTimeout(60000);
        await page.setViewportSize({ width: 1440, height: 900 });
        await createCover(page, template, format);
        const titleHit = page.getByTestId('element-hit-title').first();
        await titleHit.dblclick({ force: true });
        const inline = titleHit.getByTestId('rich-text-editor-container');
        await expect(inline).toBeVisible();
        await inline.getByTestId('rich-text-contenteditable').click();
        await page.keyboard.press('ControlOrMeta+a');
        await page.keyboard.type(TITLES[lang]);
        await page.keyboard.press('Escape');
        await expect(inline).not.toBeVisible();

        const canvas = page.getByTestId('workspace-stage').locator('.slide-canvas');
        const titleBox = await canvas.locator('.slide-title-h1').first().boundingBox();
        // clean-minimal opens through Start creating, which is the Blank project: its subtitle is empty and not rendered.
        const blankBase = template === 'clean-minimal';
        const sub = canvas.locator('.slide-sub');
        if (blankBase) await expect(sub).toHaveCount(0);
        const subBox = blankBase ? null : await sub.first().boundingBox();
        const canvasBox = await canvas.boundingBox();
        expect(titleBox && canvasBox && (blankBase || subBox)).toBeTruthy();
        if (subBox) expect(overlaps(titleBox!, subBox), `title ${JSON.stringify(titleBox)} overlaps subtitle ${JSON.stringify(subBox)}`).toBe(false);
        // The title must also stay inside the slide.
        expect(titleBox!.y).toBeGreaterThanOrEqual(canvasBox!.y - 1);
        expect(titleBox!.y + titleBox!.height).toBeLessThanOrEqual(canvasBox!.y + canvasBox!.height + 1);
      });
    }
  }
}
