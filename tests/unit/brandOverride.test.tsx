import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, renderHook } from '@testing-library/react';
import { CURRENT_SCHEMA_VERSION } from '../../src/core/schema';
import { useProjectStore, useEffectiveBrand, getEffectiveBrand } from '../../src/store/projectStore';
import { useSettingsStore, DEFAULT_BRAND_SETTINGS } from '../../src/store/settingsStore';
import { BrandOverridePopover } from '../../src/ui/editor/BrandOverridePopover';
import { BrandInspector } from '../../src/ui/editor/BrandInspector';

describe('Brand Override System (§5.5)', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      settings: {
        ...DEFAULT_BRAND_SETTINGS,
        displayName: 'Default User',
        handle: '@default',
        photoDataUrl: undefined,
      },
    });

    useProjectStore.setState({
      project: {
        id: 'proj_override_test',
        schemaVersion: CURRENT_SCHEMA_VERSION,
        title: 'Brand Override Project',
        formatId: 'r_4_5',
        orientation: 'portrait',
        contentType: 'carousel',
        platform: 'linkedin',
        templateId: 'clean-minimal',
        primaryColor: '#0A84FF',
        theme: 'dark',
        textDir: 'ltr',
        slides: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      activeSlideId: '',
    });
  });

  describe('Store Actions', () => {
    it('updates brand override for this project only', () => {
      useProjectStore.getState().updateBrandOverride({
        displayName: 'Override User',
        handle: '@overridden',
      });

      const project = useProjectStore.getState().project;
      expect(project.brandOverride).toBeDefined();
      expect(project.brandOverride?.displayName).toBe('Override User');
      expect(project.brandOverride?.handle).toBe('@overridden');

      // Global settings remain untouched
      const settings = useSettingsStore.getState().settings;
      expect(settings.displayName).toBe('Default User');
      expect(settings.handle).toBe('@default');
    });

    it('resets brand override without modifying default settings', () => {
      useProjectStore.getState().updateBrandOverride({
        displayName: 'Temporary Name',
      });
      expect(useProjectStore.getState().project.brandOverride?.displayName).toBe('Temporary Name');

      useProjectStore.getState().resetBrandOverride();
      expect(useProjectStore.getState().project.brandOverride).toBeUndefined();

      // Defaults unchanged
      expect(useSettingsStore.getState().settings.displayName).toBe('Default User');
    });

    it('applies brand override to defaults and clears project override', () => {
      useProjectStore.getState().updateBrandOverride({
        displayName: 'Promoted Name',
        handle: '@promoted',
        photoDataUrl: 'data:image/png;base64,promotedPhoto',
      });

      useProjectStore.getState().applyBrandOverrideToDefaults();

      // Project override is cleared
      expect(useProjectStore.getState().project.brandOverride).toBeUndefined();

      // Global settings are updated
      const settings = useSettingsStore.getState().settings;
      expect(settings.displayName).toBe('Promoted Name');
      expect(settings.handle).toBe('@promoted');
      expect(settings.photoDataUrl).toBe('data:image/png;base64,promotedPhoto');
    });
  });

  describe('useEffectiveBrand & getEffectiveBrand Selectors', () => {
    it('returns default settings when no brand override exists', () => {
      const { result } = renderHook(() => useEffectiveBrand());
      expect(result.current.displayName).toBe('Default User');
      expect(result.current.handle).toBe('@default');

      const effective = getEffectiveBrand();
      expect(effective.displayName).toBe('Default User');
      expect(effective.handle).toBe('@default');
    });

    it('merges brand override over defaults when override exists', () => {
      useProjectStore.getState().updateBrandOverride({
        displayName: 'Custom Project Name',
      });

      const { result } = renderHook(() => useEffectiveBrand());
      expect(result.current.displayName).toBe('Custom Project Name');
      expect(result.current.handle).toBe('@default'); // Unmodified field falls back to settings

      const effective = getEffectiveBrand();
      expect(effective.displayName).toBe('Custom Project Name');
      expect(effective.handle).toBe('@default');
    });
  });

  describe('BrandOverridePopover Component', () => {
    it('renders popover with inputs reflecting effective brand', () => {
      render(<BrandOverridePopover />);

      expect(screen.getByTestId('brand-override-popover')).toBeInTheDocument();
      const nameInput = screen.getByTestId('brand-override-name-input') as HTMLInputElement;
      const handleInput = screen.getByTestId('brand-override-handle-input') as HTMLInputElement;

      expect(nameInput.value).toBe('Default User');
      expect(handleInput.value).toBe('@default');
    });

    it('disables Reset and Apply buttons when no override exists', () => {
      render(<BrandOverridePopover />);

      const resetBtn = screen.getByTestId('brand-override-reset-btn');
      const applyBtn = screen.getByTestId('brand-override-apply-defaults-btn');

      expect(resetBtn).toBeDisabled();
      expect(applyBtn).toBeDisabled();
    });

    it('updates override on user input and enables action buttons', () => {
      render(<BrandOverridePopover />);

      const nameInput = screen.getByTestId('brand-override-name-input');
      fireEvent.change(nameInput, { target: { value: 'New Brand Name' } });

      expect(useProjectStore.getState().project.brandOverride?.displayName).toBe('New Brand Name');

      const resetBtn = screen.getByTestId('brand-override-reset-btn');
      const applyBtn = screen.getByTestId('brand-override-apply-defaults-btn');
      expect(resetBtn).not.toBeDisabled();
      expect(applyBtn).not.toBeDisabled();
    });

    it('clicking Reset button invokes resetBrandOverride', () => {
      useProjectStore.getState().updateBrandOverride({
        displayName: 'Transient Name',
      });

      render(<BrandOverridePopover />);
      const resetBtn = screen.getByTestId('brand-override-reset-btn');
      fireEvent.click(resetBtn);

      expect(useProjectStore.getState().project.brandOverride).toBeUndefined();
    });

    it('clicking Apply button invokes applyBrandOverrideToDefaults', () => {
      useProjectStore.getState().updateBrandOverride({
        displayName: 'Permanent Brand',
        handle: '@permanent',
      });

      render(<BrandOverridePopover />);
      const applyBtn = screen.getByTestId('brand-override-apply-defaults-btn');
      fireEvent.click(applyBtn);

      expect(useProjectStore.getState().project.brandOverride).toBeUndefined();
      expect(useSettingsStore.getState().settings.displayName).toBe('Permanent Brand');
      expect(useSettingsStore.getState().settings.handle).toBe('@permanent');
    });

    it('calls onClose when close button is clicked', () => {
      let closed = false;
      render(<BrandOverridePopover onClose={() => { closed = true; }} />);

      const closeBtn = screen.getByTestId('brand-override-close-btn');
      fireEvent.click(closeBtn);
      expect(closed).toBe(true);
    });
  });

  describe('BrandInspector Active Override Banner', () => {
    it('shows override banner when project brandOverride exists', () => {
      useProjectStore.getState().updateBrandOverride({
        displayName: 'Project Special',
      });

      render(<BrandInspector />);
      expect(screen.getByTestId('brand-override-active-banner')).toBeInTheDocument();

      const resetSidebarBtn = screen.getByTestId('brand-override-reset-sidebar-btn');
      fireEvent.click(resetSidebarBtn);

      expect(useProjectStore.getState().project.brandOverride).toBeUndefined();
    });

    it('does not show override banner when brandOverride is absent', () => {
      render(<BrandInspector />);
      expect(screen.queryByTestId('brand-override-active-banner')).toBeNull();
    });
  });
});
