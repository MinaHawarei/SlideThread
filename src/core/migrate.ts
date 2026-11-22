import { CURRENT_SCHEMA_VERSION, Project, validateProject } from './schema';

export class MigrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MigrationError';
  }
}

/**
 * Migrates a raw/untrusted project object from an older schema version to the current version.
 * Throws MigrationError if data is malformed or from an unsupported future version.
 */
export function migrate(data: unknown): Project {
  if (!data || typeof data !== 'object') {
    throw new MigrationError('Malformed project data: expected an object');
  }

  const raw = { ...(data as Record<string, unknown>) };

  const version = typeof raw['schemaVersion'] === 'number' ? raw['schemaVersion'] : 0;

  if (version > CURRENT_SCHEMA_VERSION) {
    throw new MigrationError(
      `Unsupported future schema version: ${version} (current supported version is ${CURRENT_SCHEMA_VERSION})`
    );
  }

  // Handle migration from legacy/version 0 to version 1
  if (version === 0) {
    raw['schemaVersion'] = 1;

    if (!raw['id'] || typeof raw['id'] !== 'string') {
      raw['id'] = `proj_${Date.now()}`;
    }
    if (!raw['title'] || typeof raw['title'] !== 'string') {
      raw['title'] = 'Untitled Project';
    }
    if (!raw['platform']) {
      raw['platform'] = 'instagram';
    }
    if (!raw['contentType']) {
      raw['contentType'] = 'carousel';
    }
    if (!raw['formatId']) {
      raw['formatId'] = 'r_4_5';
    }
    if (!raw['orientation']) {
      raw['orientation'] = 'portrait';
    }
    if (!raw['templateId']) {
      raw['templateId'] = 'network';
    }
    if (!raw['primaryColor'] || typeof raw['primaryColor'] !== 'string') {
      raw['primaryColor'] = '#35D0E6';
    }
    if (!raw['theme']) {
      raw['theme'] = 'dark';
    }
    if (!raw['textDir']) {
      raw['textDir'] = 'auto';
    }
    if (!Array.isArray(raw['slides'])) {
      raw['slides'] = [];
    }
    if (!raw['createdAt'] || typeof raw['createdAt'] !== 'number') {
      raw['createdAt'] = Date.now();
    }
    if (!raw['updatedAt'] || typeof raw['updatedAt'] !== 'number') {
      raw['updatedAt'] = Date.now();
    }
  }

  try {
    return validateProject(raw);
  } catch (err) {
    throw new MigrationError(
      `Validation failed after migration: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}
