import React from 'react';
import { useT } from '../../i18n';
import { useProjectStore, useEffectiveBrand } from '../../store/projectStore';
import { useAvatarUpload } from '../common/useAvatarUpload';
import { CameraIcon, CloseIcon, SparkleIcon } from '../common/icons';

export interface BrandOverrideControlsProps {
  onClose?: () => void;
  inline?: boolean;
}

export const BrandOverrideControls: React.FC<BrandOverrideControlsProps> = ({
  onClose,
  inline = false,
}) => {
  const { t } = useT();
  const project = useProjectStore((state) => state.project);
  const updateBrandOverride = useProjectStore((state) => state.updateBrandOverride);
  const resetBrandOverride = useProjectStore((state) => state.resetBrandOverride);
  const applyBrandOverrideToDefaults = useProjectStore(
    (state) => state.applyBrandOverrideToDefaults
  );

  const effectiveBrand = useEffectiveBrand();
  const hasOverride = Boolean(
    project.brandOverride && Object.keys(project.brandOverride).length > 0
  );

  const { fileInputRef, handleFileChange, triggerUpload } = useAvatarUpload({
    onCrop: (cropped) => {
      updateBrandOverride({ photoDataUrl: cropped });
    },
  });

  return (
    <div
      data-testid={inline ? 'brand-override-inline' : undefined}
      className={inline ? 'p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 space-y-3' : 'space-y-3'}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3
            id="brand-override-title"
            className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5"
          >
            <SparkleIcon size={16} />
            <span>{t('brand.overrideTitle')}</span>
          </h3>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            {t('brand.overrideDesc')}
          </p>
        </div>

        {onClose && !inline && (
          <button
            type="button"
            data-testid="brand-override-close-btn"
            onClick={onClose}
            className="w-6 h-6 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 flex items-center justify-center text-xs"
            aria-label="Close"
          >
            <CloseIcon size={16} />
          </button>
        )}
      </div>

      {/* Profile Row: Avatar, Name, Handle */}
      <div className="flex items-center gap-3">
        {/* Avatar with tap/click-to-upload (no hover required when inline) */}
        <button
          type="button"
          onClick={triggerUpload}
          data-testid="brand-override-avatar-btn"
          className="relative group cursor-pointer w-12 h-12 rounded-full overflow-visible shrink-0 border-2 border-cyan-500 bg-slate-100 dark:bg-slate-800 p-0"
          title="Change photo for this project"
          aria-label="Change photo for this project"
        >
          <div className="w-full h-full rounded-full overflow-hidden">
            {effectiveBrand.photoDataUrl ? (
              <img
                src={effectiveBrand.photoDataUrl}
                alt={effectiveBrand.displayName || 'Avatar'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-sm text-cyan-600">
                {effectiveBrand.displayName.trim().charAt(0).toUpperCase() || 'M'}
              </div>
            )}
          </div>
          {inline ? (
            <span
              aria-hidden="true"
              className="absolute -bottom-1 -end-1 w-5 h-5 rounded-full bg-cyan-600 text-white text-[10px] flex items-center justify-center shadow border border-white dark:border-stone-900"
            >
              <CameraIcon size={11} />
            </span>
          ) : (
            <div className="avatar-hover-overlay rounded-full" aria-hidden="true">
              <CameraIcon size={13} />
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </button>

        {/* Inputs */}
        <div className="flex-1 space-y-1.5 min-w-0">
          <input
            type="text"
            data-testid="brand-override-name-input"
            value={effectiveBrand.displayName}
            onChange={(e) => updateBrandOverride({ displayName: e.target.value })}
            placeholder="Name for this project"
            className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:border-cyan-500"
          />
          <input
            type="text"
            data-testid="brand-override-handle-input"
            value={effectiveBrand.handle}
            onChange={(e) => updateBrandOverride({ handle: e.target.value })}
            placeholder="@handle for this project"
            className="w-full text-xs font-mono px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Action Buttons: Apply to Defaults & Reset */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
        <button
          type="button"
          data-testid="brand-override-reset-btn"
          onClick={resetBrandOverride}
          disabled={!hasOverride}
          className="min-h-[36px] py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 font-medium transition-colors"
        >
          {t('brand.resetToDefaults')}
        </button>

        <button
          type="button"
          data-testid="brand-override-apply-defaults-btn"
          onClick={applyBrandOverrideToDefaults}
          disabled={!hasOverride}
          className="min-h-[36px] py-1 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold disabled:opacity-40 shadow-xs transition-colors"
        >
          {t('brand.applyToDefaults')}
        </button>
      </div>
    </div>
  );
};

export interface BrandOverridePopoverProps {
  onClose?: () => void;
  zoom?: number;
  position?: 'top' | 'bottom';
}

export const BrandOverridePopover: React.FC<BrandOverridePopoverProps> = ({
  onClose,
  zoom = 1,
  position = 'top',
}) => {
  return (
    <div
      data-testid="brand-override-popover"
      role="dialog"
      aria-labelledby="brand-override-title"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        top: position === 'bottom' ? 'calc(100% + 8px)' : undefined,
        bottom: position === 'top' ? 'calc(100% + 8px)' : undefined,
        insetInlineStart: 0,
        zIndex: 40,
        width: 340,
        maxWidth: '90vw',
        padding: '12px 16px',
        borderRadius: 14,
        background: '#ffffff',
        color: '#0f172a',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
        border: '1px solid #e2e8f0',
        transform: `scale(${1 / zoom})`,
        transformOrigin: position === 'bottom' ? 'top left' : 'bottom left',
        pointerEvents: 'auto',
      }}
      className="dark:bg-slate-900 dark:text-white dark:border-slate-800"
    >
      <BrandOverrideControls onClose={onClose} />
    </div>
  );
};
