import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Project, PlatformId, ContentType } from '../core/schema';
import { STORAGE_KEYS, createSafeStorage } from '../core/storage';
import { migrate } from '../core/migrate';

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
      name: STORAGE_KEYS.PROJECTS,
      version: 2,
      migrate: (persistedState: unknown) => {
        if (typeof persistedState !== 'object' || persistedState === null) return { recents: [], projects: {} };
        const state = persistedState as { recents?: unknown; projects?: unknown };
        const projects: Record<string, Project> = {};
        if (typeof state.projects === 'object' && state.projects !== null && !Array.isArray(state.projects)) {
          for (const [id, value] of Object.entries(state.projects)) {
            try {
              projects[id] = migrate(value);
            } catch {
              // Discard only projects that cannot be migrated or validated.
            }
          }
        }
        const recents = Array.isArray(state.recents)
          ? state.recents.filter((item): item is RecentProjectItem =>
              typeof item === 'object' && item !== null && typeof (item as RecentProjectItem).id === 'string' &&
              Object.hasOwn(projects, (item as RecentProjectItem).id)
            )
          : [];
        return { recents, projects };
      },
      storage: createJSONStorage(() => createSafeStorage()),
    }
  )
);
