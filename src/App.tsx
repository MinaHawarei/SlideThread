import React, { useState, useEffect } from 'react';
import { SpikePage } from './spike/SpikePage';
import { GalleryPage } from './gallery/GalleryPage';
import { StartScreen } from './ui/start/StartScreen';

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
      <div className="min-h-screen p-8 text-center flex flex-col items-center justify-center space-y-4">
        <h2 className="text-2xl font-bold">Wizard</h2>
        <p className="text-sm text-slate-500">Wizard will be implemented in P3-4.</p>
        <button
          onClick={() => setCurrentScreen('start')}
          className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700"
        >
          Back to Start
        </button>
      </div>
    );
  }

  if (currentScreen === 'editor') {
    return (
      <div className="min-h-screen p-8 text-center flex flex-col items-center justify-center space-y-4">
        <h2 className="text-2xl font-bold">Editor</h2>
        <p className="text-sm text-slate-500">Editor workspace will be implemented in P3-5.</p>
        <button
          onClick={() => setCurrentScreen('start')}
          className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700"
        >
          Back to Start
        </button>
      </div>
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
