import React, { useState, useEffect } from 'react';
import { useT } from '../../i18n';
import { subscribeQuotaState, getStorageQuotaState, setQuotaState } from '../../core/storage';

export const StorageQuotaBanner: React.FC = () => {
  const { t } = useT();
  const [isExceeded, setIsExceeded] = useState(() => getStorageQuotaState().isExceeded);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeQuotaState((state) => {
      setIsExceeded(state.isExceeded);
      if (state.isExceeded) {
        setDismissed(false);
      }
    });
    return unsubscribe;
  }, []);

  if (!isExceeded || dismissed) {
    return null;
  }

  return (
    <div
      data-testid="storage-quota-banner"
      role="alert"
      className="w-full bg-amber-600 text-white text-xs px-4 py-2.5 flex items-center justify-between gap-3 shrink-0 shadow-sm z-50 animate-in slide-in-from-top duration-200"
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-base leading-none">⚠️</span>
        <span className="font-medium truncate sm:whitespace-normal">
          {t('app.storageQuotaWarning')}
        </span>
      </div>

      <button
        type="button"
        data-testid="storage-quota-dismiss"
        onClick={() => {
          setDismissed(true);
          setQuotaState(false, null);
        }}
        aria-label="Dismiss storage quota warning"
        className="min-h-[32px] px-2.5 rounded-lg bg-amber-700/60 hover:bg-amber-700 text-white font-bold transition-colors shrink-0"
      >
        ✕
      </button>
    </div>
  );
};
