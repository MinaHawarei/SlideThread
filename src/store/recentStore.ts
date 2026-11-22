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
  projects: Record<string, Project>;
  saveProject: (project: Project) => void;
  getProject: (id: string) => Project | undefined;
  duplicateProject: (id: string) => Project | undefined;
  deleteProject: (id: string) => void;
  deleteRecent: (id: string) => void;
  addOrUpdateRecent: (project: Project) => void;
  clearRecents: () => void;
}

const MAX_RECENTS = 20;

export const useRecentStore = create<RecentState>()(
  persist(
    (set, get) => ({
      recents: [],
      projects: {},

      saveProject: (project: Project) => {
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

          const remainingRecents = (state.recents || []).filter((r) => r.id !== project.id);
          const updatedRecents = [item, ...remainingRecents].slice(0, MAX_RECENTS);
          const updatedProjects = {
            ...(state.projects || {}),
            [project.id]: {
              ...project,
              updatedAt: item.updatedAt,
            },
          };

          return {
            recents: updatedRecents,
            projects: updatedProjects,
          };
        });
      },

      getProject: (id: string) => {
        return (get().projects || {})[id];
      },

      duplicateProject: (id: string) => {
        const state = get();
        const original = (state.projects || {})[id];
        if (!original) {
          return undefined;
        }

        const duplicateId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const duplicate: Project = {
          ...original,
          id: duplicateId,
          title: `${original.title} (Copy)`,
          updatedAt: Date.now(),
          slides: original.slides.map((s, idx) => ({
            ...s,
            id: `slide_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
            fields: { ...s.fields },
            media: s.media ? { ...s.media } : undefined,
          })),
        };

        state.saveProject(duplicate);
        return duplicate;
      },

      deleteProject: (id: string) => {
        set((state) => {
          const nextProjects = { ...(state.projects || {}) };
          delete nextProjects[id];
          return {
            recents: (state.recents || []).filter((r) => r.id !== id),
            projects: nextProjects,
          };
        });
      },

      deleteRecent: (id: string) => {
        get().deleteProject(id);
      },

      addOrUpdateRecent: (project: Project) => {
        get().saveProject(project);
      },

      clearRecents: () => {
        set({ recents: [], projects: {} });
      },
    }),
    {
      name: 'slidethread:recent-projects',
    }
  )
);
