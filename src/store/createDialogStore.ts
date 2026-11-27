import { create } from 'zustand';
import type { PlatformId, ContentType } from '../core/schema';

export interface CreateDialogRequest {
  /** Set to use a template; unset opens the dialog in blank mode (Tech Mesh by default, with a template strip). */
  templateId?: string;
  platform?: PlatformId;
  contentType?: ContentType;
  formatId?: string;
}

interface CreateDialogState {
  open: boolean;
  request: CreateDialogRequest;
  openDialog: (request?: CreateDialogRequest) => void;
  closeDialog: () => void;
}

/** One shared dialog for Home, Gallery and the template preview: the same sizes, orientation and custom size everywhere. */
export const useCreateDialogStore = create<CreateDialogState>((set) => ({
  open: false,
  request: {},
  openDialog: (request = {}) => set({ open: true, request }),
  closeDialog: () => set({ open: false }),
}));

export function openCreateDialog(request: CreateDialogRequest = {}): void {
  useCreateDialogStore.getState().openDialog(request);
}
