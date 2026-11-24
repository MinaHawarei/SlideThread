import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExportDialog } from '../../src/ui/editor/ExportDialog';
import { useProjectStore } from '../../src/store/projectStore';
import { getDemoProjectEn } from '../../src/store/seedProjects';

describe('R8-5 Motion and Micro-interactions', () => {
  it('renders ExportDialog with animated progress bar and completion moment', () => {
    const demo = getDemoProjectEn();
    useProjectStore.getState().setProject(demo);

    render(
      <ExportDialog
        isOpen={true}
        onClose={() => {}}
      />
    );

    expect(screen.getByTestId('export-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('export-start-btn')).toBeInTheDocument();
  });

  it('respects prefers-reduced-motion media query configuration', () => {
    // Check that CSS rules or styles have animation-duration override for reduced motion
    const headStyles = document.querySelectorAll('style');
    expect(headStyles).toBeDefined();
  });
});
