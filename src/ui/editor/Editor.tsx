import React, { useState, useEffect } from 'react';
import { EditorDesktop } from './EditorDesktop';
import { EditorMobile } from './EditorMobile';

export interface EditorProps {
  onHome?: () => void;
  onOpenExport?: () => void;
}

export const Editor: React.FC<EditorProps> = (props) => {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isMobile) {
    return <EditorMobile {...props} />;
  }

  return <EditorDesktop {...props} />;
};
