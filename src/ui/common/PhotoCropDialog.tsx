import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useT } from '../../i18n';
import { useCropStore } from '../../store/cropStore';
import { calculateInteractiveCrop, renderCroppedSquare } from '../../core/media';
import { CloseIcon } from './icons';

export interface PhotoCropDialogProps {
  isOpen?: boolean;
  imageSrc?: string | null;
  onCrop?: (dataUrl: string) => void;
  onCancel?: () => void;
  targetSize?: number;
}

export const PhotoCropDialog: React.FC<PhotoCropDialogProps> = (props) => {
  const store = useCropStore();
  const { t } = useT();

  const isControlled = props.isOpen !== undefined;
  const isOpen = isControlled ? props.isOpen : store.isOpen;
  const imageSrc = isControlled ? props.imageSrc : store.imageSrc;
  const onCrop = isControlled ? props.onCrop : store.onCrop;
  const onCancel = isControlled ? props.onCancel : store.onCancel;
  const targetSize = props.targetSize || 400;

  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const isDragging = useRef<boolean>(false);
  const dragStart = useRef<{ x: number; y: number; panX: number; panY: number }>({
    x: 0,
    y: 0,
    panX: 0,
    panY: 0,
  });
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const containerSize = 280; // Size of the square crop window in px

  const handleClose = useCallback(() => {
    if (onCancel) onCancel();
    if (!isControlled) {
      store.closeCrop();
    }
  }, [onCancel, isControlled, store]);

  // Reset controls when a new image is loaded
  useEffect(() => {
    if (isOpen) {
      setZoom(1.0);
      setPan({ x: 0, y: 0 });
    }
  }, [isOpen, imageSrc]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalDimensions({
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
    });
  };

  const handleConfirm = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;

    try {
      const cropCoords = calculateInteractiveCrop({
        panX: pan.x,
        panY: pan.y,
        zoom,
        containerSize,
        naturalWidth: naturalDimensions.width || img.naturalWidth || img.width,
        naturalHeight: naturalDimensions.height || img.naturalHeight || img.height,
      });

      const croppedDataUrl = renderCroppedSquare(img, cropCoords, targetSize);
      if (onCrop) {
        onCrop(croppedDataUrl);
      }
      handleClose();
    } catch {
      // Fallback: if canvas fails, close without error
      handleClose();
    }
  }, [pan, zoom, naturalDimensions, targetSize, onCrop, handleClose]);

  // Pointer drag handling for pan
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = true;
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPan({
      x: dragStart.current.panX + dx,
      y: dragStart.current.panY + dy,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if not captured
    }
  };

  if (!isOpen || !imageSrc) {
    return null;
  }

  // Calculate transform for preview display
  const baseScale =
    naturalDimensions.width > 0 && naturalDimensions.height > 0
      ? Math.max(
          containerSize / naturalDimensions.width,
          containerSize / naturalDimensions.height
        )
      : 1;

  const totalScale = baseScale * zoom;
  const displayedWidth = naturalDimensions.width * totalScale;
  const displayedHeight = naturalDimensions.height * totalScale;

  // Max pan calculation to clamp visual preview
  const maxPanX = Math.max(0, (displayedWidth - containerSize) / 2);
  const maxPanY = Math.max(0, (displayedHeight - containerSize) / 2);
  const clampedX = Math.max(-maxPanX, Math.min(maxPanX, pan.x));
  const clampedY = Math.max(-maxPanY, Math.min(maxPanY, pan.y));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="photo-crop-title"
      data-testid="photo-crop-dialog"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs select-none"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 flex flex-col items-center gap-5">
        {/* Header */}
        <div className="w-full flex items-center justify-between">
          <div>
            <h2
              id="photo-crop-title"
              data-testid="photo-crop-title"
              className="text-lg font-bold text-slate-900 dark:text-white"
            >
              {t('brand.cropTitle')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('brand.cropSubtitle')}
            </p>
          </div>
          <button
            type="button"
            data-testid="photo-crop-close-btn"
            onClick={handleClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-lg"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        {/* Square Crop Viewport */}
        <div
          ref={containerRef}
          data-testid="photo-crop-viewport"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{
            width: `${containerSize}px`,
            height: `${containerSize}px`,
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '16px',
            touchAction: 'none',
            cursor: 'grab',
          }}
          className="border-2 border-cyan-500 shadow-inner bg-slate-950"
        >
          {/* Displayed Image */}
          <img
            ref={imgRef}
            src={imageSrc}
            alt="To crop"
            onLoad={handleImageLoad}
            draggable={false}
            data-testid="photo-crop-image"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% + ${clampedX}px), calc(-50% + ${clampedY}px)) scale(${totalScale})`,
              transformOrigin: 'center center',
              maxWidth: 'none',
              maxHeight: 'none',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />

          {/* Guide overlay showing circle and square boundaries */}
          <div
            data-testid="photo-crop-guide"
            className="absolute inset-0 pointer-events-none border border-white/40 rounded-full"
            style={{ margin: '4px' }}
          />
        </div>

        {/* Zoom Controls */}
        <div className="w-full space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span>{t('brand.cropZoom')}</span>
            <span className="font-mono">{zoom.toFixed(2)}×</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              data-testid="photo-crop-zoom-out"
              onClick={() => setZoom((z) => Math.max(1.0, Number((z - 0.1).toFixed(2))))}
              className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 text-sm"
              aria-label="Zoom out"
            >
              −
            </button>
            <input
              type="range"
              data-testid="photo-crop-zoom-slider"
              min={1.0}
              max={3.0}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-cyan-600 dark:accent-cyan-400 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
              aria-label={t('brand.cropZoom')}
            />
            <button
              type="button"
              data-testid="photo-crop-zoom-in"
              onClick={() => setZoom((z) => Math.min(3.0, Number((z + 0.1).toFixed(2))))}
              className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 text-sm"
              aria-label="Zoom in"
            >
              +
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            data-testid="photo-crop-reset-btn"
            onClick={() => {
              setZoom(1.0);
              setPan({ x: 0, y: 0 });
            }}
            className="py-2 px-3 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            {t('brand.resetCrop')}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="photo-crop-cancel-btn"
              onClick={handleClose}
              className="py-2 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {t('brand.cancelCrop')}
            </button>
            <button
              type="button"
              data-testid="photo-crop-confirm-btn"
              onClick={handleConfirm}
              className="py-2 px-5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md transition-all"
            >
              {t('brand.applyCrop')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const GlobalPhotoCropDialog: React.FC = () => {
  return <PhotoCropDialog />;
};
