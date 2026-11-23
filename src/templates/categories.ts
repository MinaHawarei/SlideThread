import categories from './registry/categories.json';
import { z } from 'zod';

export const CategorySchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.object({ en: z.string().trim().min(1), ar: z.string().trim().min(1) }).strict(),
  description: z.object({ en: z.string(), ar: z.string() }).strict(),
  icon: z.string().trim().min(1),
  status: z.enum(['active', 'planned']),
}).strict();

export const CATEGORY_REGISTRY = z.array(CategorySchema).parse(categories);
export type CategoryId = (typeof CATEGORY_REGISTRY)[number]['id'];
