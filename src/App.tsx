import React, { useState, useEffect, Suspense } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpikePage } from './spike/SpikePage';
import { GalleryPage } from './gallery/GalleryPage';
import { StartScreen } from './ui/start/StartScreen';
import { Wizard } from './ui/wizard/Wizard';
import { Editor } from './ui/editor';
import { undo, redo } from './store/history';
import { KitPage } from './ui/kit/KitPage';

const UxPreview = import.meta.env.DEV
  ? React.lazy(() =>
      import('./ux-preview/UxPreview').then((module) => ({ default: module.UxPreview }))
    )
  : null;

export type AppScreen = 'start' | 'wizard' | 'editor';

export const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('start');

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const handleHistoryShortcut = (event: KeyboardEvent) => {
      if (
        event.isComposing ||
        event.altKey ||
        !(event.metaKey || event.ctrlKey) ||
        event.key.toLowerCase() !== 'z'
      ) {
        return;
      }
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
    };
    window.addEventListener('keydown', handleHistoryShortcut);
    return () => window.removeEventListener('keydown', handleHistoryShortcut);
  }, []);

  const renderScreen = () => {
    if (currentPath === '/spike') {
      return <SpikePage />;
    }

    if (import.meta.env.DEV && currentPath === '/ux-preview' && UxPreview) {
      return (
        <Suspense fallback={null}>
          <UxPreview />
        </Suspense>
      );
    }

    if (currentPath === '/gallery') {
      return <GalleryPage />;
    }

    if (currentPath === '/kit') {
      return <KitPage />;
    }

    if (currentScreen === 'wizard') {
      return (
        <Wizard
          onComplete={() => setCurrentScreen('editor')}
          onCancel={() => setCurrentScreen('start')}
        />
      );
    }

    if (currentScreen === 'editor') {
      return <Editor onHome={() => setCurrentScreen('start')} />;
    }

    return (
      <StartScreen
        onStartWizard={() => setCurrentScreen('wizard')}
        onOpenProject={() => setCurrentScreen('editor')}
        onNavigate={(path) => {
          window.history.pushState({}, '', path);
          setCurrentPath(path);
        }}
      />
    );
  };

  return (
    <>
      {renderScreen()}
      <Analytics />
    </>
  );
};

export default App;
