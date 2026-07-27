import type { VendorItem } from '../domain/types';
import { DEFAULT_MODIFIERS, PriceModifiers } from '../config/modifiers';
import { formatKzt } from '../domain/money';

export interface CostContext {
  guest_count: number;
  duration_hours: number;
  /** ISO yyyy-mm-dd */
  date: string;
  /** 0..23, default 12 */
  start_hour: number;
  modifiers: PriceModifiers;
}

export interface CostResult {
  /** integer KZT before modifiers */
  base: number;
  /** combined multiplier applied (1.0 = none) */
  multiplier: number;
  /** integer KZT after modifiers, rounded */
  total: number;
  /** human-readable, e.g. "8 500 ₸ × 100 guests = 850 000 ₸ ×1.15 (weekend)" */
  breakdown: string;
  applied_modifiers: string[];
}

export function makeCostContext(partial: {
  guest_count: number;
  duration_hours: number;
  date: string;
  start_hour?: number;
  modifiers?: PriceModifiers;
}): CostContext {
  return {
    guest_count: partial.guest_count,
    duration_hours: partial.duration_hours,
    date: partial.date,
    start_hour: partial.start_hour ?? 12,
    modifiers: partial.modifiers ?? DEFAULT_MODIFIERS,
  };
}

function daysFor(ctx: CostContext): number {
  return Math.max(1, Math.ceil(ctx.duration_hours / ctx.modifiers.hours_per_day));
}

/** Billable persons for per-person models: at least the catering min_order. */
function billablePersons(item: VendorItem, ctx: CostContext): number {
  return Math.max(ctx.guest_count, item.min_order ?? 0);
}

/** Base cost (before modifiers) plus the units string for the breakdown. */
function baseCost(
  item: VendorItem,
  ctx: CostContext,
): { base: number; units: string } {
  const p = item.price_kzt;
  switch (item.price_model) {
    case 'flat':
      return { base: p, units: `${formatKzt(p)}` };
    case 'per_hour':
      return {
        base: p * ctx.duration_hours,
        units: `${formatKzt(p)} × ${ctx.duration_hours} h`,
      };
    case 'per_day': {
      const d = daysFor(ctx);
      return { base: p * d, units: `${formatKzt(p)} × ${d} day${d > 1 ? 's' : ''}` };
    }
    case 'per_person': {
      const n = billablePersons(item, ctx);
      return { base: p * n, units: `${formatKzt(p)} × ${n} guests` };
    }
    case 'per_person_per_day': {
      const n = billablePersons(item, ctx);
      const d = daysFor(ctx);
      return {
        base: p * n * d,
        units: `${formatKzt(p)} × ${n} guests × ${d} day${d > 1 ? 's' : ''}`,
      };
    }
  }
}

/** Which modifiers apply for this context. Applied uniformly to all categories. */
export function activeMultiplier(ctx: CostContext): {
  multiplier: number;
  labels: string[];
} {
  const m = ctx.modifiers;
  let mult = 1;
  const labels: string[] = [];

  const day = new Date(`${ctx.date}T00:00:00`).getDay();
  if (m.weekend_days.includes(day)) {
    mult *= m.weekend_multiplier;
    labels.push('weekend');
  }

  const month = Number(ctx.date.slice(5, 7)); // 1-based
  if (m.high_season_months.includes(month)) {
    mult *= m.high_season_multiplier;
    labels.push('high season');
  }

  if (ctx.start_hour >= m.evening_start_hour) {
    mult *= m.evening_multiplier;
    labels.push('evening');
  }

  return { multiplier: mult, labels };
}

/** Pure cost function. Same item + context → same integer total, always. */
export function computeCost(item: VendorItem, ctx: CostContext): CostResult {
  const { base, units } = baseCost(item, ctx);
  const { multiplier, labels } = activeMultiplier(ctx);
  const total = Math.round(base * multiplier);

  let breakdown = `${units}`;
  if (item.price_model !== 'flat') breakdown += ` = ${formatKzt(base)}`;
  if (labels.length > 0) {
    breakdown += ` ×${multiplier.toFixed(2)} (${labels.join(', ')}) = ${formatKzt(total)}`;
  } else if (item.price_model === 'flat') {
    breakdown = `${formatKzt(total)}`;
  }

  return { base, multiplier, total, breakdown, applied_modifiers: labels };
}
