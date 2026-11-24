import React, { useState, useEffect } from 'react';
import { useT } from '../../i18n';

export interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const { t } = useT();
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const steps = [
    {
      title: t('onboarding.step1Title'),
      desc: t('onboarding.step1Desc'),
      icon: (
        <svg className="w-16 h-16 text-amber-600 dark:text-amber-500" viewBox="0 0 64 64" fill="none">
          <rect x="8" y="12" width="48" height="40" rx="6" stroke="currentColor" strokeWidth="3" className="text-amber-600" />
          <path d="M16 24h32M16 32h20M16 40h24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.75" />
          <circle cx="48" cy="38" r="4" fill="currentColor" />
        </svg>
      ),
    },
    {
      title: t('onboarding.step2Title'),
      desc: t('onboarding.step2Desc'),
      icon: (
        <svg className="w-16 h-16 text-amber-600 dark:text-amber-500" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="22" stroke="currentColor" strokeWidth="3" strokeDasharray="4 4" />
          <path d="M22 32h20M32 22v20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <rect x="18" y="18" width="28" height="28" rx="4" stroke="currentColor" strokeWidth="2" opacity="0.6" />
        </svg>
      ),
    },
    {
      title: t('onboarding.step3Title'),
      desc: t('onboarding.step3Desc'),
      icon: (
        <svg className="w-16 h-16 text-amber-600 dark:text-amber-500" viewBox="0 0 64 64" fill="none">
          <rect x="12" y="16" width="40" height="32" rx="4" stroke="currentColor" strokeWidth="3" />
          <path d="M20 40l8-8 6 6 10-10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="42" cy="24" r="3" fill="currentColor" />
        </svg>
      ),
    },
    {
      title: t('onboarding.step4Title'),
      desc: t('onboarding.step4Desc'),
      icon: (
        <svg className="w-16 h-16 text-amber-600 dark:text-amber-500" viewBox="0 0 64 64" fill="none">
          <path d="M32 12v26M22 28l10 10 10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 44v4a4 4 0 004 4h32a4 4 0 004-4v-4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  const isLast = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      onComplete();
      onClose();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  return (
    <div
      data-testid="onboarding-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Welcome Onboarding"
        className="w-full max-w-md bg-stone-50 dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 flex flex-col items-center text-center space-y-5"
      >
        {/* Step Indicator dots */}
        <div className="flex items-center gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentStep
                  ? 'w-6 bg-amber-600 dark:bg-amber-500'
                  : 'w-2 bg-stone-300 dark:bg-stone-700'
              }`}
            />
          ))}
        </div>

        {/* Step Graphic Illustration */}
        <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/20">
          {steps[currentStep]!.icon}
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h2 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100">
            {steps[currentStep]!.title}
          </h2>
          <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed max-w-xs mx-auto">
            {steps[currentStep]!.desc}
          </p>
        </div>

        {/* Action Controls */}
        <div className="w-full pt-2 flex items-center justify-between gap-3">
          <button
            type="button"
            data-testid="onboarding-skip-btn"
            onClick={() => {
              onComplete();
              onClose();
            }}
            className="px-4 py-2.5 rounded-xl text-xs font-medium text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
          >
            {t('common.cancel')}
          </button>

          <button
            type="button"
            data-testid="onboarding-next-btn"
            onClick={handleNext}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-stone-950 shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>{isLast ? t('onboarding.getStarted') : t('onboarding.next')}</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
};
