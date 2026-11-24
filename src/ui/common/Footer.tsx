import React from 'react';
import { useT } from '../../i18n';
import { OWNER, GITHUB_URL, FEEDBACK_URL, APP_VERSION, APP_NAME } from '../../config/site';
import { LogoMark } from '../brand/LogoMark';

export interface FooterProps {
  className?: string;
  compact?: boolean;
}

export const Footer: React.FC<FooterProps> = ({
  className = '',
  compact = false,
}) => {
  const { t } = useT();

  const feedbackHref =
    FEEDBACK_URL && FEEDBACK_URL.trim().length > 0
      ? FEEDBACK_URL
      : 'mailto:mina.hawarei@gmail.com?subject=SlideThread%20Feedback';

  const isExternalFeedback = FEEDBACK_URL && FEEDBACK_URL.trim().length > 0;

  if (compact) {
    return (
      <footer
        data-testid="app-footer"
        className={`w-full py-2.5 px-4 text-[11px] text-stone-500 dark:text-stone-400 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200/80 dark:border-stone-800/80 bg-stone-50/80 dark:bg-stone-900/80 backdrop-blur-sm ${className}`}
      >
        {/* Left: Brand mark & Creator */}
        <div className="flex items-center gap-2">
          <LogoMark size={16} />
          <span className="font-serif font-bold text-stone-700 dark:text-stone-300">{APP_NAME}</span>
          <span className="text-stone-400">•</span>
          <span>{t('footer.createdBy')}</span>
          <a
            data-testid="footer-owner-link"
            href={OWNER.socials.github || GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-stone-700 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            {OWNER.name}
          </a>
        </div>

        {/* Center: Version */}
        <div className="flex items-center justify-center">
          <span data-testid="footer-version" className="text-stone-400 dark:text-stone-500 font-mono text-[10px] bg-stone-200/50 dark:bg-stone-800/50 px-2 py-0.5 rounded-md">
            v{APP_VERSION}
          </span>
        </div>

        {/* Right: Privacy and Links */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline">{t('app.privacy')}</span>
          <a
            data-testid="footer-star-btn"
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1 transition-colors"
          >
            ★ {t('app.starGithub')}
          </a>
          <a
            data-testid="footer-feedback-btn"
            href={feedbackHref}
            target={isExternalFeedback ? '_blank' : undefined}
            rel={isExternalFeedback ? 'noopener noreferrer' : undefined}
            className="text-amber-600 dark:text-amber-400 hover:underline"
          >
            {t('app.feedback')}
          </a>
        </div>
      </footer>
    );
  }

  return (
    <footer
      data-testid="app-footer"
      className={`w-full border-t border-stone-200/80 dark:border-stone-800 bg-stone-50/90 dark:bg-stone-900/90 backdrop-blur-sm py-8 px-4 sm:px-8 text-xs text-stone-500 dark:text-stone-400 ${className}`}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left Side: Brand mark with name & Creator credit */}
        <div className="flex flex-col sm:flex-row items-center md:items-start gap-3 text-center md:text-left">
          <div className="flex items-center gap-2">
            <LogoMark size={22} />
            <span className="font-serif font-bold text-sm tracking-tight text-stone-900 dark:text-stone-100">
              {APP_NAME}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <span className="hidden sm:inline text-stone-300 dark:text-stone-700">•</span>
            <span>{t('footer.createdBy')}</span>
            <a
              data-testid="footer-owner-link"
              href={OWNER.socials.linkedin || OWNER.socials.github}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] inline-flex items-center font-serif font-bold text-stone-800 dark:text-stone-200 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
            >
              {OWNER.name}
            </a>

            {/* Social Links */}
            <div className="flex items-center gap-0.5">
              {OWNER.socials.github && (
                <a
                  data-testid="footer-social-github"
                  href={OWNER.socials.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
                  title="GitHub"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                </a>
              )}

              {OWNER.socials.linkedin && (
                <a
                  data-testid="footer-social-linkedin"
                  href={OWNER.socials.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl hover:text-amber-600 dark:hover:text-amber-400 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
                  title="LinkedIn"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
              )}

              {OWNER.socials.instagram && (
                <a
                  data-testid="footer-social-instagram"
                  href={OWNER.socials.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl hover:text-rose-500 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
                  title="Instagram"
                >
                  <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Center: Version in the middle + Privacy Note */}
        <div className="flex flex-col items-center justify-center gap-1.5 text-center">
          <span
            data-testid="footer-version"
            className="font-mono text-[11px] font-semibold text-stone-600 dark:text-stone-300 bg-stone-200/70 dark:bg-stone-800/70 px-3 py-1 rounded-full border border-stone-300/40 dark:border-stone-700/40 shadow-2xs"
          >
            v{APP_VERSION}
          </span>
          <div data-testid="footer-privacy-note" className="text-center text-[11px] text-stone-500 dark:text-stone-400 max-w-sm">
            <span>{t('app.privacy')}</span>
          </div>
        </div>

        {/* Right Side: Star on GitHub & Feedback Button */}
        <div className="flex items-center gap-3">
          <a
            data-testid="footer-star-btn"
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] py-2 px-3.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <span className="text-amber-500">★</span>
            <span>{t('app.starGithub')}</span>
          </a>

          <a
            data-testid="footer-feedback-btn"
            href={feedbackHref}
            target={isExternalFeedback ? '_blank' : undefined}
            rel={isExternalFeedback ? 'noopener noreferrer' : undefined}
            className="min-h-[44px] py-2 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <span>💬</span>
            <span>{t('app.feedback')}</span>
          </a>
        </div>
      </div>
    </footer>
  );
};
