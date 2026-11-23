import { create } from 'zustand';

export interface CropDialogState {
  isOpen: boolean;
  imageSrc: string | null;
  onCrop: ((croppedDataUrl: string) => void) | null;
  onCancel: (() => void) | null;
  openCrop: (
    imageSrc: string,
    onCrop: (croppedDataUrl: string) => void,
    onCancel?: () => void
  ) => void;
  closeCrop: () => void;
}

export const useCropStore = create<CropDialogState>((set) => ({
  isOpen: false,
  imageSrc: null,
  onCrop: null,
  onCancel: null,
  openCrop: (imageSrc, onCrop, onCancel) =>
    set({
      isOpen: true,
      imageSrc,
      onCrop,
      onCancel: onCancel ?? null,
    }),
  closeCrop: () =>
    set({
      isOpen: false,
      imageSrc: null,
      onCrop: null,
      onCancel: null,
    }),
}));
