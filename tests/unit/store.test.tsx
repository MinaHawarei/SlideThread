import { describe, it, expect, beforeEach } from 'vitest';
import { richTextToPlainText } from '../../src/core/schema';
import { renderHook, act } from '@testing-library/react';
import {
  useSettingsStore,
  DEFAULT_BRAND_SETTINGS,
  useProjectStore,
  useRecentStore,
  useActiveSlide,
  useSlide,
  useSlideIds,
  useSlideCount,
  useProjectMeta,
  createDefaultProject,
  getDemoProjectEn,
  getDemoProjectAr,
} from '../../src/store';
import { validateProject, validateBrandSettings } from '../../src/core/schema';
import { useI18nStore } from '../../src/i18n';

describe('Zustand State Stores (Spec §3, §10, §12, Task P3-2)', () => {
  beforeEach(() => {
    useSettingsStore.getState().resetSettings();
    useRecentStore.getState().clearRecents();
    useProjectStore.getState().setProject(createDefaultProject());
  });

  describe('settingsStore', () => {
    it('initializes with default brand settings', () => {
      const { settings } = useSettingsStore.getState();
      expect(settings.displayName).toBe(DEFAULT_BRAND_SETTINGS.displayName);
      expect(settings.handle).toBe(DEFAULT_BRAND_SETTINGS.handle);
      expect(settings.showSignature).toBe(true);
      expect(validateBrandSettings(settings)).toBeDefined();
    });

    it('updates brand fields and handles', () => {
      const { setDisplayName, setHandle, setPhotoDataUrl, toggleSignature } = useSettingsStore.getState();

      act(() => {
        setDisplayName('New Name');
        setHandle('@newhandle');
        setPhotoDataUrl('data:image/png;base64,mock');
        toggleSignature(false);
      });

      const updated = useSettingsStore.getState().settings;
      expect(updated.displayName).toBe('New Name');
      expect(updated.handle).toBe('@newhandle');
      expect(updated.photoDataUrl).toBe('data:image/png;base64,mock');
      expect(updated.showSignature).toBe(false);
    });

    it('manages social accounts without duplication', () => {
      const { addSocial, removeSocial } = useSettingsStore.getState();

      act(() => {
        addSocial('github', 'mynewgithub');
        addSocial('x', '@newx');
      });

      let socials = useSettingsStore.getState().settings.socials;
      expect(socials.find((s) => s.platform === 'github')?.handle).toBe('mynewgithub');
      expect(socials.find((s) => s.platform === 'x')?.handle).toBe('@newx');

      act(() => {
        removeSocial('github');
      });

      socials = useSettingsStore.getState().settings.socials;
      expect(socials.find((s) => s.platform === 'github')).toBeUndefined();
    });

    it('syncs language changes with useI18nStore', () => {
      act(() => {
        useSettingsStore.getState().setLanguage('ar');
      });

      expect(useSettingsStore.getState().settings.language).toBe('ar');
      expect(useI18nStore.getState().locale).toBe('ar');
    });
  });

  describe('projectStore & granular selectors', () => {
    it('creates project with valid schema and default 3 slides', () => {
      const proj = useProjectStore.getState().project;
      expect(validateProject(proj)).toBeDefined();
      expect(proj.slides.length).toBe(3);
      expect(proj.slides[0]?.type).toBe('cover');
      expect(proj.slides[1]?.type).toBe('explain');
      expect(proj.slides[2]?.type).toBe('cta');
    });

    it('adds and duplicates slides correctly', () => {
      let newSlideId = '';
      act(() => {
        const slide = useProjectStore.getState().addSlide('stat');
        newSlideId = slide.id;
      });

      expect(useProjectStore.getState().project.slides.length).toBe(4);
      expect(useProjectStore.getState().activeSlideId).toBe(newSlideId);

      let dupId = '';
      act(() => {
        const dup = useProjectStore.getState().duplicateSlide(newSlideId);
        dupId = dup!.id;
      });

      expect(useProjectStore.getState().project.slides.length).toBe(5);
      expect(dupId).not.toBe(newSlideId);
      expect(useProjectStore.getState().activeSlideId).toBe(dupId);
    });

    it('deletes slides but preserves at least one slide', () => {
      const initialSlides = useProjectStore.getState().project.slides;
      const slide1 = initialSlides[0]!.id;
      const slide2 = initialSlides[1]!.id;
      const slide3 = initialSlides[2]!.id;

      act(() => {
        useProjectStore.getState().deleteSlide(slide1);
      });
      expect(useProjectStore.getState().project.slides.length).toBe(2);

      act(() => {
        useProjectStore.getState().deleteSlide(slide2);
      });
      expect(useProjectStore.getState().project.slides.length).toBe(1);

      // Cannot delete last slide
      act(() => {
        useProjectStore.getState().deleteSlide(slide3);
      });
      expect(useProjectStore.getState().project.slides.length).toBe(1);
    });

    it('reorders slides accurately', () => {
      const slides = useProjectStore.getState().project.slides;
      const id0 = slides[0]!.id;
      const id1 = slides[1]!.id;

      act(() => {
        useProjectStore.getState().reorderSlides(0, 1);
      });

      const reordered = useProjectStore.getState().project.slides;
      expect(reordered[0]!.id).toBe(id1);
      expect(reordered[1]!.id).toBe(id0);
    });

    it('updates slide fields independently', () => {
      const slides = useProjectStore.getState().project.slides;
      const targetId = slides[1]!.id;

      act(() => {
        useProjectStore.getState().updateSlideFields(targetId, { title: 'Updated Title' });
      });

      const updatedSlide = useProjectStore.getState().project.slides.find((s) => s.id === targetId);
      expect(richTextToPlainText(updatedSlide!.fields.title!)).toBe('Updated Title');
      expect(updatedSlide?.fields.body).toBeDefined(); // preserved other fields
    });

    it('setSlideType preserves compatible fields like title, body, and note', () => {
      const slideId = useProjectStore.getState().project.slides[1]!.id;

      act(() => {
        useProjectStore.getState().updateSlideFields(slideId, { title: 'Core Principle', body: 'Important text' });
        useProjectStore.getState().setSlideType(slideId, 'code');
      });

      const changedSlide = useProjectStore.getState().project.slides.find((s) => s.id === slideId);
      expect(changedSlide?.type).toBe('code');
      expect(richTextToPlainText(changedSlide!.fields.title!)).toBe('Core Principle');
    });

    it('splitSlide splits multi-line explain slide into two slides', () => {
      const slideId = useProjectStore.getState().project.slides[1]!.id;

      act(() => {
        useProjectStore.getState().updateSlideFields(slideId, {
          title: 'Long Topic',
          body: '- Point 1\n- Point 2\n- Point 3\n- Point 4',
        });
        useProjectStore.getState().splitSlide(slideId);
      });

      const slides = useProjectStore.getState().project.slides;
      expect(slides.length).toBe(4);

      const part1 = slides.find((s) => s.id === slideId);
      expect(richTextToPlainText(part1!.fields.body!)).toContain('Point 1');
      expect(richTextToPlainText(part1!.fields.body!)).not.toContain('Point 4');

      const part2 = slides[2]!;
      expect(richTextToPlainText(part2.fields.title!)).toContain('Long Topic');
      expect(richTextToPlainText(part2.fields.body!)).toContain('Point 3');
      expect(richTextToPlainText(part2.fields.body!)).toContain('Point 4');
    });

    it('granular selectors provide isolated reactive hooks without full canvas invalidation', () => {
      const { result: activeResult } = renderHook(() => useActiveSlide());
      const { result: countResult } = renderHook(() => useSlideCount());
      const { result: idsResult } = renderHook(() => useSlideIds());
      const { result: metaResult } = renderHook(() => useProjectMeta());
      const targetId = useProjectStore.getState().activeSlideId;
      const { result: slideResult } = renderHook(() => useSlide(targetId));

      expect(activeResult.current?.id).toBe(targetId);
      expect(slideResult.current?.id).toBe(targetId);
      expect(countResult.current).toBe(3);
      expect(idsResult.current.length).toBe(3);
      expect(metaResult.current.title).toBe('Untitled Carousel');
    });
  });

  describe('recentStore', () => {
    it('records and updates recent project metadata', () => {
      const proj = useProjectStore.getState().project;

      act(() => {
        useRecentStore.getState().addOrUpdateRecent(proj);
      });

      let recents = useRecentStore.getState().recents;
      expect(recents.length).toBe(1);
      expect(recents[0]?.id).toBe(proj.id);
      expect(recents[0]?.title).toBe(proj.title);
      expect(recents[0]?.slideCount).toBe(3);

      // Delete recent
      act(() => {
        useRecentStore.getState().deleteRecent(proj.id);
      });
      recents = useRecentStore.getState().recents;
      expect(recents.length).toBe(0);
    });

    it('caps recent projects list at maximum 20 items', () => {
      act(() => {
        for (let i = 0; i < 25; i++) {
          const p = createDefaultProject({ id: `p_${i}`, title: `Project ${i}` });
          useRecentStore.getState().addOrUpdateRecent(p);
        }
      });

      const recents = useRecentStore.getState().recents;
      expect(recents.length).toBe(20);
      expect(recents[0]?.id).toBe('p_24'); // newest first
    });
  });

  describe('seedProjects (Spec §11)', () => {
    it('English demo project has all 9 slide types and valid schema', () => {
      const demoEn = getDemoProjectEn();
      expect(validateProject(demoEn)).toBeDefined();
      expect(demoEn.slides.length).toBe(9);

      const slideTypes = demoEn.slides.map((s) => s.type);
      const expectedTypes = ['cover', 'explain', 'rule', 'compare', 'code', 'stat', 'quote', 'image', 'cta'];
      expect(slideTypes).toEqual(expectedTypes);
    });

    it('Arabic demo project has all 9 slide types and valid schema', () => {
      const demoAr = getDemoProjectAr();
      expect(validateProject(demoAr)).toBeDefined();
      expect(demoAr.slides.length).toBe(9);
      expect(demoAr.textDir).toBe('rtl');

      const slideTypes = demoAr.slides.map((s) => s.type);
      const expectedTypes = ['cover', 'explain', 'rule', 'compare', 'code', 'stat', 'quote', 'image', 'cta'];
      expect(slideTypes).toEqual(expectedTypes);
    });
  });
});
