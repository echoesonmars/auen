// Core domain types. Money is always an integer number of KZT (tenge has no
// commonly-used subunit for this domain). `city` is a first-class field on
// every record so adding Almaty/Shymkent/Turkistan later means adding rows.

export type Category =
  | 'venue'
  | 'catering'
  | 'staff'
  | 'equipment'
  | 'decor'
  | 'logistics';

export const CATEGORIES: Category[] = [
  'venue',
  'catering',
  'staff',
  'equipment',
  'decor',
  'logistics',
];

export type PriceModel =
  | 'flat'
  | 'per_hour'
  | 'per_day'
  | 'per_person'
  | 'per_person_per_day';

export type EventType =
  | 'wedding'
  | 'conference'
  | 'birthday'
  | 'corporate_party'
  | 'seminar'
  | 'kids_party';

export const EVENT_TYPES: EventType[] = [
  'wedding',
  'conference',
  'birthday',
  'corporate_party',
  'seminar',
  'kids_party',
];

/**
 * A single vendor offering. Shared base fields plus optional category-specific
 * fields. We keep a single flat shape (rather than a discriminated union) so the
 * repository, zod schema and CSV import stay uniform; category-specific fields
 * are simply optional and validated per-category.
 */
export interface VendorItem {
  id: string;
  city: string;
  district: string;
  name: string;
  category: Category;
  price_model: PriceModel;
  /** integer KZT */
  price_kzt: number;
  /** 1..5 */
  rating: number;
  capacity_min: number;
  capacity_max: number;
  tags: string[];
  contact: string;
  notes: string;
  source: string;
  verified: boolean;

  // ---- category-specific (all optional) ----
  /** venue: what the hall already includes (sound, tables, projector, ...) */
  includes?: string[];
  /** catering: minimum billable persons */
  min_order?: number;
  /** catering */
  cuisine?: string;
  /** catering */
  halal?: boolean;
  /** staff */
  role?: string;
}

export interface Preferences {
  district?: string;
  halal?: boolean;
  vegetarian?: boolean;
  min_rating?: number;
  must_have_tags?: string[];
}

export interface PlanRequest {
  budget_kzt: number;
  city: string;
  event_type: EventType;
  guest_count: number;
  /** ISO date, yyyy-mm-dd */
  date: string;
  duration_hours: number;
  /** 0..23, event start hour (drives the evening surcharge). Default 12. */
  start_hour?: number;
  required_categories: Category[];
  preferences: Preferences;
  /** fraction 0..1, default 0.07 */
  contingency_pct: number;
}

export interface PlanItem {
  category: Category;
  item: VendorItem;
  /** integer KZT, modifiers already applied */
  cost: number;
  /** human-readable price breakdown, e.g. "8 500 ₸ × 100 guests = 850 000 ₸" */
  breakdown: string;
  utility: number;
  /** why this item was chosen */
  reason: string;
  /** true if the category's envelope could not fit any option and we fell back
   *  to the cheapest feasible one */
  squeezed: boolean;
}

export type PlanMode = 'economy' | 'balanced' | 'premium';

export interface FeasiblePlan {
  feasible: true;
  mode: PlanMode;
  items: PlanItem[];
  total_cost: number;
  contingency_reserve: number;
  /** budget - contingency_reserve; the hard spend ceiling */
  spendable: number;
  /** spendable - total_cost */
  remaining: number;
  budget: number;
  utility_total: number;
  envelopes: Partial<Record<Category, number>>;
}

export interface InfeasiblePlan {
  feasible: false;
  mode: PlanMode;
  /** e.g. "venue.capacity" or "budget" */
  failing_constraint: string;
  reason: string;
  /** minimum budget that would make this event feasible, or null if no data
   *  can ever satisfy a hard constraint (e.g. no venue seats the guest count) */
  min_budget_required: number | null;
}

export type PlanResult = FeasiblePlan | InfeasiblePlan;

export interface PlanBundle {
  economy: PlanResult;
  balanced: PlanResult;
  premium: PlanResult;
}
