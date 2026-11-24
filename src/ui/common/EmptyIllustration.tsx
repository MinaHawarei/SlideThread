import React from 'react';

export interface EmptyIllustrationProps {
  className?: string;
  variant?: 'empty' | 'search' | 'error';
}

export const EmptyIllustration: React.FC<EmptyIllustrationProps> = ({
  className = 'w-32 h-32',
  variant = 'empty',
}) => {
  if (variant === 'search') {
    return (
      <svg className={`${className} text-stone-400 dark:text-stone-500`} viewBox="0 0 96 96" fill="none">
        <circle cx="44" cy="44" r="26" stroke="currentColor" strokeWidth="4" strokeDasharray="6 6" />
        <path d="M63 63L82 82" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        <circle cx="44" cy="44" r="14" fill="currentColor" fillOpacity="0.1" />
        <path d="M38 40h12M44 34v12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (variant === 'error') {
    return (
      <svg className={`${className} text-amber-600 dark:text-amber-500`} viewBox="0 0 96 96" fill="none">
        <path d="M48 14L84 76H12L48 14Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
        <path d="M48 38v18M48 66v2" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <circle cx="48" cy="48" r="36" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" opacity="0.3" />
      </svg>
    );
  }

  // Default empty state
  return (
    <svg className={`${className} text-stone-400 dark:text-stone-500`} viewBox="0 0 96 96" fill="none">
      <rect x="22" y="18" width="46" height="58" rx="8" stroke="currentColor" strokeWidth="3" transform="rotate(-6 22 18)" />
      <rect x="30" y="22" width="46" height="58" rx="8" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="3.5" />
      <path d="M42 42h22M42 52h16M42 62h10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="68" cy="34" r="4" fill="currentColor" />
    </svg>
  );
};
