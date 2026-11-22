import React, { useEffect } from 'react';
import { useT } from '../../i18n';

export interface SizeWarningModalProps {
  isOpen: boolean;
  sizeMB: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const SizeWarningModal: React.FC<SizeWarningModalProps> = ({
  isOpen,
  sizeMB,
  onConfirm,
  onCancel,
}) => {
  const { t } = useT();

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="size-warning-title"
      data-testid="size-warning-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl shrink-0">
            ⚠️
          </div>
          <div className="space-y-1">
            <h3
              id="size-warning-title"
              className="text-base font-bold text-slate-900 dark:text-white"
            >
              {t('io.largeWarningTitle')}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {t('io.largeWarningDesc', { size: sizeMB })}
            </p>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end gap-2.5">
          <button
            type="button"
            data-testid="size-warning-cancel"
            onClick={onCancel}
            className="min-h-[38px] px-4 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            data-testid="size-warning-confirm"
            onClick={onConfirm}
            className="min-h-[38px] px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-xs transition-colors"
          >
            {t('io.downloadAnyway')}
          </button>
        </div>
      </div>
    </div>
  );
};
