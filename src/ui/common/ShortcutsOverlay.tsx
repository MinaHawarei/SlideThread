import React, { useEffect } from 'react';
import { useT } from '../../i18n';

export interface ShortcutsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsOverlay: React.FC<ShortcutsOverlayProps> = ({ isOpen, onClose }) => {
  const { t } = useT();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcutGroups = [
    {
      category: t('shortcuts.history'),
      items: [
        { label: t('editor.undo'), keys: ['Ctrl', 'Z'] },
        { label: t('editor.redo'), keys: ['Ctrl', 'Shift', 'Z'] },
      ],
    },
    {
      category: t('shortcuts.canvas'),
      items: [
        { label: t('shortcuts.zoomIn'), keys: ['Ctrl', '+'] },
        { label: t('shortcuts.zoomOut'), keys: ['Ctrl', '−'] },
        { label: t('shortcuts.fitScreen'), keys: ['Shift', '1'] },
        { label: t('shortcuts.pan'), keys: ['Space', 'Drag'] },
      ],
    },
    {
      category: t('shortcuts.elements'),
      items: [
        { label: t('shortcuts.nudge'), keys: ['Arrows'] },
        { label: t('shortcuts.bigNudge'), keys: ['Shift', 'Arrows'] },
        { label: t('editor.duplicateElement'), keys: ['Ctrl', 'D'] },
        { label: t('editor.deleteElement'), keys: ['Del'] },
      ],
    },
  ];

  return (
    <div
      data-testid="shortcuts-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard Shortcuts"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-stone-50 dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 flex flex-col space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">⌨️</span>
            <h2 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
              {t('shortcuts.title')}
            </h2>
          </div>
          <button
            type="button"
            data-testid="shortcuts-close-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {shortcutGroups.map((group, idx) => (
            <div key={idx} className="space-y-2">
              <h3 className="text-xs font-semibold text-amber-600 dark:text-amber-500 uppercase tracking-wider font-mono">
                {group.category}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {group.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-xl bg-stone-100 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60 text-xs"
                  >
                    <span className="text-stone-700 dark:text-stone-300 font-medium">
                      {item.label}
                    </span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className="px-1.5 py-0.5 rounded bg-stone-200 dark:bg-stone-700 text-[10px] font-mono font-semibold text-stone-800 dark:text-stone-200 shadow-2xs"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
