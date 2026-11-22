import React from 'react';
import { APP_NAME, OWNER } from './config/site';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col justify-between p-6">
      <header className="border-b pb-4">
        <h1 className="text-2xl font-bold">{APP_NAME}</h1>
        <p className="text-sm text-slate-500">Free Carousel &amp; Post Maker for Content Creators</p>
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
