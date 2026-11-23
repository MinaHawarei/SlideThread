import { z } from 'zod';
import {
  CURRENT_SCHEMA_VERSION,
  DEFAULT_COUNTER_CONFIG,
  DEFAULT_SIGNATURE_CONFIG,
  ValidatedProject,
  ProjectSchema,
  RichText,
  plainTextToRichText,
} from './schema';

const LegacySlideV1Schema = z.object({
  id: z.string(),
  type: z.enum(['cover', 'explain', 'rule', 'code', 'compare', 'stat', 'quote', 'image', 'cta']),
  fields: z.record(z.string(), z.string()),
  media: z.object({
    assetId: z.string(),
    fit: z.enum(['cover', 'contain']),
    focal: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }).optional(),
    placement: z.enum(['background', 'top', 'side', 'replace-text']),
  }).optional(),
  hideSignature: z.boolean().optional(),
}).strict();

const LegacyProjectV1Schema = z.object({
  schemaVersion: z.literal(1),
  id: z.string(),
  title: z.string(),
  platform: z.enum(['instagram', 'linkedin', 'facebook', 'custom']),
  contentType: z.enum(['post', 'carousel', 'story']),
  formatId: z.string(),
  orientation: z.enum(['landscape', 'portrait']),
  templateId: z.enum(['network', 'clean', 'bold']),
  primaryColor: z.string(),
  theme: z.enum(['dark', 'light']),
  textDir: z.enum(['auto', 'ltr', 'rtl']),
  slides: z.array(LegacySlideV1Schema),
  createdAt: z.number(),
  updatedAt: z.number(),
}).strict();

type LegacyProjectV1 = z.infer<typeof LegacyProjectV1Schema>;

export class MigrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MigrationError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function migrateV1ToV2(project: LegacyProjectV1): ValidatedProject {
  const templateIds: Record<string, string> = {
    network: 'tech-mesh',
    clean: 'clean-minimal',
    bold: 'bold-marketing',
  };

  return {
    ...project,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    templateId: templateIds[project.templateId] ?? project.templateId,
    slides: project.slides.map((slide) => ({
      ...slide,
      fields: Object.fromEntries(
        Object.entries(slide.fields).map(([key, value]): [string, RichText] => [key, plainTextToRichText(value)])
      ),
      overrides: {},
      extras: [],
    })),
    counter: { ...DEFAULT_COUNTER_CONFIG, show: project.contentType === 'carousel' },
    signature: { ...DEFAULT_SIGNATURE_CONFIG },
    pattern: { enabled: project.templateId === 'network', intensity: 1 },
  };
}

function normalizeVersionZero(raw: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = { ...raw, schemaVersion: 1 };
  if (typeof normalized['id'] !== 'string' || normalized['id'].length === 0) {
    normalized['id'] = `proj_${Date.now()}`;
  }
  if (typeof normalized['title'] !== 'string' || normalized['title'].length === 0) {
    normalized['title'] = 'Untitled Project';
  }
  if (normalized['platform'] === undefined) normalized['platform'] = 'instagram';
  if (normalized['contentType'] === undefined) normalized['contentType'] = 'carousel';
  if (normalized['formatId'] === undefined) normalized['formatId'] = 'r_4_5';
  if (normalized['orientation'] === undefined) normalized['orientation'] = 'portrait';
  if (normalized['templateId'] === undefined) normalized['templateId'] = 'network';
  if (normalized['primaryColor'] === undefined) normalized['primaryColor'] = '#35D0E6';
  if (normalized['theme'] === undefined) normalized['theme'] = 'dark';
  if (normalized['textDir'] === undefined) normalized['textDir'] = 'auto';
  if (!Array.isArray(normalized['slides'])) normalized['slides'] = [];
  if (typeof normalized['createdAt'] !== 'number') normalized['createdAt'] = Date.now();
  if (typeof normalized['updatedAt'] !== 'number') normalized['updatedAt'] = Date.now();
  return normalized;
}

/** Migrates legacy and v1 project data to the current v2 model, rejecting invalid or future data. */
export function migrate(data: unknown): ValidatedProject {
  if (!isRecord(data)) {
    throw new MigrationError('Malformed project data: expected an object');
  }

  const hasVersion = Object.hasOwn(data, 'schemaVersion');
  const incomingVersion = data['schemaVersion'];
  if (hasVersion && (typeof incomingVersion !== 'number' || !Number.isInteger(incomingVersion) || incomingVersion < 0)) {
    throw new MigrationError('Malformed project data: schemaVersion must be a non-negative integer');
  }

  const version = hasVersion ? (incomingVersion as number) : 0;
  if (version > CURRENT_SCHEMA_VERSION) {
    throw new MigrationError(
      `Unsupported future schema version: ${version} (current supported version is ${CURRENT_SCHEMA_VERSION})`
    );
  }

  try {
    if (version === 2) return ProjectSchema.parse(data);
    const normalized = version === 0 ? normalizeVersionZero(data) : data;
    const legacyProject = LegacyProjectV1Schema.parse(normalized);
    return ProjectSchema.parse(migrateV1ToV2(legacyProject));
  } catch (error) {
    if (error instanceof MigrationError) throw error;
    throw new MigrationError(
      `Validation failed during migration: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
