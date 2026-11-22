import { describe, it, expect } from 'vitest';
import { migrate, MigrationError } from '@/core/migrate';
import { CURRENT_SCHEMA_VERSION, Project } from '@/core/schema';

describe('Project migration and validation', () => {
  const validProject: Project = {
    schemaVersion: 1,
    id: 'proj_current',
    title: 'Migrated Project',
    platform: 'linkedin',
    contentType: 'carousel',
    formatId: 'r_4_5',
    orientation: 'portrait',
    templateId: 'network',
    primaryColor: '#35D0E6',
    theme: 'dark',
    textDir: 'auto',
    slides: [],
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  };

  it('passes through valid current schemaVersion projects', () => {
    const result = migrate(validProject);
    expect(result).toEqual(validProject);
  });

  it('migrates legacy projects (schemaVersion 0 or undefined) and fills defaults', () => {
    const legacyProject = {
      title: 'Old Project',
      slides: [{ id: 's1', type: 'explain', fields: { title: 'Hello', body: 'World' } }],
    };

    const result = migrate(legacyProject);
    expect(result.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(result.title).toBe('Old Project');
    expect(result.platform).toBe('instagram');
    expect(result.templateId).toBe('network');
    expect(result.primaryColor).toBe('#35D0E6');
    expect(result.textDir).toBe('auto');
    expect(result.slides.length).toBe(1);
    expect(result.id).toBeDefined();
  });

  it('throws MigrationError on unsupported future schemaVersion', () => {
    const futureProject = {
      ...validProject,
      schemaVersion: 999,
    };

    expect(() => migrate(futureProject)).toThrow(MigrationError);
    expect(() => migrate(futureProject)).toThrow(/Unsupported future schema version: 999/);
  });

  it('throws MigrationError on malformed non-object inputs', () => {
    expect(() => migrate(null)).toThrow(MigrationError);
    expect(() => migrate(undefined)).toThrow(MigrationError);
    expect(() => migrate('string')).toThrow(MigrationError);
    expect(() => migrate(12345)).toThrow(MigrationError);
  });
});
