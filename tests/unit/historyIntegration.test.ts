import { beforeEach, describe, expect, it } from 'vitest';
import { clear, getHistoryDepth, redo, undo } from '../../src/store/history';
import { useProjectStore } from '../../src/store/projectStore';
import { useSettingsStore } from '../../src/store/settingsStore';
import { richTextToPlainText } from '../../src/core/schema';

describe('global project and brand history', () => {
  beforeEach(() => {
    clear();
  });

  it('undoes and redoes project and settings changes in one chronological stack', () => {
    const originalTitle = useProjectStore.getState().project.title;
    const originalName = useSettingsStore.getState().settings.displayName;
    useProjectStore.getState().updateProjectMeta({ title: 'History Project' });
    useSettingsStore.getState().setDisplayName('History Brand');

    expect(getHistoryDepth().undo).toBe(2);
    expect(undo()).toBe(true);
    expect(useSettingsStore.getState().settings.displayName).toBe(originalName);
    expect(useProjectStore.getState().project.title).toBe('History Project');
    expect(undo()).toBe(true);
    expect(useProjectStore.getState().project.title).toBe(originalTitle);
    expect(redo()).toBe(true);
    expect(useProjectStore.getState().project.title).toBe('History Project');
    expect(redo()).toBe(true);
    expect(useSettingsStore.getState().settings.displayName).toBe('History Brand');
  });

  it('coalesces consecutive edits to the same slide field', () => {
    const slide = useProjectStore.getState().project.slides[0]!;
    const originalTitle = richTextToPlainText(slide.fields.title!);
    useProjectStore.getState().updateSlideFields(slide.id, { title: 'First keystroke' });
    useProjectStore.getState().updateSlideFields(slide.id, { title: 'Final typed title' });

    expect(getHistoryDepth().undo).toBe(1);
    undo();
    const restored = useProjectStore.getState().project.slides[0]!;
    expect(richTextToPlainText(restored.fields.title!)).toBe(originalTitle);
  });
});
