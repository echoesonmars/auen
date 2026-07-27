// Price modifiers and utility weights. Stored as config, NOT baked into the
// seeded prices, so the cost engine applies them at planning time.

export interface PriceModifiers {
  weekend_multiplier: number;
  high_season_multiplier: number;
  evening_multiplier: number;
  /** JS getDay() values counted as weekend: Fri=5, Sat=6, Sun=0 */
  weekend_days: number[];
  /** 1-based months in high season */
  high_season_months: number[];
  /** events starting at/after this hour get the evening surcharge */
  evening_start_hour: number;
  /** how many event-hours make one "day" for per_day / per_person_per_day */
  hours_per_day: number;
}

export const DEFAULT_MODIFIERS: PriceModifiers = {
  weekend_multiplier: 1.15,
  high_season_multiplier: 1.1,
  evening_multiplier: 1.1,
  weekend_days: [5, 6, 0], // Fri, Sat, Sun
  high_season_months: [5, 6, 9, 12], // May, June, September, December
  evening_start_hour: 18,
  hours_per_day: 12,
};

export interface UtilityWeights {
  rating: number;
  preference: number;
  capacity_fit: number;
}

/** Defaults documented in README. Must be > 0 and are normalized internally. */
export const DEFAULT_WEIGHTS: UtilityWeights = {
  rating: 0.5,
  preference: 0.3,
  capacity_fit: 0.2,
};
