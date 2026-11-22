import React, { useState, useEffect } from 'react';
import { EditorDesktop } from './EditorDesktop';
import { EditorMobile } from './EditorMobile';
import { ExportDialog } from './ExportDialog';

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

  const [isExportOpen, setIsExportOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleOpenExport = () => {
    if (props.onOpenExport) {
      props.onOpenExport();
    } else {
      setIsExportOpen(true);
    }
  };

  const sharedProps = {
    ...props,
    onOpenExport: handleOpenExport,
  };

  return (
    <>
      {isMobile ? <EditorMobile {...sharedProps} /> : <EditorDesktop {...sharedProps} />}
      <ExportDialog
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
    </>
  );
};
