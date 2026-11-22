import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import JSZip from 'jszip';

test.describe('Gate G4 Verification (End of Phase 4)', () => {
  test.setTimeout(120000);

  test('executes complete persistence, paste-to-slides, JSON I/O, and multi-format export pipeline', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('favicon') && !text.includes('Vite')) {
          consoleErrors.push(text);
        }
      }
    });

    // 1. Start Screen
    await page.goto('/');
    await expect(page.locator('[data-testid="start-screen"]')).toBeVisible();

    // 2. Direct format creation for fast, clean slide set
    const directCard = page.locator('[data-testid="start-direct-card"]');
    await directCard.click();

    const formatSquare = page.locator('[data-testid="direct-format-r_1_1"]');
    await expect(formatSquare).toBeVisible();
    await formatSquare.click();

    // 3. Verify Editor Desktop
    await expect(page.locator('[data-testid="editor-desktop"]')).toBeVisible();
    const slidesRail = page.locator('[data-testid="slide-rail"]');
    await expect(slidesRail).toBeVisible();

    // ==========================================
    // 4. Project JSON Export
    // ==========================================
    const exportJsonBtn = page.locator('[data-testid="editor-export-json-btn"]');
    await expect(exportJsonBtn).toBeVisible();

    const [jsonDownload] = await Promise.all([
      page.waitForEvent('download'),
      exportJsonBtn.click(),
    ]);

    expect(jsonDownload.suggestedFilename()).toMatch(/\.json$/i);
    const jsonPath = await jsonDownload.path();
    expect(jsonPath).toBeTruthy();

    const jsonText = await fs.promises.readFile(jsonPath!, 'utf8');
    const parsedBundle = JSON.parse(jsonText);
    expect(parsedBundle.project).toBeDefined();
    expect(parsedBundle.project.slides.length).toBeGreaterThanOrEqual(1);

    // ==========================================
    // 5. Project JSON Import from Start Screen
    // ==========================================
    const homeBtn = page.locator('[data-testid="editor-home-btn"]');
    await homeBtn.click();
    await expect(page.locator('[data-testid="start-screen"]')).toBeVisible();

    // Upload the exported JSON file
    const fileInput = page.locator('[data-testid="start-file-input"]');
    await fileInput.setInputFiles(jsonPath!);

    // Should immediately open imported project in editor
    await expect(page.locator('[data-testid="editor-desktop"]')).toBeVisible();

    // ==========================================
    // 6. Paste-to-Slides Workflow
    // ==========================================
    const pasteBtn = page.locator('[data-testid="rail-paste-slides-btn"]');
    await expect(pasteBtn).toBeVisible();
    await pasteBtn.click();

    const pasteDialog = page.locator('[data-testid="paste-slides-dialog"]');
    await expect(pasteDialog).toBeVisible();

    const pasteTextarea = page.locator('[data-testid="paste-textarea"]');
    const sampleOutline = `
---
### Architectural Overview
\`\`\`ts
export function createPipeline() {
  return new EventStream();
}
\`\`\`
Scalable event bus architecture
    `.trim();

    await pasteTextarea.fill(sampleOutline);

    const applyPasteBtn = page.locator('[data-testid="paste-apply-btn"]');
    await expect(applyPasteBtn).toBeEnabled();
    await applyPasteBtn.click();

    await expect(pasteDialog).not.toBeVisible();

    // ==========================================
    // 7. Multi-Format Export: PNG, ZIP, PDF
    // ==========================================
    const exportModalBtn = page.locator('[data-testid="editor-export-btn"]');
    await exportModalBtn.click();

    const exportDialog = page.locator('[data-testid="export-dialog"]');
    await expect(exportDialog).toBeVisible();

    // 7A. Single PNG
    await page.locator('[data-testid="export-format-png"]').click();
    const [pngDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('[data-testid="export-start-btn"]').click(),
    ]);
    expect(pngDownload.suggestedFilename()).toMatch(/\.png$/i);
    const pngPath = await pngDownload.path();
    const pngStats = await fs.promises.stat(pngPath!);
    expect(pngStats.size).toBeGreaterThan(1000);

    await expect(exportDialog).not.toBeVisible({ timeout: 5000 });

    // 7B. Multi-slide ZIP
    await exportModalBtn.click();
    await expect(exportDialog).toBeVisible();
    await page.locator('[data-testid="export-format-zip"]').click();

    const [zipDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('[data-testid="export-start-btn"]').click(),
    ]);
    expect(zipDownload.suggestedFilename()).toMatch(/\.zip$/i);
    const zipPath = await zipDownload.path();
    const zipBuffer = await fs.promises.readFile(zipPath!);
    const unzipped = await JSZip.loadAsync(zipBuffer);
    const zipFiles = Object.keys(unzipped.files);
    expect(zipFiles.length).toBeGreaterThanOrEqual(2);

    await expect(exportDialog).not.toBeVisible({ timeout: 5000 });

    // 7C. Multi-page PDF
    await exportModalBtn.click();
    await expect(exportDialog).toBeVisible();
    await page.locator('[data-testid="export-format-pdf"]').click();

    const [pdfDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('[data-testid="export-start-btn"]').click(),
    ]);
    expect(pdfDownload.suggestedFilename()).toMatch(/\.pdf$/i);
    const pdfPath = await pdfDownload.path();
    const pdfBuffer = await fs.promises.readFile(pdfPath!);
    expect(pdfBuffer.toString('utf8', 0, 5)).toBe('%PDF-');

    await expect(exportDialog).not.toBeVisible({ timeout: 5000 });

    // ==========================================
    // 8. Autosave & Reload Verification
    // ==========================================
    const titleInput = page.locator('[data-testid="editor-project-title"]');
    await titleInput.fill('Gate G4 Production Carousel');

    // Allow debounced autosave to persist
    await page.waitForTimeout(700);

    // Reload page
    await page.reload();

    // Either resumes directly or open via Start Screen recent project
    const recentItem = page.locator('[data-testid="start-screen"]');
    if (await recentItem.isVisible()) {
      const openRecent = page.locator('[data-testid^="recent-open-"]').first();
      await openRecent.click();
    }

    await expect(page.locator('[data-testid="editor-desktop"]')).toBeVisible();
    await expect(page.locator('[data-testid="editor-project-title"]')).toHaveValue('Gate G4 Production Carousel');

    // 9. Zero console errors
    expect(consoleErrors).toHaveLength(0);
  });
});
