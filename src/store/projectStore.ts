import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import type { Project, Slide, SlideType, MediaRef, TemplateId, AspectClass, ElementOverride, ExtraElement } from '../core/schema';
import {
  CURRENT_SCHEMA_VERSION,
  DEFAULT_COUNTER_CONFIG,
  DEFAULT_SIGNATURE_CONFIG,
  plainTextFieldsToRichText,
  richTextFieldsToPlainText,
} from '../core/schema';
import { STORAGE_KEYS, createSafeStorage } from '../core/storage';
import { useRecentStore } from './recentStore';
import { migrate } from '../core/migrate';
import { recordHistoryChange, registerHistoryChannel } from './history';

export function createDefaultSlide(type: SlideType = 'cover', index = 0): Slide {
  const id = `slide_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  switch (type) {
    case 'cover':
      return {
        id,
        type: 'cover',
        fields: plainTextFieldsToRichText({
          tag: 'ARCHITECTURE',
          title: 'My Carousel Title',
          sub: 'A clear and compelling subtitle that hooks your readers.',
          rule: 'npx create-slidethread@latest',
        }),
      };
    case 'explain':
      return {
        id,
        type: 'explain',
        fields: plainTextFieldsToRichText({
          title: `Key Concept ${index + 1}`,
          body: '- Point 1: First essential concept\n- Point 2: Second actionable takeaway\n- Point 3: Final takeaway to remember',
        }),
      };
    case 'rule':
      return {
        id,
        type: 'rule',
        fields: plainTextFieldsToRichText({
          title: 'Core Rule',
          cond: 'You encounter this design challenge',
          res: 'Apply this concrete proven pattern',
          note: 'Guarantees reliable behavior every time',
          condLabel: 'IF',
          resLabel: 'THEN',
        }),
      };
    case 'compare':
      return {
        id,
        type: 'compare',
        fields: plainTextFieldsToRichText({
          title: 'Do This, Not That',
          l1: "Don't",
          t1: 'Mix state and presentation in one giant unmaintainable file',
          l2: 'Do',
          t2: 'Separate concerns into pure rendering components and stores',
        }),
      };
    case 'code':
      return {
        id,
        type: 'code',
        fields: plainTextFieldsToRichText({
          title: 'Implementation Snippet',
          code: 'const studio = createStudio({\n  name: "SlideThread",\n  offline: true,\n});',
          note: 'Runs completely in your browser without servers',
        }),
      };
    case 'stat':
      return {
        id,
        type: 'stat',
        fields: plainTextFieldsToRichText({
          value: '100%',
          label: 'Client-Side Execution',
          note: 'Zero telemetry, zero database dependencies',
        }),
      };
    case 'quote':
      return {
        id,
        type: 'quote',
        fields: plainTextFieldsToRichText({
          text: 'Simple things should be simple, complex things should be possible.',
          author: 'Alan Kay',
        }),
      };
    case 'image':
      return {
        id,
        type: 'image',
        fields: plainTextFieldsToRichText({
          caption: 'Visual overview of system architecture',
        }),
      };
    case 'cta':
      return {
        id,
        type: 'cta',
        fields: plainTextFieldsToRichText({
          title: 'Liked this carousel?',
          body: 'Follow for weekly deep-dives into modern web architecture and client-side engineering.',
          action: 'Follow & Share',
        }),
      };
  }
}

export function createDefaultProject(init?: Partial<Project>): Project {
  const now = Date.now();
  const coverSlide = createDefaultSlide('cover', 0);
  const explainSlide = createDefaultSlide('explain', 1);
  const ctaSlide = createDefaultSlide('cta', 2);

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    id: init?.id || `proj_${now}_${Math.random().toString(36).substring(2, 7)}`,
    title: init?.title || 'Untitled Carousel',
    platform: init?.platform || 'linkedin',
    contentType: init?.contentType || 'carousel',
    formatId: init?.formatId || 'r_4_5',
    orientation: init?.orientation || 'portrait',
    templateId: (init?.templateId as TemplateId) || 'network',
    primaryColor: init?.primaryColor || '#35D0E6',
    theme: init?.theme || 'dark',
    textDir: init?.textDir || 'auto',
    slides: init?.slides || [coverSlide, explainSlide, ctaSlide],
    counter: init?.counter || {
      ...DEFAULT_COUNTER_CONFIG,
      show: (init?.contentType || 'carousel') === 'carousel',
    },
    signature: init?.signature || { ...DEFAULT_SIGNATURE_CONFIG },
    pattern: init?.pattern || {
      enabled: (init?.templateId || 'network') === 'network',
      intensity: 1,
    },
    createdAt: init?.createdAt || now,
    updatedAt: now,
  };
}

export interface ProjectState {
  project: Project;
  activeSlideId: string;

  // Actions
  setProject: (project: Project) => void;
  createProject: (init?: Partial<Project>) => Project;
  updateProjectMeta: (
    meta: Partial<Omit<Project, 'slides' | 'id' | 'schemaVersion' | 'createdAt'>>
  ) => void;
  setActiveSlideId: (id: string) => void;

  // Slide CRUD
  addSlide: (type?: SlideType, atIndex?: number) => Slide;
  duplicateSlide: (id: string) => Slide | undefined;
  deleteSlide: (id: string) => void;
  reorderSlides: (startIndex: number, endIndex: number) => void;
  updateSlideFields: (id: string, fields: Record<string, string>) => void;
  updateSlideMedia: (id: string, media?: MediaRef) => void;
  updateSlotOverride: (slideId: string, aspect: AspectClass, elementId: string, override?: ElementOverride) => void;
  updateExtraElement: (slideId: string, extra: ExtraElement) => void;
  addExtraElement: (slideId: string, extra: ExtraElement) => void;
  deleteExtraElement: (slideId: string, extraId: string) => void;
  setSlideType: (id: string, nextType: SlideType) => void;
  toggleHideSignature: (id: string) => void;
  splitSlide: (id: string) => void;
  appendSlides: (slides: Slide[]) => void;
  replaceSlides: (slides: Slide[]) => void;
}

const initialProject = createDefaultProject();

export const useProjectStore = create<ProjectState>()(
  persist(
    (setRaw, get) => {
      let pendingCoalesceKey: string | undefined;
      const set = (partial: Parameters<typeof setRaw>[0], replace?: boolean) => {
        const before = get().project;
        const coalesceKey = pendingCoalesceKey;
        pendingCoalesceKey = undefined;
        setRaw(partial, replace);
        const after = get().project;
        if (after !== before) recordHistoryChange('project', before, after, coalesceKey);
      };
      return {
        project: initialProject,
        activeSlideId: initialProject.slides[0]?.id || '',

        setProject: (project: Project) => {
          set({
            project,
            activeSlideId: project.slides[0]?.id || '',
          });
        },

        createProject: (init) => {
          const newProj = createDefaultProject(init);
          set({
            project: newProj,
            activeSlideId: newProj.slides[0]?.id || '',
          });
          return newProj;
        },

        updateProjectMeta: (meta) => {
          set((state) => ({
            project: {
              ...state.project,
              ...meta,
              updatedAt: Date.now(),
            },
          }));
        },

        setActiveSlideId: (activeSlideId: string) => {
          set({ activeSlideId });
        },

        addSlide: (type = 'explain', atIndex) => {
          const slides = [...get().project.slides];
          const newSlide = createDefaultSlide(type, slides.length);
          const insertAt = atIndex !== undefined ? atIndex : slides.length;
          slides.splice(insertAt, 0, newSlide);

          set((state) => ({
            project: {
              ...state.project,
              slides,
              updatedAt: Date.now(),
            },
            activeSlideId: newSlide.id,
          }));

          return newSlide;
        },

        duplicateSlide: (id: string) => {
          const slides = [...get().project.slides];
          const targetIndex = slides.findIndex((s) => s.id === id);
          if (targetIndex === -1) return undefined;

          const original = slides[targetIndex]!;
          const duplicate: Slide = {
            ...original,
            id: `slide_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            fields: { ...original.fields },
            media: original.media ? { ...original.media } : undefined,
          };

          slides.splice(targetIndex + 1, 0, duplicate);

          set((state) => ({
            project: {
              ...state.project,
              slides,
              updatedAt: Date.now(),
            },
            activeSlideId: duplicate.id,
          }));

          return duplicate;
        },

        deleteSlide: (id: string) => {
          const currentSlides = get().project.slides;
          if (currentSlides.length <= 1) return; // Keep at least one slide

          const targetIndex = currentSlides.findIndex((s) => s.id === id);
          if (targetIndex === -1) return;

          const nextSlides = currentSlides.filter((s) => s.id !== id);
          let nextActiveId = get().activeSlideId;

          if (nextActiveId === id) {
            const newIndex = Math.min(targetIndex, nextSlides.length - 1);
            nextActiveId = nextSlides[newIndex]!.id;
          }

          set((state) => ({
            project: {
              ...state.project,
              slides: nextSlides,
              updatedAt: Date.now(),
            },
            activeSlideId: nextActiveId,
          }));
        },

        appendSlides: (newSlides: Slide[]) => {
          if (newSlides.length === 0) return;
          const slides = [...get().project.slides, ...newSlides];
          set((state) => ({
            project: {
              ...state.project,
              slides,
              updatedAt: Date.now(),
            },
            activeSlideId: newSlides[0]?.id || state.activeSlideId,
          }));
        },

        replaceSlides: (newSlides: Slide[]) => {
          if (newSlides.length === 0) return;
          set((state) => ({
            project: {
              ...state.project,
              slides: newSlides,
              updatedAt: Date.now(),
            },
            activeSlideId: newSlides[0]?.id || '',
          }));
        },

        reorderSlides: (startIndex: number, endIndex: number) => {
          if (startIndex === endIndex) return;
          const slides = [...get().project.slides];
          const [removed] = slides.splice(startIndex, 1);
          if (!removed) return;
          slides.splice(endIndex, 0, removed);

          set((state) => ({
            project: {
              ...state.project,
              slides,
              updatedAt: Date.now(),
            },
          }));
        },

        updateSlideFields: (id: string, fields: Record<string, string>) => {
          pendingCoalesceKey = `slide-field:${id}:${Object.keys(fields).sort().join(',')}`;
          set((state) => ({
            project: {
              ...state.project,
              slides: state.project.slides.map((s) =>
                s.id === id
                  ? {
                      ...s,
                      fields: { ...s.fields, ...plainTextFieldsToRichText(fields) },
                    }
                  : s
              ),
              updatedAt: Date.now(),
            },
          }));
        },

        updateSlideMedia: (id: string, media?: MediaRef) => {
          set((state) => ({
            project: {
              ...state.project,
              slides: state.project.slides.map((s) =>
                s.id === id
                  ? {
                      ...s,
                      media,
                    }
                  : s
              ),
              updatedAt: Date.now(),
            },
          }));
        },

        updateSlotOverride: (slideId, aspect, elementId, override) => {
          set((state) => ({
            project: {
              ...state.project,
              slides: state.project.slides.map((slide) => {
                if (slide.id !== slideId) return slide;
                const overrides = { ...(slide.overrides ?? {}) };
                const aspectOverrides = { ...(overrides[aspect] ?? {}) };
                if (override) aspectOverrides[elementId] = override;
                else delete aspectOverrides[elementId];
                overrides[aspect] = aspectOverrides;
                return { ...slide, overrides };
              }),
              updatedAt: Date.now(),
            },
          }));
        },

        updateExtraElement: (slideId, extra) => {
          set((state) => ({
            project: {
              ...state.project,
              slides: state.project.slides.map((slide) => slide.id !== slideId ? slide : {
                ...slide,
                extras: (slide.extras ?? []).map((item) => item.id === extra.id ? extra : item),
              }),
              updatedAt: Date.now(),
            },
          }));
        },

        addExtraElement: (slideId, extra) => {
          set((state) => ({
            project: {
              ...state.project,
              slides: state.project.slides.map((slide) => slide.id === slideId ? { ...slide, extras: [...(slide.extras ?? []), extra] } : slide),
              updatedAt: Date.now(),
            },
          }));
        },

        deleteExtraElement: (slideId, extraId) => {
          set((state) => ({
            project: {
              ...state.project,
              slides: state.project.slides.map((slide) => slide.id === slideId ? { ...slide, extras: (slide.extras ?? []).filter((extra) => extra.id !== extraId) } : slide),
              updatedAt: Date.now(),
            },
          }));
        },

        setSlideType: (id: string, nextType: SlideType) => {
          set((state) => ({
            project: {
              ...state.project,
              slides: state.project.slides.map((s) => {
                if (s.id !== id) return s;
                // Preserve compatible fields across type change per Spec §10.2
                const plainFields = richTextFieldsToPlainText(s.fields);
                const preservedFields: Record<string, string> = {};
                if (plainFields.title) preservedFields.title = plainFields.title;
                if (plainFields.body) preservedFields.body = plainFields.body;
                if (plainFields.note) preservedFields.note = plainFields.note;

                return {
                  ...s,
                  type: nextType,
                  fields: {
                    ...createDefaultSlide(nextType).fields,
                    ...plainTextFieldsToRichText(preservedFields),
                  },
                };
              }),
              updatedAt: Date.now(),
            },
          }));
        },

        toggleHideSignature: (id: string) => {
          set((state) => ({
            project: {
              ...state.project,
              slides: state.project.slides.map((s) =>
                s.id === id ? { ...s, hideSignature: !s.hideSignature } : s
              ),
              updatedAt: Date.now(),
            },
          }));
        },

        splitSlide: (id: string) => {
          const slides = [...get().project.slides];
          const targetIndex = slides.findIndex((s) => s.id === id);
          if (targetIndex === -1) return;

          const original = slides[targetIndex]!;
          if (original.type !== 'explain') return;

          const originalFields = richTextFieldsToPlainText(original.fields);
          const lines = (originalFields.body || '').split('\n').filter((l) => l.trim().length > 0);
          if (lines.length < 2) return;

          const half = Math.ceil(lines.length / 2);
          const part1Lines = lines.slice(0, half).join('\n');
          const part2Lines = lines.slice(half).join('\n');

          // Update original slide
          slides[targetIndex] = {
            ...original,
            fields: {
              ...original.fields,
              ...plainTextFieldsToRichText({ body: part1Lines }),
            },
          };

          // Insert new part 2 slide
          const splitSlide: Slide = {
            id: `slide_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            type: 'explain',
            fields: plainTextFieldsToRichText({
              title: `${originalFields.title || ''} (Cont.)`,
              body: part2Lines,
            }),
          };

          slides.splice(targetIndex + 1, 0, splitSlide);

          set((state) => ({
            project: {
              ...state.project,
              slides,
              updatedAt: Date.now(),
            },
            activeSlideId: splitSlide.id,
          }));
        },
      };
    },
    {
      name: STORAGE_KEYS.CURRENT_PROJECT,
      version: 2,
      migrate: (persistedState: unknown) => {
        if (typeof persistedState !== 'object' || persistedState === null) {
          return { project: initialProject, activeSlideId: initialProject.slides[0]?.id || '' };
        }
        const state = persistedState as { project?: unknown; activeSlideId?: string };
        try {
          return {
            ...state,
            project: state.project ? migrate(state.project) : initialProject,
            activeSlideId: state.activeSlideId || initialProject.slides[0]?.id || '',
          };
        } catch {
          return { project: initialProject, activeSlideId: initialProject.slides[0]?.id || '' };
        }
      },
      storage: createJSONStorage(() => createSafeStorage()),
    }
  )
);

registerHistoryChannel('project', useProjectStore.getState().project, (project) => {
  const restoredProject = project as Project;
  useProjectStore.setState((state) => ({
    project: restoredProject,
    activeSlideId: restoredProject.slides.some((slide) => slide.id === state.activeSlideId)
      ? state.activeSlideId
      : restoredProject.slides[0]?.id || '',
  }));
});

let autosaveTimer: ReturnType<typeof setTimeout> | null = null;

// Debounced autosave (~500ms) automatically syncing active project into recent projects per Spec §8.2
useProjectStore.subscribe((state) => {
  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
  }
  autosaveTimer = setTimeout(() => {
    if (state.project && state.project.slides && state.project.slides.length > 0) {
      useRecentStore.getState().saveProject(state.project);
    }
  }, 500);
});

// ============================================================================
// Granular Performance Selectors
// Avoid full canvas re-renders when a single slide or title changes
// ============================================================================

export function useActiveSlide(): Slide | undefined {
  return useProjectStore((state) => state.project.slides.find((s) => s.id === state.activeSlideId));
}

export function useSlide(id: string): Slide | undefined {
  return useProjectStore((state) => state.project.slides.find((s) => s.id === id));
}

export function useSlideIds(): string[] {
  return useProjectStore(useShallow((state) => state.project.slides.map((s) => s.id)));
}

export function useSlideCount(): number {
  return useProjectStore((state) => state.project.slides.length);
}

export function useProjectMeta() {
  return useProjectStore(
    useShallow((state) => ({
      id: state.project.id,
      title: state.project.title,
      platform: state.project.platform,
      contentType: state.project.contentType,
      formatId: state.project.formatId,
      orientation: state.project.orientation,
      templateId: state.project.templateId,
      primaryColor: state.project.primaryColor,
      theme: state.project.theme,
      textDir: state.project.textDir,
    }))
  );
}
