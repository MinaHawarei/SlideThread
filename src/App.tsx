import React, { useState, useEffect } from 'react';
import { APP_NAME, OWNER } from './config/site';
import { SpikePage } from './spike/SpikePage';
import { GalleryPage } from './gallery/GalleryPage';

export const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

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

  return (
    <div className="min-h-screen flex flex-col justify-between p-6">
      <header className="border-b pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{APP_NAME}</h1>
          <p className="text-sm text-slate-500">Free Carousel &amp; Post Maker for Content Creators</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              window.history.pushState({}, '', '/gallery');
              setCurrentPath('/gallery');
            }}
            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-3 py-1.5 rounded"
          >
            Component Gallery (/gallery)
          </button>
          <button
            onClick={() => {
              window.history.pushState({}, '', '/spike');
              setCurrentPath('/spike');
            }}
            className="text-xs bg-sky-600 hover:bg-sky-500 text-white font-medium px-3 py-1.5 rounded"
          >
            Export Spike (/spike)
          </button>
        </div>
      </header>

      <main className="my-auto py-12 text-center">
        <h2 className="text-3xl font-extrabold mb-4">Welcome to {APP_NAME}</h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          Create beautiful carousels and posts for Instagram, LinkedIn, and Facebook in minutes.
        </p>
      </main>

      <footer className="border-t pt-4 text-xs text-slate-500 flex justify-between items-center">
        <span>Built by {OWNER.name} ({OWNER.handle})</span>
        <span>Your content stays in your browser. Cookieless analytics.</span>
      </footer>
    </div>
  );
};

export default App;
