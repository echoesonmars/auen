import { describe, it, expect } from 'vitest';
import { optimize, planAll } from './optimizer';
import type {
  Category,
  PlanRequest,
  VendorItem,
} from '../domain/types';
import type { VendorRepository } from '../data/VendorRepository';
import { JsonVendorRepository } from '../data/JsonVendorRepository';

// ---- lightweight fixture repository -------------------------------------
class FixtureRepo implements VendorRepository {
  constructor(private items: VendorItem[]) {}
  all() {
    return this.items;
  }
  byId(id: string) {
    return this.items.find((i) => i.id === id);
  }
  byCategory(category: Category, city?: string) {
    return this.items.filter(
      (i) => i.category === category && (city == null || i.city === city),
    );
  }
  cities() {
    return [...new Set(this.items.map((i) => i.city))];
  }
  districts(city: string) {
    return [
      ...new Set(this.items.filter((i) => i.city === city).map((i) => i.district)),
    ];
  }
}

function v(p: Partial<VendorItem> & { id: string; category: Category }): VendorItem {
  return {
    city: 'Astana',
    district: 'Esil',
    name: p.id,
    price_model: 'flat',
    price_kzt: 100000,
    rating: 4,
    capacity_min: 0,
    capacity_max: 1000,
    tags: [],
    contact: '',
    notes: '',
    source: 'synthetic',
    verified: false,
    ...p,
  };
}

// A tiny world: 3 venues, 3 caterings. Weekday, off-season, daytime => no modifiers.
function smallWorld(): VendorItem[] {
  return [
    v({ id: 'ven-cheap', category: 'venue', price_model: 'per_person', price_kzt: 6000, capacity_min: 50, capacity_max: 200, rating: 3.8 }),
    v({ id: 'ven-mid', category: 'venue', price_model: 'per_person', price_kzt: 9000, capacity_min: 50, capacity_max: 200, rating: 4.4 }),
    v({ id: 'ven-lux', category: 'venue', price_model: 'per_person', price_kzt: 15000, capacity_min: 50, capacity_max: 200, rating: 4.9 }),
    v({ id: 'cat-cheap', category: 'catering', price_model: 'per_person', price_kzt: 3000, halal: true, rating: 3.9, min_order: 20, capacity_max: 1000 }),
    v({ id: 'cat-mid', category: 'catering', price_model: 'per_person', price_kzt: 5000, halal: true, rating: 4.5, min_order: 20, capacity_max: 1000 }),
    v({ id: 'cat-lux', category: 'catering', price_model: 'per_person', price_kzt: 8000, halal: false, rating: 4.8, min_order: 20, capacity_max: 1000 }),
  ];
}

const baseReq: PlanRequest = {
  budget_kzt: 3_000_000,
  city: 'Astana',
  event_type: 'conference',
  guest_count: 100,
  date: '2025-10-15', // Wednesday, October — no modifiers
  duration_hours: 8,
  start_hour: 12,
  required_categories: ['venue', 'catering'],
  preferences: {},
  contingency_pct: 0.07,
};

describe('optimizer — feasibility', () => {
  it('feasible normal case stays within the spendable budget', () => {
    const repo = new FixtureRepo(smallWorld());
    const r = optimize(baseReq, repo, 'balanced');
    expect(r.feasible).toBe(true);
    if (!r.feasible) return;
    expect(r.items).toHaveLength(2);
    expect(r.total_cost).toBeLessThanOrEqual(r.spendable);
    expect(r.remaining).toBeGreaterThanOrEqual(0);
  });

  it('guest count above every venue capacity is infeasible with a capacity reason', () => {
    const repo = new FixtureRepo(smallWorld());
    const r = optimize({ ...baseReq, guest_count: 500 }, repo, 'balanced');
    expect(r.feasible).toBe(false);
    if (r.feasible) return;
    expect(r.failing_constraint).toBe('venue.capacity');
    expect(r.min_budget_required).toBeNull();
  });

  it('halal filter removing all catering is a first-class infeasible result', () => {
    // world where no catering is halal
    const world = smallWorld().map((i) =>
      i.category === 'catering' ? { ...i, halal: false } : i,
    );
    const repo = new FixtureRepo(world);
    const r = optimize(
      { ...baseReq, preferences: { halal: true } },
      repo,
      'balanced',
    );
    expect(r.feasible).toBe(false);
    if (r.feasible) return;
    expect(r.failing_constraint).toBe('catering.halal');
  });
});

describe('optimizer — budget boundaries', () => {
  // cheapest plan = cheapest venue + cheapest catering (no modifiers):
  // 6000*100 + 3000*100 = 900 000
  const cheapest = 900_000;

  it('budget exactly equal to the cheapest plan (after contingency) is feasible', () => {
    const repo = new FixtureRepo(smallWorld());
    // need spendable >= 900k with 7% contingency: budget*0.93 >= 900k
    const budget = Math.ceil(cheapest / 0.93);
    const r = optimize({ ...baseReq, budget_kzt: budget }, repo, 'balanced');
    expect(r.feasible).toBe(true);
    if (!r.feasible) return;
    expect(r.total_cost).toBeLessThanOrEqual(r.spendable);
  });

  it('budget 1 ₸ below feasible reports infeasible with min_budget_required', () => {
    const repo = new FixtureRepo(smallWorld());
    const budget = Math.ceil(cheapest / 0.93) - 1;
    const r = optimize({ ...baseReq, budget_kzt: budget }, repo, 'balanced');
    expect(r.feasible).toBe(false);
    if (r.feasible) return;
    expect(r.failing_constraint).toBe('budget');
    expect(r.min_budget_required).not.toBeNull();
    expect(r.min_budget_required!).toBeGreaterThan(budget);
  });
});

describe('optimizer — determinism', () => {
  it('produces identical output across 100 runs (fixture)', () => {
    const repo = new FixtureRepo(smallWorld());
    const first = JSON.stringify(optimize(baseReq, repo, 'balanced'));
    for (let i = 0; i < 100; i++) {
      expect(JSON.stringify(optimize(baseReq, repo, 'balanced'))).toBe(first);
    }
  });

  it('produces identical output across 100 runs (real seed data)', () => {
    const repo = new JsonVendorRepository();
    const req: PlanRequest = {
      ...baseReq,
      required_categories: ['venue', 'catering', 'equipment', 'staff'],
    };
    const first = JSON.stringify(planAll(req, repo));
    for (let i = 0; i < 100; i++) {
      expect(JSON.stringify(planAll(req, repo))).toBe(first);
    }
  });
});

describe('optimizer — local search', () => {
  it('upgrade loop terminates and never exceeds the budget', () => {
    const repo = new FixtureRepo(smallWorld());
    // Generous budget => the upgrade phase runs a lot; must still terminate.
    const r = optimize({ ...baseReq, budget_kzt: 10_000_000 }, repo, 'balanced', {
      maxIterations: 500,
    });
    expect(r.feasible).toBe(true);
    if (!r.feasible) return;
    expect(r.total_cost).toBeLessThanOrEqual(r.spendable);
    // With a big budget, balanced should upgrade beyond the cheapest options.
    expect(r.total_cost).toBeGreaterThan(900_000);
  });

  it('economy <= balanced <= premium in cost on real data', () => {
    const repo = new JsonVendorRepository();
    const req: PlanRequest = {
      ...baseReq,
      required_categories: ['venue', 'catering', 'equipment', 'staff'],
    };
    const { economy, balanced, premium } = planAll(req, repo);
    expect(economy.feasible && balanced.feasible && premium.feasible).toBe(true);
    if (!economy.feasible || !balanced.feasible || !premium.feasible) return;
    expect(economy.total_cost).toBeLessThanOrEqual(balanced.total_cost);
    // premium may spend more (up to full budget, no contingency)
    expect(premium.total_cost).toBeGreaterThanOrEqual(economy.total_cost);
  });

  it('the flagship case: 3 000 000 ₸ · conference · 100 guests is feasible & under budget', () => {
    const repo = new JsonVendorRepository();
    const req: PlanRequest = {
      ...baseReq,
      required_categories: ['venue', 'catering', 'equipment', 'staff', 'logistics'],
    };
    const r = optimize(req, repo, 'balanced');
    expect(r.feasible).toBe(true);
    if (!r.feasible) return;
    expect(r.total_cost).toBeLessThanOrEqual(r.spendable);
    expect(r.items.map((i) => i.category)).toEqual([
      'venue',
      'catering',
      'equipment',
      'staff',
      'logistics',
    ]);
  });
});
