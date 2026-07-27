import type { PlanRequest, VendorItem } from '../domain/types';
import { DEFAULT_WEIGHTS, UtilityWeights } from '../config/modifiers';

/**
 * Hard candidate filter for a single category. Returns items that satisfy the
 * inviolable constraints: city, capacity (venue), halal, vegetarian, min_rating.
 * `must_have_tags` and `district` are treated as SOFT (utility) preferences.
 */
export function candidatesFor(
  items: VendorItem[],
  req: PlanRequest,
): VendorItem[] {
  const p = req.preferences;
  return items.filter((it) => {
    if (it.city !== req.city) return false;

    if (it.category === 'venue') {
      if (it.capacity_max < req.guest_count) return false;
      if (it.capacity_min > req.guest_count) return false;
    }

    if (it.category === 'catering') {
      if (p.halal && it.halal !== true) return false;
      if (p.vegetarian && !it.tags.includes('vegetarian')) return false;
    }

    if (p.min_rating != null && it.rating < p.min_rating) return false;

    return true;
  });
}

/** Capacity-fit score in [0,1]. Rewards halls sized close to the guest count. */
export function capacityFit(item: VendorItem, guestCount: number): number {
  if (item.category !== 'venue' || item.capacity_max <= 0) return 1;
  const fit = guestCount / item.capacity_max; // 1 = perfectly sized, →0 = oversized
  return Math.max(0, Math.min(1, fit));
}

/** Soft preference score in [0,1]: must-have tag coverage + district bonus. */
export function preferenceScore(item: VendorItem, req: PlanRequest): number {
  const must = req.preferences.must_have_tags ?? [];
  let tagScore: number;
  if (must.length === 0) {
    tagScore = 0.5; // neutral when nothing requested
  } else {
    const matched = must.filter((t) => item.tags.includes(t)).length;
    tagScore = matched / must.length;
  }

  const districtBonus =
    req.preferences.district && item.district === req.preferences.district
      ? 0.25
      : 0;

  return Math.max(0, Math.min(1, tagScore + districtBonus));
}

export function normalizeWeights(w: UtilityWeights): UtilityWeights {
  const sum = w.rating + w.preference + w.capacity_fit || 1;
  return {
    rating: w.rating / sum,
    preference: w.preference / sum,
    capacity_fit: w.capacity_fit / sum,
  };
}

/** utility = w_rating·(rating/5) + w_pref·prefScore + w_capfit·fitScore, in [0,1]. */
export function utility(
  item: VendorItem,
  req: PlanRequest,
  weights: UtilityWeights = DEFAULT_WEIGHTS,
): number {
  const w = normalizeWeights(weights);
  return (
    w.rating * (item.rating / 5) +
    w.preference * preferenceScore(item, req) +
    w.capacity_fit * capacityFit(item, req.guest_count)
  );
}
