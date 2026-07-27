import type { Category, VendorItem } from '../domain/types';
import type { VendorRepository } from './VendorRepository';
import { parseVendors } from '../domain/schema';
import rawVendors from './vendors.json';

/**
 * In-memory JSON-backed repository. Validates every row with zod at construction
 * time and fails loudly on a bad row. To move to Postgres later, implement
 * `VendorRepository` against the DB — nothing else in the app changes.
 */
export class JsonVendorRepository implements VendorRepository {
  private readonly items: VendorItem[];
  private readonly byIdMap: Map<string, VendorItem>;

  constructor(raw: unknown = rawVendors) {
    this.items = parseVendors(raw);
    this.byIdMap = new Map(this.items.map((i) => [i.id, i]));
    if (this.byIdMap.size !== this.items.length) {
      throw new Error('Vendor data contains duplicate ids');
    }
  }

  all(): VendorItem[] {
    return this.items;
  }

  byId(id: string): VendorItem | undefined {
    return this.byIdMap.get(id);
  }

  byCategory(category: Category, city?: string): VendorItem[] {
    return this.items.filter(
      (i) => i.category === category && (city == null || i.city === city),
    );
  }

  cities(): string[] {
    return Array.from(new Set(this.items.map((i) => i.city))).sort();
  }

  districts(city: string): string[] {
    return Array.from(
      new Set(this.items.filter((i) => i.city === city).map((i) => i.district)),
    ).sort();
  }
}

/** Shared singleton for the UI. */
export const vendorRepository = new JsonVendorRepository();
