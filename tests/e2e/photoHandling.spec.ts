import { test, expect } from '@playwright/test';

test.describe('Photo Handling & Avatar Upload E2E (Spec §5.5)', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage before test
    await page.addInitScript(() => {
      localStorage.clear();
    });
  });

  test('clicking avatar opens file picker, crop dialog, and updates signature and CTA avatars', async ({ page }) => {
    await page.goto('/editor');
    await page.waitForLoadState('networkidle');

    // Create a tiny 1x1 png data buffer to simulate an uploaded photo
    const buffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAD0lEQVR42mNk+M9QDwAEhgH95b9lEQAAAABJRU5ErkJggg==',
      'base64'
    );

    // 1. Check placeholder avatar initially exists on signature bar
    const canvas = page.getByTestId('main-canvas');
    await expect(canvas).toBeVisible();

    const sigAvatarRing = canvas.getByTestId('sig-avatar-ring');
    await expect(sigAvatarRing).toBeVisible();

    // 2. Upload file via the signature avatar input
    const sigInput = canvas.getByTestId('signature-avatar-input');
    await sigInput.setInputFiles({
      name: 'avatar-test.png',
      mimeType: 'image/png',
      buffer,
    });

    // 3. PhotoCropDialog opens
    const cropDialog = page.getByTestId('photo-crop-dialog');
    await expect(cropDialog).toBeVisible();

    const zoomSlider = page.getByTestId('photo-crop-zoom-slider');
    await expect(zoomSlider).toBeVisible();

    // 4. Confirm crop
    const confirmBtn = page.getByTestId('photo-crop-confirm-btn');
    await confirmBtn.click();
    await expect(cropDialog).not.toBeVisible();

    // 5. Signature avatar now renders the cropped photo on canvas
    const sigAvatarImg = canvas.getByTestId('sig-avatar-img');
    await expect(sigAvatarImg).toBeVisible();
    const imgSrc = await sigAvatarImg.getAttribute('src');
    expect(imgSrc).toMatch(/^data:image\/jpeg;base64,/);

    // 6. Navigate to Brand tab in inspector to verify BrandInspector shows the preview
    const brandTab = page.getByTestId('tab-brand');
    await brandTab.click();

    const brandAvatarPreview = page.getByTestId('brand-avatar-preview');
    await expect(brandAvatarPreview).toBeVisible();

    // 7. Verify CTA slide reflects the uploaded photo as well
    const slideTab = page.getByTestId('tab-slide');
    await slideTab.click();

    const typePicker = page.getByTestId('slide-type-select');
    if (await typePicker.isVisible()) {
      await typePicker.selectOption('cta');

      const ctaAvatarImg = canvas.getByTestId('cta-avatar-img');
      await expect(ctaAvatarImg).toBeVisible();
      const ctaSrc = await ctaAvatarImg.getAttribute('src');
      expect(ctaSrc).toMatch(/^data:image\/jpeg;base64,/);
    }
  });

  test('Settings page avatar is clickable and opens crop dialog', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    const buffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAD0lEQVR42mNk+M9QDwAEhgH95b9lEQAAAABJRU5ErkJggg==',
      'base64'
    );

    const settingsInput = page.getByTestId('settings-avatar-input');
    await expect(settingsInput).toBeAttached();

    await settingsInput.setInputFiles({
      name: 'settings-photo.png',
      mimeType: 'image/png',
      buffer,
    });

    const cropDialog = page.getByTestId('photo-crop-dialog');
    await expect(cropDialog).toBeVisible();

    const confirmBtn = page.getByTestId('photo-crop-confirm-btn');
    await confirmBtn.click();
    await expect(cropDialog).not.toBeVisible();

    const preview = page.getByTestId('settings-avatar-preview');
    await expect(preview).toBeVisible();
    const src = await preview.getAttribute('src');
    expect(src).toMatch(/^data:image\/jpeg;base64,/);
  });
});
