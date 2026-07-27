import { describe, it, expect } from 'vitest';
import { computeCost, makeCostContext, activeMultiplier } from './costEngine';
import type { VendorItem } from '../domain/types';

function item(partial: Partial<VendorItem>): VendorItem {
  return {
    id: 'x',
    city: 'Astana',
    district: 'Esil',
    name: 'Test',
    category: 'venue',
    price_model: 'flat',
    price_kzt: 100000,
    rating: 4.5,
    capacity_min: 0,
    capacity_max: 1000,
    tags: [],
    contact: '',
    notes: '',
    source: 'synthetic',
    verified: false,
    ...partial,
  };
}

// A weekday, non-high-season, daytime context: no modifiers.
const plainCtx = makeCostContext({
  guest_count: 100,
  duration_hours: 8,
  date: '2025-10-15', // Wednesday, October (not high season)
  start_hour: 12,
});

describe('cost engine — price models', () => {
  it('flat', () => {
    const r = computeCost(item({ price_model: 'flat', price_kzt: 250000 }), plainCtx);
    expect(r.total).toBe(250000);
  });

  it('per_hour', () => {
    const r = computeCost(
      item({ price_model: 'per_hour', price_kzt: 4000 }),
      plainCtx,
    );
    expect(r.total).toBe(4000 * 8);
  });

  it('per_day rounds up partial days', () => {
    const r = computeCost(
      item({ price_model: 'per_day', price_kzt: 300000 }),
      makeCostContext({ guest_count: 100, duration_hours: 8, date: '2025-10-15' }),
    );
    expect(r.total).toBe(300000); // 8h -> 1 day
    const r2 = computeCost(
      item({ price_model: 'per_day', price_kzt: 300000 }),
      makeCostContext({ guest_count: 100, duration_hours: 15, date: '2025-10-15' }),
    );
    expect(r2.total).toBe(600000); // 15h -> 2 days (12h/day)
  });

  it('per_person', () => {
    const r = computeCost(
      item({ price_model: 'per_person', price_kzt: 8500 }),
      plainCtx,
    );
    expect(r.total).toBe(8500 * 100);
  });

  it('per_person honours min_order', () => {
    const r = computeCost(
      item({ price_model: 'per_person', price_kzt: 5000, min_order: 150 }),
      plainCtx,
    );
    expect(r.total).toBe(5000 * 150);
  });

  it('per_person_per_day', () => {
    const r = computeCost(
      item({ price_model: 'per_person_per_day', price_kzt: 1000 }),
      makeCostContext({ guest_count: 100, duration_hours: 15, date: '2025-10-15' }),
    );
    expect(r.total).toBe(1000 * 100 * 2);
  });
});

describe('cost engine — modifiers', () => {
  it('weekend ×1.15 (Saturday)', () => {
    const ctx = makeCostContext({ guest_count: 1, duration_hours: 8, date: '2025-10-18' }); // Sat
    const { multiplier, labels } = activeMultiplier(ctx);
    expect(multiplier).toBeCloseTo(1.15);
    expect(labels).toContain('weekend');
  });

  it('high season ×1.10 (September)', () => {
    const ctx = makeCostContext({ guest_count: 1, duration_hours: 8, date: '2025-09-10' }); // Wed
    const { multiplier, labels } = activeMultiplier(ctx);
    expect(multiplier).toBeCloseTo(1.1);
    expect(labels).toContain('high season');
  });

  it('evening ×1.10 (after 18:00)', () => {
    const ctx = makeCostContext({
      guest_count: 1,
      duration_hours: 4,
      date: '2025-10-15',
      start_hour: 19,
    });
    const { multiplier, labels } = activeMultiplier(ctx);
    expect(multiplier).toBeCloseTo(1.1);
    expect(labels).toContain('evening');
  });

  it('stacks multiplicatively (weekend + high season + evening)', () => {
    const ctx = makeCostContext({
      guest_count: 1,
      duration_hours: 4,
      date: '2025-09-13', // Saturday, September
      start_hour: 20,
    });
    const { multiplier } = activeMultiplier(ctx);
    expect(multiplier).toBeCloseTo(1.15 * 1.1 * 1.1, 5);
    const r = computeCost(item({ price_model: 'flat', price_kzt: 100000 }), ctx);
    expect(r.total).toBe(Math.round(100000 * 1.15 * 1.1 * 1.1));
  });
});
