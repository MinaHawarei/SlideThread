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
    await openTemplateDialog(page, template);
  } else {
    await page.getByTestId('start-wizard-btn').click();
  }
  await page.getByTestId(`platform-${platform}`).click();
  await page.getByTestId(`type-${type}`).click();
  await page.getByTestId(`format-${format}`).click();
  if (format !== 'r_1_1') await page.getByTestId(`orientation-${orientation}`).click();
  await page.getByTestId('create-submit').click();
}

/**
 * Opens the create dialog for a built-in template. Gallery templates use their card's Use button;
 * clean-minimal is not in the Gallery, it is the base of the Blank project, so it opens through Start creating.
 */
export async function openTemplateDialog(page: Page, id: string): Promise<void> {
  if (id === 'clean-minimal') {
    await page.goto('/');
    await page.getByTestId('start-wizard-btn').click();
    return;
  }
  await page.goto('/gallery');
  await page.getByTestId('gallery-template-card').first().waitFor({ state: 'visible', timeout: 15000 });
  const use = page.getByTestId(`use-template-${id}`);
  const more = page.getByTestId('gallery-load-more');
  // The Gallery shows one page of cards at a time; reveal more until this template's card exists.
  for (let i = 0; i < 10 && (await use.count()) === 0 && (await more.count()) > 0; i++) await more.click();
  await use.click({ force: true });
}
