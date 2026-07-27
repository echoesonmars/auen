import { z } from 'zod';
import type { VendorItem } from './types';

const intKzt = z
  .number()
  .int('price_kzt must be an integer number of tenge')
  .nonnegative();

export const VendorItemSchema = z
  .object({
    id: z.string().min(1),
    city: z.string().min(1),
    district: z.string().min(1),
    name: z.string().min(1),
    category: z.enum([
      'venue',
      'catering',
      'staff',
      'equipment',
      'decor',
      'logistics',
    ]),
    price_model: z.enum([
      'flat',
      'per_hour',
      'per_day',
      'per_person',
      'per_person_per_day',
    ]),
    price_kzt: intKzt,
    rating: z.number().min(1).max(5),
    capacity_min: z.number().int().nonnegative(),
    capacity_max: z.number().int().nonnegative(),
    tags: z.array(z.string()),
    contact: z.string(),
    notes: z.string(),
    source: z.string(),
    verified: z.boolean(),
    includes: z.array(z.string()).optional(),
    min_order: z.number().int().nonnegative().optional(),
    cuisine: z.string().optional(),
    halal: z.boolean().optional(),
    role: z.string().optional(),
  })
  .refine((v) => v.capacity_max >= v.capacity_min, {
    message: 'capacity_max must be >= capacity_min',
    path: ['capacity_max'],
  });

export const VendorItemArraySchema = z.array(VendorItemSchema);

/** Parse + validate raw data. Throws (fails loudly) on any bad row. */
export function parseVendors(raw: unknown): VendorItem[] {
  const result = VendorItemArraySchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .slice(0, 10)
      .map((i) => `  • [${i.path.join('.')}] ${i.message}`)
      .join('\n');
    throw new Error(
      `Vendor data failed validation (${result.error.issues.length} issue(s)):\n${issues}`,
    );
  }
  return result.data as VendorItem[];
}
