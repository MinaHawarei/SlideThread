import { describe, it, expect } from 'vitest';
import { migrate, MigrationError } from '@/core/migrate';
import { CURRENT_SCHEMA_VERSION } from '@/core/schema';

describe('Project migration and validation', () => {
  const validProject = {
    schemaVersion: 1,
    id: 'proj_current',
    title: 'Migrated Project',
    platform: 'linkedin',
    contentType: 'carousel',
    formatId: 'r_4_5',
    orientation: 'portrait',
    templateId: 'tech-mesh',
    primaryColor: '#35D0E6',
    theme: 'dark',
    textDir: 'auto',
    slides: [],
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  };

  it('migrates v1 string fields, template ids, and supplies v2 defaults', () => {
    const result = migrate(validProject);
    expect(result.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(result.templateId).toBe('tech-mesh');
    expect(result.slides).toEqual([]);
    expect(result.counter).toMatchObject({ show: true, style: 'number' });
    expect(result.signature?.anchor).toBe('bc');
    expect(result.pattern).toEqual({ enabled: true, intensity: 1 });
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
    expect(result.templateId).toBe('tech-mesh');
    expect(result.primaryColor).toBe('#35D0E6');
    expect(result.textDir).toBe('auto');
    expect(result.slides.length).toBe(1);
    expect(result.slides[0]?.fields['title']).toEqual({
      type: 'doc', blocks: [{ type: 'p', runs: [{ text: 'Hello' }] }],
    });
    expect(result.slides[0]?.overrides).toEqual({});
    expect(result.slides[0]?.extras).toEqual([]);
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

  it('rejects malformed v2 RichText, config bounds, and non-object overrides', () => {
    const v2 = migrate(validProject);
    expect(() => migrate({ ...v2, slides: [{ id: 's', type: 'cover', fields: { title: 'plain' } }] })).toThrow(MigrationError);
    expect(() => migrate({ ...v2, pattern: { enabled: true, intensity: 2 } })).toThrow(MigrationError);
    expect(() => migrate({ ...v2, slides: [{ ...v2.slides[0], overrides: { square: { title: { dx: 0, dy: 0, scale: 0 } } } }] })).toThrow(MigrationError);
  });

  it('rejects malformed schema versions', () => {
    expect(() => migrate({ schemaVersion: '2' })).toThrow(/schemaVersion must be a non-negative integer/);
    expect(() => migrate({ schemaVersion: -1 })).toThrow(/schemaVersion must be a non-negative integer/);
  });
});
