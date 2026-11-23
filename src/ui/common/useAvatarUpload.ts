import React, { useRef } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import { useCropStore } from '../../store/cropStore';

export interface UseAvatarUploadOptions {
  onCrop?: (croppedDataUrl: string) => void;
}

/**
 * Hook providing file input ref and trigger functions to handle avatar image picking,
 * opening the PhotoCropDialog, and saving the cropped 400x400 px data URL.
 */
export function useAvatarUpload(options?: UseAvatarUploadOptions) {
  const setPhotoDataUrl = useSettingsStore((state) => state.setPhotoDataUrl);
  const openCrop = useCropStore((state) => state.openCrop);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        openCrop(reader.result, (cropped) => {
          if (options?.onCrop) {
            options.onCrop(cropped);
          } else {
            setPhotoDataUrl(cropped);
          }
        });
      }
    };
    reader.readAsDataURL(file);
    // Reset file input value so choosing the same file again triggers change event
    e.target.value = '';
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return {
    fileInputRef,
    handleFileChange,
    triggerUpload,
  };
}
