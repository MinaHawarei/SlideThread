import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import type { Project, Slide, SlideType, MediaRef, TemplateId } from '../core/schema';
import { CURRENT_SCHEMA_VERSION } from '../core/schema';
import { STORAGE_KEYS, createSafeStorage } from '../core/storage';
import { useRecentStore } from './recentStore';

export function createDefaultSlide(type: SlideType = 'cover', index = 0): Slide {
  const id = `slide_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  switch (type) {
    case 'cover':
      return {
        id,
        type: 'cover',
        fields: {
          tag: 'ARCHITECTURE',
          title: 'My Carousel Title',
          sub: 'A clear and compelling subtitle that hooks your readers.',
          rule: 'npx create-slidethread@latest',
        },
      };
    case 'explain':
      return {
        id,
        type: 'explain',
        fields: {
          title: `Key Concept ${index + 1}`,
          body: '- Point 1: First essential concept\n- Point 2: Second actionable takeaway\n- Point 3: Final takeaway to remember',
        },
      };
    case 'rule':
      return {
        id,
        type: 'rule',
        fields: {
          title: 'Core Rule',
          cond: 'You encounter this design challenge',
          res: 'Apply this concrete proven pattern',
          note: 'Guarantees reliable behavior every time',
          condLabel: 'IF',
          resLabel: 'THEN',
        },
      };
    case 'compare':
      return {
        id,
        type: 'compare',
        fields: {
          title: 'Do This, Not That',
          l1: 'Don\'t',
          t1: 'Mix state and presentation in one giant unmaintainable file',
          l2: 'Do',
          t2: 'Separate concerns into pure rendering components and stores',
        },
      };
    case 'code':
      return {
        id,
        type: 'code',
        fields: {
          title: 'Implementation Snippet',
          code: 'const studio = createStudio({\n  name: "SlideThread",\n  offline: true,\n});',
          note: 'Runs completely in your browser without servers',
        },
      };
    case 'stat':
      return {
        id,
        type: 'stat',
        fields: {
          value: '100%',
          label: 'Client-Side Execution',
          note: 'Zero telemetry, zero database dependencies',
        },
      };
    case 'quote':
      return {
        id,
        type: 'quote',
        fields: {
          text: 'Simple things should be simple, complex things should be possible.',
          author: 'Alan Kay',
        },
      };
    case 'image':
      return {
        id,
        type: 'image',
        fields: {
          caption: 'Visual overview of system architecture',
        },
      };
    case 'cta':
      return {
        id,
        type: 'cta',
        fields: {
          title: 'Liked this carousel?',
          body: 'Follow for weekly deep-dives into modern web architecture and client-side engineering.',
          action: 'Follow & Share',
        },
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
  updateProjectMeta: (meta: Partial<Omit<Project, 'slides' | 'id' | 'schemaVersion' | 'createdAt'>>) => void;
  setActiveSlideId: (id: string) => void;

  // Slide CRUD
  addSlide: (type?: SlideType, atIndex?: number) => Slide;
  duplicateSlide: (id: string) => Slide | undefined;
  deleteSlide: (id: string) => void;
  reorderSlides: (startIndex: number, endIndex: number) => void;
  updateSlideFields: (id: string, fields: Record<string, string>) => void;
  updateSlideMedia: (id: string, media?: MediaRef) => void;
  setSlideType: (id: string, nextType: SlideType) => void;
  toggleHideSignature: (id: string) => void;
  splitSlide: (id: string) => void;
  appendSlides: (slides: Slide[]) => void;
  replaceSlides: (slides: Slide[]) => void;
}

const initialProject = createDefaultProject();

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
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
        set((state) => ({
          project: {
            ...state.project,
            slides: state.project.slides.map((s) =>
              s.id === id
                ? {
                    ...s,
                    fields: { ...s.fields, ...fields },
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

      setSlideType: (id: string, nextType: SlideType) => {
        set((state) => ({
          project: {
            ...state.project,
            slides: state.project.slides.map((s) => {
              if (s.id !== id) return s;
              // Preserve compatible fields across type change per Spec §10.2
              const preservedFields: Record<string, string> = {};
              if (s.fields.title) preservedFields.title = s.fields.title;
              if (s.fields.body) preservedFields.body = s.fields.body;
              if (s.fields.note) preservedFields.note = s.fields.note;

              return {
                ...s,
                type: nextType,
                fields: {
                  ...createDefaultSlide(nextType).fields,
                  ...preservedFields,
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

        const lines = (original.fields.body || '').split('\n').filter((l) => l.trim().length > 0);
        if (lines.length < 2) return;

        const half = Math.ceil(lines.length / 2);
        const part1Lines = lines.slice(0, half).join('\n');
        const part2Lines = lines.slice(half).join('\n');

        // Update original slide
        slides[targetIndex] = {
          ...original,
          fields: {
            ...original.fields,
            body: part1Lines,
          },
        };

        // Insert new part 2 slide
        const splitSlide: Slide = {
          id: `slide_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          type: 'explain',
          fields: {
            title: `${original.fields.title || ''} (Cont.)`,
            body: part2Lines,
          },
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
    }),
    {
      name: STORAGE_KEYS.CURRENT_PROJECT,
      version: 1,
      storage: createJSONStorage(() => createSafeStorage()),
    }
  )
);

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
  return useProjectStore((state) =>
    state.project.slides.find((s) => s.id === state.activeSlideId)
  );
}

export function useSlide(id: string): Slide | undefined {
  return useProjectStore((state) => state.project.slides.find((s) => s.id === id));
}

export function useSlideIds(): string[] {
  return useProjectStore(
    useShallow((state) => state.project.slides.map((s) => s.id))
  );
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
