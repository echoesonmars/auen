import type { Category, EventType } from '../domain/types';

/**
 * Budget-envelope templates per event type. Values are fractions that (with
 * `reserve`) sum to 1.0. `reserve` is a soft, unallocated cushion inside the
 * spendable budget — distinct from the hard `contingency_pct` reserved off the
 * top of the total budget (see optimizer). Editable in the UI.
 */
export type EnvelopeTemplate = Partial<Record<Category | 'reserve', number>>;

export const ENVELOPE_TEMPLATES: Record<EventType, EnvelopeTemplate> = {
  wedding: {
    venue: 0.25,
    catering: 0.4,
    staff: 0.15,
    decor: 0.1,
    equipment: 0.05,
    reserve: 0.05,
  },
  conference: {
    venue: 0.3,
    catering: 0.3,
    equipment: 0.2,
    staff: 0.1,
    logistics: 0.05,
    reserve: 0.05,
  },
  birthday: {
    venue: 0.3,
    catering: 0.35,
    staff: 0.15,
    decor: 0.1,
    equipment: 0.05,
    reserve: 0.05,
  },
  corporate_party: {
    venue: 0.28,
    catering: 0.32,
    staff: 0.15,
    equipment: 0.12,
    decor: 0.08,
    reserve: 0.05,
  },
  seminar: {
    venue: 0.35,
    catering: 0.25,
    equipment: 0.2,
    staff: 0.1,
    logistics: 0.05,
    reserve: 0.05,
  },
  kids_party: {
    venue: 0.25,
    catering: 0.3,
    staff: 0.15,
    decor: 0.15,
    equipment: 0.1,
    reserve: 0.05,
  },
};

export const DEFAULT_CONTINGENCY_PCT = 0.07;
