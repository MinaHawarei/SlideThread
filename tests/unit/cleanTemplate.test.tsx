import { describe, it, expect } from 'vitest';
import { getTemplate } from '../../src/templates';

describe('Clean Minimal package metadata', () => {
  it('has a package-backed gallery entry and canonical ID', () => {
    const template = getTemplate('clean-minimal');
    expect(template.id).toBe('clean-minimal');
    expect(template.className).toBe('clean');
    expect(template.nameKey).toBe('wizard.template.clean-minimal');
  });
});
