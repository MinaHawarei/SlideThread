import React, { useState, useEffect } from 'react';
import { EditorDesktop } from './EditorDesktop';
import { EditorMobile } from './EditorMobile';
import { ExportDialog } from './ExportDialog';
import type { ExportFormat } from '../../export/pipeline';

export interface EditorProps {
  onHome?: () => void;
  onOpenExport?: (initialFormat?: ExportFormat) => void;
}

export const Editor: React.FC<EditorProps> = (props) => {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportInitialFormat, setExportInitialFormat] = useState<ExportFormat | undefined>(undefined);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleOpenExport = (initialFormat?: ExportFormat) => {
    if (props.onOpenExport) {
      props.onOpenExport(initialFormat);
    } else {
      setExportInitialFormat(initialFormat);
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
        initialFormat={exportInitialFormat}
      />
    </>
  );
};
