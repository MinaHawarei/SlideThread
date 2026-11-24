import React from 'react';
import { useT } from '../../i18n';
import type { TranslationKey } from '../../i18n/en';
import type { SlideType } from '../../core/schema';

export interface SlideTypeOption {
  type: SlideType;
  icon: string;
}

const ALL_SLIDE_TYPES: SlideTypeOption[] = [
  { type: 'cover', icon: '🎯' },
  { type: 'explain', icon: '📝' },
  { type: 'rule', icon: '⚡' },
  { type: 'code', icon: '💻' },
  { type: 'compare', icon: '⚖️' },
  { type: 'stat', icon: '📊' },
  { type: 'quote', icon: '💬' },
  { type: 'image', icon: '🖼️' },
  { type: 'cta', icon: '🚀' },
];

export interface SlideTypePickerProps {
  onSelectType: (type: SlideType) => void;
  onClose?: () => void;
  className?: string;
}

export const SlideTypePicker: React.FC<SlideTypePickerProps> = ({
  onSelectType,
  onClose,
  className = '',
}) => {
  const { t } = useT();

  return (
    <div
      data-testid="slide-type-picker"
      className={`p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl ${className}`}
      role="menu"
      aria-label="Choose Slide Type"
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t('editor.addSlide')}
        </span>
        {onClose && (
          <button
            type="button"
            data-testid="close-type-picker-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs p-1 rounded"
            aria-label="Close"
          >
            ✕
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 max-h-[360px] overflow-y-auto p-1">
        {ALL_SLIDE_TYPES.map(({ type, icon }) => {
          const titleKey = `slideType.${type}` as TranslationKey;
          const descKey = `slideType.${type}.desc` as TranslationKey;
          const title = t(titleKey);
          const desc = t(descKey);

          return (
            <button
              key={type}
              type="button"
              role="menuitem"
              data-testid={`type-option-${type}`}
              onClick={() => {
                onSelectType(type);
                onClose?.();
              }}
              className="flex flex-col items-center text-center p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/20 transition-all group focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:outline-none"
              title={desc}
            >
              <span className="text-2xl mb-1.5 transition-transform group-hover:scale-110">
                {icon}
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
                {title}
              </span>
              <span className="text-[10px] text-slate-400 line-clamp-2 mt-0.5 leading-tight">
                {desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
