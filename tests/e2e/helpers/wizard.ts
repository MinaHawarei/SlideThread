import type { Page } from '@playwright/test';

/** After choosing a template in the Gallery the wizard opens with the template already picked: platform, content type, format, then create. */
export async function finishLockedWizard(page: Page): Promise<void> {
  await page.getByTestId('wizard-next-btn').click();
  await page.getByTestId('wizard-next-btn').click();
  await page.getByTestId('wizard-create-btn').click();
}
