import React, { useEffect } from 'react';
import { useT } from '../../i18n';

export interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxHeightClass?: string;
  halfHeight?: boolean;
}

export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxHeightClass,
  halfHeight = false,
}) => {
  const { t } = useT();

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      data-testid="mobile-bottom-sheet-backdrop"
      className="fixed inset-x-0 top-0 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] z-50 flex flex-col justify-end bg-stone-900/60 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      {/* Bottom Sheet Modal Panel */}
      <div
        data-testid="mobile-bottom-sheet"
        data-half-height={halfHeight ? 'true' : 'false'}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${
          halfHeight ? 'max-h-[50vh] min-h-[30vh]' : (maxHeightClass || 'max-h-[85vh] min-h-[40vh]')
        } bg-stone-50 dark:bg-stone-900 rounded-t-3xl shadow-2xl border-t border-stone-200/80 dark:border-stone-800 flex flex-col overflow-hidden pb-[env(safe-area-inset-bottom,0px)] animate-in slide-in-from-bottom duration-200`}
      >
        {/* Grab Handle */}
        <div className="py-2.5 flex justify-center shrink-0">
          <div className="w-12 h-1.5 bg-stone-300 dark:bg-stone-700 rounded-full" />
        </div>

        {/* Sheet Header */}
        <div className="px-5 pb-3 border-b border-stone-200/80 dark:border-stone-800 flex items-center justify-between shrink-0">
          <h2 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
            {title}
          </h2>

          <button
            type="button"
            data-testid="mobile-sheet-close-btn"
            onClick={onClose}
            aria-label={t('editor.closeInspector')}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
};
