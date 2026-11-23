import { beforeEach, describe, expect, it } from 'vitest';
import { act, fireEvent, render } from '@testing-library/react';
import { App } from '../../src/App';
import { clear } from '../../src/store/history';
import { useProjectStore } from '../../src/store/projectStore';

describe('global undo/redo keyboard shortcuts', () => {
  beforeEach(() => clear());

  it('handles Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z', () => {
    render(<App />);
    const originalTitle = useProjectStore.getState().project.title;
    act(() => useProjectStore.getState().updateProjectMeta({ title: 'Shortcut Test' }));

    fireEvent.keyDown(window, { key: 'z', ctrlKey: true });
    expect(useProjectStore.getState().project.title).toBe(originalTitle);
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true, shiftKey: true });
    expect(useProjectStore.getState().project.title).toBe('Shortcut Test');
  });
});
