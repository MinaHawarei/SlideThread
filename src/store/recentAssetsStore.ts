import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const RECENT_ASSETS_KEY = 'app:recent_assets:v1';
const MAX_RECENTS = 16;

export interface RecentAsset {
  packId: 'shapes' | 'icons' | 'emoji' | 'stickers';
  assetId: string;
  timestamp: number;
}

interface RecentAssetsState {
  recents: RecentAsset[];
  addRecent: (packId: 'shapes' | 'icons' | 'emoji' | 'stickers', assetId: string) => void;
  clearRecents: () => void;
}

export const useRecentAssetsStore = create<RecentAssetsState>()(
  persist(
    (set) => ({
      recents: [],
      addRecent: (packId, assetId) =>
        set((state) => {
          const filtered = state.recents.filter(
            (r) => !(r.packId === packId && r.assetId === assetId)
          );
          return {
            recents: [{ packId, assetId, timestamp: Date.now() }, ...filtered].slice(0, MAX_RECENTS),
          };
        }),
      clearRecents: () => set({ recents: [] }),
    }),
    {
      name: RECENT_ASSETS_KEY,
    }
  )
);
