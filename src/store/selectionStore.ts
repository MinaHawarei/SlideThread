import { create } from 'zustand';

export interface SelectionState {
  selectedElementId?: string;
  selectElement: (id?: string) => void;
}

/** Editor-only selection state; deliberately excluded from persisted project data. */
export const useSelectionStore = create<SelectionState>((set) => ({
  selectedElementId: undefined,
  selectElement: (selectedElementId) => set({ selectedElementId }),
}));
