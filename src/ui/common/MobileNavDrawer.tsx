import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useT } from '../../i18n';
import { APP_NAME } from '../../config/site';
import { LogoMark } from '../brand/LogoMark';

export interface MobileNavDrawerProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  className?: string;
}

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({
  currentPath = typeof window !== 'undefined' ? window.location.pathname : '/',
  onNavigate,
  className = '',
}) => {
  const { t, dir } = useT();
  const [isOpen, setIsOpen] = useState(false);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    // Restore focus to toggle button
    setTimeout(() => {
      toggleBtnRef.current?.focus();
    }, 50);
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleLinkClick = (path: string) => {
    handleClose();
    if (onNavigate) {
      onNavigate(path);
    } else if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  // Auto-close drawer if viewport width expands to desktop breakpoint (>= 768px)
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => {
      if (typeof window !== 'undefined' && window.innerWidth >= 768) {
        handleClose();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, handleClose]);

  // Escape key listener & Scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      } else if (e.key === 'Tab' && drawerRef.current) {
        // Focus trap
        const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Initial focus on close button
    const closeBtn = drawerRef.current?.querySelector<HTMLElement>('[data-testid="mobile-nav-close"]');
    closeBtn?.focus();

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClose]);

  return (
    <div className={`md:hidden flex items-center ${className}`}>
      {/* Hamburger button (3 lines icon) */}
      <button
        ref={toggleBtnRef}
        type="button"
        data-testid="mobile-nav-toggle"
        aria-label={t('nav.openMenu')}
        aria-expanded={isOpen}
        aria-controls="mobile-nav-drawer"
        onClick={handleOpen}
        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 transition-colors"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
      </button>

      {/* Side Drawer & Overlay portaled to document.body */}
      {isOpen && typeof document !== 'undefined' &&
        createPortal(
          <div
            data-testid="mobile-nav-overlay"
            className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs transition-opacity"
            onClick={handleClose}
          >
            <div
              ref={drawerRef}
              id="mobile-nav-drawer"
              data-testid="mobile-nav-drawer"
              role="dialog"
              aria-modal="true"
              aria-label={t('nav.primary')}
              dir={dir}
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '85vw' }}
              className={`fixed top-0 bottom-0 inset-y-0 z-50 w-72 h-screen h-[100dvh] max-h-screen max-h-[100dvh] bg-white dark:bg-stone-900 shadow-2xl flex flex-col justify-between overflow-y-auto p-5 transition-transform duration-300 motion-reduce:transition-none ${
                dir === 'rtl' ? 'right-0 border-l border-stone-200 dark:border-stone-800' : 'left-0 border-r border-stone-200 dark:border-stone-800'
              }`}
            >
              {/* Drawer Header */}
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800">
                  <div className="flex items-center gap-2.5">
                    <LogoMark size={28} />
                    <span className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                      {APP_NAME}
                    </span>
                  </div>

                  <button
                    type="button"
                    data-testid="mobile-nav-close"
                    aria-label={t('nav.closeMenu')}
                    onClick={handleClose}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                {/* Navigation Links */}
                <nav className="py-6 space-y-2" aria-label={t('nav.primary')}>
                  <button
                    type="button"
                    data-testid="mobile-drawer-home"
                    onClick={() => handleLinkClick('/')}
                    aria-current={currentPath === '/' ? 'page' : undefined}
                    className={`w-full min-h-[44px] px-3.5 rounded-xl text-sm font-semibold text-start flex items-center gap-3 transition-colors ${
                      currentPath === '/'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                    }`}
                  >
                    <span className="text-base" aria-hidden="true">🏠</span>
                    <span>{t('nav.home')}</span>
                  </button>

                  <button
                    type="button"
                    data-testid="mobile-drawer-gallery"
                    onClick={() => handleLinkClick('/gallery')}
                    aria-current={currentPath === '/gallery' ? 'page' : undefined}
                    className={`w-full min-h-[44px] px-3.5 rounded-xl text-sm font-semibold text-start flex items-center gap-3 transition-colors ${
                      currentPath === '/gallery'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                    }`}
                  >
                    <span className="text-base" aria-hidden="true">🎨</span>
                    <span>{t('nav.gallery')}</span>
                  </button>

                  <button
                    type="button"
                    data-testid="mobile-drawer-settings"
                    onClick={() => handleLinkClick('/settings')}
                    aria-current={currentPath === '/settings' ? 'page' : undefined}
                    className={`w-full min-h-[44px] px-3.5 rounded-xl text-sm font-semibold text-start flex items-center gap-3 transition-colors ${
                      currentPath === '/settings'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                    }`}
                  >
                    <span className="text-base" aria-hidden="true">⚙️</span>
                    <span>{t('nav.settings')}</span>
                  </button>
                </nav>
              </div>
            </div>
          </div>,
          document.body
        )
      }
    </div>
  );
};
