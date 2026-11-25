import { plainTextFieldsToRichText } from '../../src/core/schema';
import { describe, it, expect } from 'vitest';
import {
  validateProject,
  validateBrandSettings,
  Project,
  BrandSettings,
  CURRENT_SCHEMA_VERSION,
} from '@/core/schema';
import { ZodError } from 'zod';

describe('Project schema validation', () => {
  const validProject: Project = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    id: 'proj_123',
    title: 'Test Carousel',
    platform: 'instagram',
    contentType: 'carousel',
    formatId: 'r_4_5',
    orientation: 'portrait',
    templateId: 'tech-mesh',
    primaryColor: '#35D0E6',
    theme: 'dark',
    textDir: 'auto',
    slides: [
      {
        id: 'slide_1',
        type: 'cover',
        fields: plainTextFieldsToRichText({ title: 'Welcome', sub: 'To SlideThread' }),
        hideSignature: false,
      },
    ],
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  };

  it('validates a correct project and supplies omitted v2 defaults', () => {
    const result = validateProject(validProject);
    expect(result.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(result.slides[0]?.overrides).toEqual({});
    expect(result.slides[0]?.extras).toEqual([]);
    expect(result.counter).toMatchObject({ style: 'number' });
    expect(result.pattern).toEqual({ enabled: false, intensity: 1 });
  });

  it('throws ZodError on missing required fields', () => {
    // Missing title and platform
    const invalid = { ...validProject };
    delete (invalid as Record<string, unknown>)['title'];
    delete (invalid as Record<string, unknown>)['platform'];

    expect(() => validateProject(invalid)).toThrow(ZodError);
  });

  it('throws ZodError on invalid slide type or media format', () => {
    const invalid = {
      ...validProject,
      slides: [
        {
          id: 'slide_bad',
          type: 'invalid_type',
          fields: plainTextFieldsToRichText({}),
        },
      ],
    };
    expect(() => validateProject(invalid)).toThrow(ZodError);
  });
});

describe('BrandSettings schema validation', () => {
  const validSettings: BrandSettings = {
    displayName: 'Mina Hawarei',
    handle: '@minahawarei',
    showSignature: true,
    showSocials: false,
    socials: [{ platform: 'github', handle: 'minahawarei' }],
    language: 'en',
    defaultTemplateId: 'tech-mesh',
    defaultPrimaryColor: '#35D0E6',
    defaultTheme: 'dark',
  };

  it('validates correct brand settings', () => {
    const result = validateBrandSettings(validSettings);
    expect(result).toMatchObject({
      ...validSettings,
      defaultCounter: { show: true, anchor: 'br', style: 'number' },
      defaultSignature: { show: true, anchor: 'bc', arrangement: 'inline' },
    });
  });

  it('rejects invalid language or social platform', () => {
    const invalid = { ...validSettings, language: 'fr' };
    expect(() => validateBrandSettings(invalid)).toThrow(ZodError);
  });
});
