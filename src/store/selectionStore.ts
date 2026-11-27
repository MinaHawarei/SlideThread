import { create } from 'zustand';

export type PenMode = 'off' | 'pencil' | 'pen';

export interface SelectionState {
  selectedElementId?: string;
  selectElement: (id?: string) => void;
  /** Active drawing tool: pencil is freehand, pen is the Bezier pen (anchors and handles). */
  penMode: PenMode;
  setPenMode: (mode: PenMode) => void;
  /** True while any drawing tool is active on the canvas. */
  penActive: boolean;
  /** Turns the freehand pencil on or off. */
  setPenActive: (active: boolean) => void;
}

/** Editor-only selection state; deliberately excluded from persisted project data. */
export const useSelectionStore = create<SelectionState>((set) => ({
  selectedElementId: undefined,
  selectElement: (selectedElementId) => set({ selectedElementId }),
  penMode: 'off',
  penActive: false,
  setPenMode: (penMode) => set(penMode === 'off' ? { penMode, penActive: false } : { penMode, penActive: true, selectedElementId: undefined }),
  setPenActive: (active) => set(active ? { penMode: 'pencil', penActive: true, selectedElementId: undefined } : { penMode: 'off', penActive: false }),
}));
