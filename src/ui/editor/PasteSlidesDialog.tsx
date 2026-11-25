import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useT } from '../../i18n';
import type { TranslationKey } from '../../i18n/en';
import { useProjectStore } from '../../store/projectStore';
import { parsePastedText, candidateToSlide, type ParsedCandidateSlide } from '../../core/paste';
import type { SlideType } from '../../core/schema';

export interface PasteSlidesDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVAILABLE_SLIDE_TYPES: SlideType[] = [
  'cover',
  'explain',
  'rule',
  'compare',
  'code',
  'stat',
  'quote',
  'cta',
];

export const PasteSlidesDialog: React.FC<PasteSlidesDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useT();
  const appendSlides = useProjectStore((state) => state.appendSlides);
  const replaceSlides = useProjectStore((state) => state.replaceSlides);

  const [rawText, setRawText] = useState('');
  const [mode, setMode] = useState<'append' | 'replace'>('append');
  const [candidates, setCandidates] = useState<ParsedCandidateSlide[]>([]);

  // Parse text whenever rawText changes
  useEffect(() => {
    if (!rawText.trim()) {
      setCandidates([]);
      return;
    }
    const parsed = parsePastedText(rawText);
    setCandidates(parsed);
  }, [rawText]);

  // Handle escape key
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

  // Allow user to manually override detected slide type
  const handleTypeChange = (index: number, nextType: SlideType) => {
    setCandidates((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = {
          ...updated[index]!,
          type: nextType,
        };
      }
      return updated;
    });
  };

  const handleApply = () => {
    if (candidates.length === 0) return;
    const finalSlides = candidates.map(candidateToSlide);

    if (mode === 'replace') {
      replaceSlides(finalSlides);
    } else {
      appendSlides(finalSlides);
    }

    // Reset and close
    setRawText('');
    setCandidates([]);
    onClose();
  };

  if (!isOpen) return null;

  const dialog = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="paste-dialog-title"
      data-testid="paste-slides-dialog"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2
              id="paste-dialog-title"
              className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"
            >
              <span>📋</span>
              <span>{t('paste.title')}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t('paste.desc')}
            </p>
          </div>
          <button
            type="button"
            data-testid="paste-dialog-close"
            onClick={onClose}
            aria-label={t('common.close')}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Text Area Input */}
          <div className="space-y-2">
            <textarea
              data-testid="paste-textarea"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={t('paste.placeholder')}
              rows={6}
              className="w-full p-3 text-sm font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors resize-y"
            />
          </div>

          {/* Mode Selection (Append vs Replace) */}
          <div className="flex items-center gap-6 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
              <input
                type="radio"
                name="paste-mode"
                value="append"
                checked={mode === 'append'}
                onChange={() => setMode('append')}
                className="text-cyan-600 focus:ring-cyan-500"
              />
              <span>{t('paste.append')}</span>
            </label>
            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
              <input
                type="radio"
                name="paste-mode"
                value="replace"
                checked={mode === 'replace'}
                onChange={() => setMode('replace')}
                className="text-cyan-600 focus:ring-cyan-500"
              />
              <span>{t('paste.replace')}</span>
            </label>
          </div>

          {/* Parsed Slides Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {t('paste.previewTitle', { count: candidates.length })}
              </h3>
              {candidates.length > 0 && (
                <span className="text-[11px] text-cyan-600 dark:text-cyan-400 font-medium">
                  {candidates.length} slides ready
                </span>
              )}
            </div>

            {candidates.length === 0 ? (
              <div
                data-testid="paste-empty-preview"
                className="p-8 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400"
              >
                Paste your outline or notes above to preview generated slides.
              </div>
            ) : (
              <div data-testid="paste-preview-list" className="space-y-2.5">
                {candidates.map((cand, idx) => (
                  <div
                    key={cand.id}
                    data-testid={`paste-candidate-${idx}`}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 flex items-start justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-700 dark:text-cyan-300">
                          #{idx + 1}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {cand.fields.title || cand.fields.value || cand.fields.text || 'Slide'}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                        {cand.fields.body || cand.fields.sub || cand.fields.code || cand.fields.label || cand.fields.text || ''}
                      </p>
                    </div>

                    {/* Slide Type Switcher */}
                    <div className="shrink-0">
                      <select
                        data-testid={`paste-type-select-${idx}`}
                        value={cand.type}
                        onChange={(e) => handleTypeChange(idx, e.target.value as SlideType)}
                        className="py-1 px-2.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
                      >
                        {AVAILABLE_SLIDE_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {t(`slideType.${type}` as TranslationKey) || type}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-slate-950/50">
          <button
            type="button"
            data-testid="paste-cancel-btn"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {t('paste.cancel')}
          </button>
          <button
            type="button"
            data-testid="paste-apply-btn"
            onClick={handleApply}
            disabled={candidates.length === 0}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-sm transition-all flex items-center gap-1.5"
          >
            <span>✓</span>
            <span>{t('paste.apply')} ({candidates.length})</span>
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(dialog, document.body) : dialog;
};
