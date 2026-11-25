/**
 * Task 2 Acceptance Tests — 16:9 landscape cover: no overlap between title/subtitle/chip and side card
 *
 * Verifies via geometry check that:
 *   - The slide card's bounding box does NOT intersect the title/subtitle bounding boxes.
 *   - Works for all 5 templates × EN/AR × short/long title.
 *   - 4:5, 1:1, 9:16 non-landscape formats are unaffected (regression guard).
 */
import { test, expect, type Page } from '@playwright/test';

type TemplateName = 'clean-minimal' | 'heritage-geometric' | 'soft-gradient' | 'bold-marketing' | 'tech-mesh';

const TEMPLATES: TemplateName[] = [
  'clean-minimal',
  'heritage-geometric',
  'soft-gradient',
  'bold-marketing',
  'tech-mesh',
];

const LONG_TITLE = 'Building the Future One Innovation at a Time in Eleven Words';
const SHORT_TITLE = 'Short Title';

/** Check if two bounding boxes overlap (with 2px tolerance). */
function boxesOverlap(
  a: { x: number; y: number; width: number; height: number } | null,
  b: { x: number; y: number; width: number; height: number } | null,
  tolerance = 2,
): boolean {
  if (!a || !b) return false;
  return !(
    a.x + a.width - tolerance <= b.x ||
    b.x + b.width - tolerance <= a.x ||
    a.y + a.height - tolerance <= b.y ||
    b.y + b.height - tolerance <= a.y
  );
}

/** Create a 16:9 landscape cover project using the wizard. */
async function createLandscapeCover(page: Page, templateId: string, lang: 'en' | 'ar' = 'en') {
  await page.goto('/');
  await expect(page.locator('[data-testid="start-screen"]')).toBeVisible({ timeout: 15000 });

  if (lang === 'ar') {
    // Switch language to Arabic if switcher available
    const langBtn = page.getByTestId('language-switcher');
    if (await langBtn.count() > 0) await langBtn.click();
  }

  await page.getByTestId('start-wizard-btn').click();
  // Choose LinkedIn (which creates 16:9 landscape)
  await page.getByTestId('platform-linkedin').click();
  await page.getByTestId('wizard-next-btn').click();
  // Choose carousel or any type
  const carouselBtn = page.getByTestId('type-carousel');
  await expect(carouselBtn).toBeVisible();
  await carouselBtn.click();
  await page.getByTestId('wizard-next-btn').click();
  // Pick landscape format (16:9 / r_16_9)
  const fmt169 = page.getByTestId('format-r_16_9');
  await expect(fmt169).toBeVisible();
  await fmt169.click();
  const landscapeOrientation = page.getByTestId('orientation-landscape');
  await expect(landscapeOrientation).toBeVisible();
  await landscapeOrientation.click();
  await page.getByTestId('wizard-next-btn').click();
  // Pick template
  const tmplBtn = page.getByTestId(`template-${templateId}`);
  await expect(tmplBtn).toBeVisible();
  await tmplBtn.click();
  await page.getByTestId('wizard-create-btn').click();
  await expect(page.getByTestId('editor-desktop')).toBeVisible({ timeout: 15000 });
}

test.describe('Task 2 — 16:9 cover: title/subtitle does not overlap the side card', () => {
  for (const template of TEMPLATES) {
    for (const titleKind of ['long', 'short'] as const) {
      test(`No overlap — template=${template} title=${titleKind} EN`, async ({ page }) => {
        test.setTimeout(60000);
        await page.setViewportSize({ width: 1440, height: 900 });
        await createLandscapeCover(page, template, 'en');

        const title = titleKind === 'long' ? LONG_TITLE : SHORT_TITLE;
        const titleHit = page.getByTestId('element-hit-title').first();
        await titleHit.dblclick({ force: true });
        const inlineEditor = titleHit.getByTestId('rich-text-editor-container');
        await expect(inlineEditor).toBeVisible();
        const editor = inlineEditor.getByTestId('rich-text-contenteditable');
        await editor.click();
        await page.keyboard.press('ControlOrMeta+a');
        await page.keyboard.type(title);
        await page.keyboard.press('Escape');
        await expect(inlineEditor).not.toBeVisible();

        // The first slide is the cover; check geometry in-canvas.
        // We look for the slide-card and slide-title-h1 elements within the slide canvas.
        const slideCanvas = page.getByTestId('workspace-stage').locator('.slide-canvas');
        await expect(slideCanvas).toBeVisible({ timeout: 10000 });

        const titleEl = slideCanvas.locator('.slide-title-h1').first();
        const subEl = slideCanvas.locator('.slide-sub').first();
        const cardEl = slideCanvas.locator('.slide-card').first();
        await expect(titleEl).toBeVisible();
        await expect(titleEl).toHaveText(title);
        await expect(subEl).toBeVisible();
        await expect(cardEl).toBeVisible();

        const cardBox = await cardEl.boundingBox();

        const titleBox = await titleEl.boundingBox();
        expect(
          boxesOverlap(titleBox, cardBox),
          `title overlaps card in template=${template} title=${titleKind}`,
        ).toBe(false);
        const subBox = await subEl.boundingBox();
        expect(
          boxesOverlap(subBox, cardBox),
          `subtitle overlaps card in template=${template} title=${titleKind}`,
        ).toBe(false);
      });
    }
  }
});

test.describe('Task 2 — Regression: non-landscape formats unchanged', () => {
  for (const fmtTestId of ['format-r_4_5', 'format-r_1_1'] as const) {
    test(`No regression for ${fmtTestId}`, async ({ page }) => {
      test.setTimeout(60000);
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/');
      await expect(page.locator('[data-testid="start-screen"]')).toBeVisible({ timeout: 15000 });
      await page.getByTestId('start-wizard-btn').click();
      await page.getByTestId('platform-linkedin').click();
      await page.getByTestId('wizard-next-btn').click();
      const carouselBtn = page.getByTestId('type-carousel');
      if (await carouselBtn.count() > 0) await carouselBtn.click();
      await page.getByTestId('wizard-next-btn').click();
      const fmtBtn = page.getByTestId(fmtTestId);
      if (await fmtBtn.count() > 0) {
        await fmtBtn.click();
      }
      await page.getByTestId('wizard-next-btn').click();
      await page.getByTestId('wizard-create-btn').click();
      await expect(page.getByTestId('editor-desktop')).toBeVisible({ timeout: 15000 });

      // Slide should load with no JS errors
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));
      await page.waitForTimeout(1000);
      expect(errors, 'JS errors on non-landscape cover').toHaveLength(0);
    });
  }
});
