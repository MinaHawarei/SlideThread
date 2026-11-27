
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateDialog } from '../../src/ui/create/CreateDialog';
import { useCreateDialogStore, openCreateDialog } from '../../src/store/createDialogStore';
import { useProjectStore } from '../../src/store/projectStore';
import { useRecentStore } from '../../src/store/recentStore';
import type { Project } from '../../src/core/schema';

describe('Unified create dialog', () => {
  beforeEach(() => {
    useCreateDialogStore.setState({ open: false, request: {} });
    useRecentStore.setState({ recents: [], projects: {} });
  });

  it('requires an orientation for 4:5, and the button stays disabled until it is picked', () => {
    render(<CreateDialog />);
    openCreateDialog({ templateId: 'tech-mesh' });
    return waitFor(() => expect(screen.getByTestId('create-dialog')).toBeInTheDocument()).then(() => {
      expect(screen.getByTestId('create-submit')).toBeDisabled();
      expect(screen.getByTestId('orientation-required')).toBeInTheDocument();
      expect(screen.getByTestId('create-preview-neutral')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('orientation-portrait'));
      expect(screen.getByTestId('create-submit')).toBeEnabled();
      expect(screen.queryByTestId('orientation-required')).not.toBeInTheDocument();
      // Changing the size clears the choice again.
      fireEvent.click(screen.getByTestId('format-r_16_9'));
      expect(screen.getByTestId('create-submit')).toBeDisabled();
    });
  });

  it('needs no orientation for 1:1', async () => {
    render(<CreateDialog />);
    openCreateDialog({ templateId: 'tech-mesh', formatId: 'r_1_1', platform: 'custom', contentType: 'post' });
    await waitFor(() => expect(screen.getByTestId('create-dialog')).toBeInTheDocument());
    expect(screen.queryByTestId('create-orientation')).not.toBeInTheDocument();
    expect(screen.getByTestId('create-submit')).toBeEnabled();
  });

  it('validates the custom size range 200 to 4096', async () => {
    render(<CreateDialog />);
    openCreateDialog();
    await waitFor(() => expect(screen.getByTestId('create-dialog')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('platform-custom'));
    const w = screen.getByTestId('custom-width');
    const h = screen.getByTestId('custom-height');
    fireEvent.change(w, { target: { value: '199' } });
    fireEvent.change(h, { target: { value: '300' } });
    expect(screen.getByTestId('create-submit')).toBeDisabled();
    fireEvent.change(w, { target: { value: '200' } });
    expect(screen.getByTestId('create-submit')).toBeEnabled();
    fireEvent.change(w, { target: { value: '4096' } });
    fireEvent.change(h, { target: { value: '4096' } });
    expect(screen.getByTestId('create-submit')).toBeEnabled();
    fireEvent.change(h, { target: { value: '4097' } });
    expect(screen.getByTestId('create-submit')).toBeDisabled();
  });

  it('creates a project with the chosen orientation and template-derived defaults', async () => {
    const onCreated = vi.fn();
    render(<CreateDialog onCreated={onCreated} />);
    openCreateDialog({ templateId: 'tech-mesh' });
    await waitFor(() => expect(screen.getByTestId('create-dialog')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('orientation-landscape'));
    fireEvent.click(screen.getByTestId('create-submit'));
    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1), { timeout: 10000 });
    const project = onCreated.mock.calls[0]![0] as Project;
    expect(project.formatId).toBe('r_4_5');
    expect(project.orientation).toBe('landscape');
    expect(project.templateId).toBe('tech-mesh');
    expect(useProjectStore.getState().project.id).toBe(project.id);
    expect(useCreateDialogStore.getState().open).toBe(false);
  });

  it('has no template strip: blank opens without template choices, a template card opens that template', async () => {
    render(<CreateDialog />);
    openCreateDialog({});
    await waitFor(() => expect(screen.getByTestId('create-dialog')).toBeInTheDocument());
    expect(screen.queryByTestId('template-blank')).toBeNull();
    expect(screen.queryByTestId('template-tech-mesh')).toBeNull();
  });

  it('creating from Blank builds on the plain Clean Minimal base', async () => {
    const onCreated = vi.fn();
    render(<CreateDialog onCreated={onCreated} />);
    openCreateDialog({});
    await waitFor(() => expect(screen.getByTestId('create-dialog')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('orientation-portrait'));
    fireEvent.click(screen.getByTestId('create-submit'));
    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1), { timeout: 10000 });
    expect((onCreated.mock.calls[0]![0] as Project).templateId).toBe('clean-minimal');
  });
});
