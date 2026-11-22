import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project, PlatformId, ContentType } from '../core/schema';

export interface RecentProjectItem {
  id: string;
  title: string;
  platform: PlatformId;
  contentType: ContentType;
  formatId: string;
  slideCount: number;
  templateId: string;
  updatedAt: number;
}

export interface RecentState {
  recents: RecentProjectItem[];
  addOrUpdateRecent: (project: Project) => void;
  deleteRecent: (id: string) => void;
  clearRecents: () => void;
}

const MAX_RECENTS = 20;

export const useRecentStore = create<RecentState>()(
  persist(
    (set) => ({
      recents: [],

      addOrUpdateRecent: (project: Project) => {
        set((state) => {
          const item: RecentProjectItem = {
            id: project.id,
            title: project.title,
            platform: project.platform,
            contentType: project.contentType,
            formatId: project.formatId,
            slideCount: project.slides.length,
            templateId: project.templateId,
            updatedAt: project.updatedAt || Date.now(),
          };

          const remaining = state.recents.filter((r) => r.id !== project.id);
          const updated = [item, ...remaining].slice(0, MAX_RECENTS);

          return { recents: updated };
        });
      },

      deleteRecent: (id: string) => {
        set((state) => ({
          recents: state.recents.filter((r) => r.id !== id),
        }));
      },

      clearRecents: () => {
        set({ recents: [] });
      },
    }),
    {
      name: 'slidethread:recent-projects',
    }
  )
);
