import React from 'react';
import { useT } from '../../i18n';
import { LogoMark } from './LogoMark';

export interface LoadingScreenProps {
  message?: string;
  className?: string;
}

const LOADING_LOGO_SIZE = 128;

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message,
  className = '',
}) => {
  const { t } = useT();
  const label = message || t('app.loading');

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="app-loading-screen"
      className={`min-h-screen w-full flex flex-col items-center justify-center p-6 bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-200 transition-colors duration-200 ${className}`}
    >
      <div className="flex flex-col items-center gap-6 text-center">
        <LogoMark size={LOADING_LOGO_SIZE} animated className="max-w-full h-auto" />
        <p className="font-serif text-sm font-medium tracking-wide text-stone-600 dark:text-stone-400 animate-pulse motion-reduce:animate-none">
          {label}
        </p>
      </div>
    </div>
  );
};
