import { test, expect } from '@playwright/test';

test.describe('Settings Page Persistence & Data Management E2E (Spec §5.5)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('settings modifications persist across page reload', async ({ page }) => {
    // 1. Edit Display Name
    const nameInput = page.getByTestId('settings-display-name-input');
    await expect(nameInput).toBeVisible();
    await nameInput.fill('Sarah Jenkins');

    // 2. Edit Handle
    const handleInput = page.getByTestId('settings-handle-input');
    await handleInput.fill('@sarahjenkins');

    // 3. Switch Default Theme
    const lightThemeBtn = page.getByTestId('settings-theme-light');
    await lightThemeBtn.click();

    // 4. Reload page to verify persistence across reload
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 5. Assert values persisted in inputs
    await expect(page.getByTestId('settings-display-name-input')).toHaveValue('Sarah Jenkins');
    await expect(page.getByTestId('settings-handle-input')).toHaveValue('@sarahjenkins');
    await expect(page.getByTestId('settings-theme-light')).toHaveClass(/border-cyan-500/);
  });

  test('export all data triggers a valid JSON file download', async ({ page }) => {
    // Fill customized values
    await page.getByTestId('settings-display-name-input').fill('Backup Test User');

    // Listen for download event
    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('settings-export-all-btn').click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^slidethread-backup-\d{4}-\d{2}-\d{2}\.json$/);
  });

  test('import all data restores projects and settings from JSON', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    const backupPayload = JSON.stringify({
      schemaVersion: 2,
      exportedAt: Date.now(),
      settings: {
        displayName: 'Restored Profile',
        handle: '@restoredprofile',
        showSignature: true,
        showSocials: false,
        showCounter: true,
        socials: [],
        language: 'en',
        defaultTemplateId: 'clean-minimal',
        defaultPrimaryColor: '#7c3aed',
        defaultTheme: 'light',
      },
      projects: {},
      recents: [],
    });

    const fileInput = page.getByTestId('settings-import-input');
    await fileInput.setInputFiles({
      name: 'slidethread-backup-test.json',
      mimeType: 'application/json',
      buffer: Buffer.from(backupPayload),
    });

    // Verify restored profile is shown
    await expect(page.getByTestId('settings-display-name-input')).toHaveValue('Restored Profile');
    await expect(page.getByTestId('settings-handle-input')).toHaveValue('@restoredprofile');
  });
});
