import type { Category, VendorItem } from '../domain/types';

/**
 * Data-access boundary. The optimizer and UI depend only on this interface, so
 * swapping the JSON implementation for Postgres later touches one file.
 */
export interface VendorRepository {
  all(): VendorItem[];
  byId(id: string): VendorItem | undefined;
  byCategory(category: Category, city?: string): VendorItem[];
  cities(): string[];
  districts(city: string): string[];
}
