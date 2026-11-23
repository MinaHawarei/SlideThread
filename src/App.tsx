import React, { Suspense, useEffect, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { undo, redo } from './store/history';
import { useT } from './i18n';

const StartScreen = React.lazy(() => import('./ui/start/StartScreen').then((m) => ({ default: m.StartScreen })));
const Wizard = React.lazy(() => import('./ui/wizard/Wizard').then((m) => ({ default: m.Wizard })));
const Editor = React.lazy(() => import('./ui/editor').then((m) => ({ default: m.Editor })));
const GalleryPage = React.lazy(() => import('./gallery/GalleryPage').then((m) => ({ default: m.GalleryPage })));
const KitPage = React.lazy(() => import('./ui/kit/KitPage').then((m) => ({ default: m.KitPage })));
const SettingsPage = React.lazy(() => import('./ui/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const SpikePage = React.lazy(() => import('./spike/SpikePage').then((m) => ({ default: m.SpikePage })));
const UxPreview = import.meta.env.DEV
  ? React.lazy(() => import('./ux-preview/UxPreview').then((m) => ({ default: m.UxPreview })))
  : null;

function LoadingScreen() {
  const { t } = useT();
  return <div className="route-loading" role="status">{t('app.loading')}</div>;
}

export const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(() => typeof window !== 'undefined' ? window.location.pathname : '/');
  const { locale, dir } = useT();

  const navigate = (path: string) => {
    if (window.location.pathname !== path) window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
    document.documentElement.classList.toggle('rtl', dir === 'rtl');
  }, [locale, dir]);

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const handleHistoryShortcut = (event: KeyboardEvent) => {
      if (event.isComposing || event.altKey || !(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'z') return;
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
    };
    window.addEventListener('keydown', handleHistoryShortcut);
    return () => window.removeEventListener('keydown', handleHistoryShortcut);
  }, []);

  let route: React.ReactNode;
  if (currentPath === '/gallery') route = <GalleryPage />;
  else if (currentPath === '/editor') route = <Editor onHome={() => navigate('/')} />;
  else if (currentPath === '/wizard') route = <Wizard onComplete={() => navigate('/editor')} onCancel={() => navigate('/')} />;
  else if (currentPath === '/settings') route = <SettingsPage />;
  else if (currentPath === '/kit') route = <KitPage />;
  else if (import.meta.env.DEV && currentPath === '/spike') route = <SpikePage />;
  else if (import.meta.env.DEV && currentPath === '/ux-preview' && UxPreview) route = <UxPreview />;
  else route = <StartScreen onStartWizard={() => navigate('/wizard')} onOpenProject={() => navigate('/editor')} onNavigate={navigate} />;

  return <><Suspense fallback={<LoadingScreen />}>{route}</Suspense><Analytics /></>;
};

export default App;
