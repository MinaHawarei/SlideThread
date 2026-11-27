import type { Page } from '@playwright/test';

/**
 * After Use on a template the create dialog is open with LinkedIn, carousel and 4:5 preselected.
 * Orientation has no default, so the test picks one before the create button enables.
 */
export async function finishLockedWizard(page: Page, orientation: 'portrait' | 'landscape' = 'portrait'): Promise<void> {
  await page.getByTestId(`orientation-${orientation}`).click();
  await page.getByTestId('create-submit').click();
}

/** Blank-mode flow from Home: Start creating opens the dialog, then pick platform, type, size, orientation and (optionally) a template card from the Gallery; with no template this is the blank project. */
export async function createFromHome(
  page: Page,
  options: { platform?: string; type?: string; format?: string; orientation?: 'portrait' | 'landscape'; template?: string } = {},
): Promise<void> {
  const { platform = 'linkedin', type = 'carousel', format = 'r_4_5', orientation = 'portrait', template } = options;
  if (template) {
    await page.goto('/gallery');
    await page.getByTestId(`use-template-${template}`).click({ force: true });
  } else {
    await page.getByTestId('start-wizard-btn').click();
  }
  await page.getByTestId(`platform-${platform}`).click();
  await page.getByTestId(`type-${type}`).click();
  await page.getByTestId(`format-${format}`).click();
  if (format !== 'r_1_1') await page.getByTestId(`orientation-${orientation}`).click();
  await page.getByTestId('create-submit').click();
}
