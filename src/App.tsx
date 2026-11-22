import React, { useState, useEffect } from 'react';
import { SpikePage } from './spike/SpikePage';
import { GalleryPage } from './gallery/GalleryPage';
import { StartScreen } from './ui/start/StartScreen';
import { Wizard } from './ui/wizard/Wizard';
import { Editor } from './ui/editor';

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

  if (currentPath === '/spike') {
    return <SpikePage />;
  }

  if (currentPath === '/gallery') {
    return <GalleryPage />;
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
    return (
      <Editor
        onHome={() => setCurrentScreen('start')}
      />
    );
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

export default App;
