import { create } from 'zustand';

export interface SelectionState {
  selectedElementId?: string;
  selectElement: (id?: string) => void;
  /** True while the freehand pen tool is active on the canvas. */
  penActive: boolean;
  setPenActive: (active: boolean) => void;
}

/** Editor-only selection state; deliberately excluded from persisted project data. */
export const useSelectionStore = create<SelectionState>((set) => ({
  selectedElementId: undefined,
  selectElement: (selectedElementId) => set({ selectedElementId }),
  penActive: false,
  setPenActive: (penActive) => set(penActive ? { penActive, selectedElementId: undefined } : { penActive }),
}));
