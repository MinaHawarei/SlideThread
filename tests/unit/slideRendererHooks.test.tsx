import { render, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { createDefaultProject } from '../../src/store/projectStore';
import { generatePalette } from '../../src/core/palette';
import * as projectSnapshots from '../../src/templates/projectSnapshot';
import { SlideRenderer } from '../../src/slides/SlideRenderer';

afterEach(() => vi.restoreAllMocks());

it('keeps hook order stable when the same renderer transitions from loading to its asynchronously resolved template', async () => {
  const project = createDefaultProject({ templateId: 'tech-mesh' });
  const slide = project.slides[0]!;
  const snapshot = await projectSnapshots.loadTemplateProjectSnapshot('tech-mesh', project.primaryColor);
  const loadSnapshot = vi.spyOn(projectSnapshots, 'loadTemplateProjectSnapshot').mockResolvedValue(snapshot);
  const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
  const props = {
    slide,
    palette: generatePalette(project.primaryColor, project.theme),
    aspectClass: 'portrait' as const,
    textDir: 'ltr' as const,
    templateId: 'tech-mesh',
  };

  const view = render(<SlideRenderer {...props} />);
  expect(view.container.querySelector('.template-loading')).not.toBeNull();
  await waitFor(() => expect(view.container.querySelector('.template-loading')).toBeNull());

  expect(loadSnapshot).toHaveBeenCalledWith('tech-mesh', '#35D0E6');
  expect(view.container.querySelector('[data-template-id="tech-mesh"]')).not.toBeNull();
  const hookWarnings = errors.mock.calls.flat().map((parts) => parts.join(' ')).filter((message) => /change in the order of Hooks|Rendered (more|fewer) hooks/i.test(message));
  expect(hookWarnings).toEqual([]);
});
