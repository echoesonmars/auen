import type {
  Category,
  PlanBundle,
  PlanItem,
  PlanMode,
  PlanRequest,
  PlanResult,
  VendorItem,
} from '../domain/types';
import type { VendorRepository } from '../data/VendorRepository';
import { ENVELOPE_TEMPLATES } from '../config/envelopes';
import {
  DEFAULT_MODIFIERS,
  DEFAULT_WEIGHTS,
  PriceModifiers,
  UtilityWeights,
} from '../config/modifiers';
import { computeCost, CostContext, makeCostContext } from '../cost/costEngine';
import { candidatesFor, utility } from './utility';
import { formatKzt } from '../domain/money';

export interface OptimizeOptions {
  weights?: UtilityWeights;
  modifiers?: PriceModifiers;
  /** hard iteration cap for the local-search loop; guarantees termination */
  maxIterations?: number;
}

interface Candidate {
  item: VendorItem;
  cost: number;
  utility: number;
  breakdown: string;
}

const MODE_ORDER: PlanMode[] = ['economy', 'balanced', 'premium'];

// ---------------------------------------------------------------------------
// Deterministic ordering helpers
// ---------------------------------------------------------------------------

/** Best-first: highest utility, then cheapest, then id. Fully deterministic. */
function byUtilityDesc(a: Candidate, b: Candidate): number {
  if (b.utility !== a.utility) return b.utility - a.utility;
  if (a.cost !== b.cost) return a.cost - b.cost;
  return a.item.id < b.item.id ? -1 : 1;
}

/** Cheapest-first, then highest utility, then id. */
function byCostAsc(a: Candidate, b: Candidate): number {
  if (a.cost !== b.cost) return a.cost - b.cost;
  if (b.utility !== a.utility) return b.utility - a.utility;
  return a.item.id < b.item.id ? -1 : 1;
}

// ---------------------------------------------------------------------------
// Candidate building
// ---------------------------------------------------------------------------

function buildCandidates(
  category: Category,
  req: PlanRequest,
  repo: VendorRepository,
  ctx: CostContext,
  weights: UtilityWeights,
): Candidate[] {
  const raw = candidatesFor(repo.byCategory(category, req.city), req);
  return raw
    .map((item) => {
      const c = computeCost(item, ctx);
      return {
        item,
        cost: c.total,
        utility: utility(item, req, weights),
        breakdown: c.breakdown,
      };
    })
    .sort(byUtilityDesc);
}

// ---------------------------------------------------------------------------
// Envelope allocation (stage 1)
// ---------------------------------------------------------------------------

function allocateEnvelopes(
  req: PlanRequest,
  spendable: number,
): Partial<Record<Category, number>> {
  const template = ENVELOPE_TEMPLATES[req.event_type];
  const cats = req.required_categories;
  // Renormalize template weights over ONLY the required categories.
  let weightSum = 0;
  for (const c of cats) weightSum += template[c] ?? 0;
  const env: Partial<Record<Category, number>> = {};
  if (weightSum <= 0) {
    // No template weight for these categories: split evenly.
    for (const c of cats) env[c] = Math.floor(spendable / cats.length);
    return env;
  }
  for (const c of cats) {
    const w = (template[c] ?? 0) / weightSum;
    env[c] = Math.floor(spendable * w);
  }
  return env;
}

// ---------------------------------------------------------------------------
// Reason strings (stage 4 helper)
// ---------------------------------------------------------------------------

function reasonFor(
  cand: Candidate,
  category: Category,
  envelope: number | undefined,
  squeezed: boolean,
  mode: PlanMode,
): string {
  const it = cand.item;
  const where = it.district ? ` in ${it.district}` : '';
  const rating = `${it.rating.toFixed(1)}★`;
  if (squeezed) {
    return `Cheapest feasible ${category}${where} (${rating}) — the ${
      envelope != null ? formatKzt(envelope) : 'category'
    } envelope was too small for a better option.`;
  }
  if (mode === 'economy') {
    return `Lowest-cost feasible ${category}${where} (${rating}) at ${formatKzt(cand.cost)}.`;
  }
  if (mode === 'premium') {
    return `Top-utility ${category}${where} (${rating}) — maximised quality within budget at ${formatKzt(cand.cost)}.`;
  }
  const envStr = envelope != null ? ` within the ${formatKzt(envelope)} envelope` : '';
  return `Best value ${category}${where} (${rating})${envStr} at ${formatKzt(cand.cost)}.`;
}

// ---------------------------------------------------------------------------
// Core optimizer
// ---------------------------------------------------------------------------

interface Selection {
  category: Category;
  candidates: Candidate[];
  chosen: number; // index into candidates
  envelope?: number;
  squeezed: boolean;
}

function totalCost(sels: Selection[]): number {
  return sels.reduce((s, sel) => s + sel.candidates[sel.chosen].cost, 0);
}

function totalUtility(sels: Selection[]): number {
  return sels.reduce((s, sel) => s + sel.candidates[sel.chosen].utility, 0);
}

export function optimize(
  req: PlanRequest,
  repo: VendorRepository,
  mode: PlanMode = 'balanced',
  opts: OptimizeOptions = {},
): PlanResult {
  const weights = opts.weights ?? DEFAULT_WEIGHTS;
  const modifiers = opts.modifiers ?? DEFAULT_MODIFIERS;
  const maxIter = opts.maxIterations ?? 500;
  const ctx = makeCostContext({
    guest_count: req.guest_count,
    duration_hours: req.duration_hours,
    date: req.date,
    start_hour: req.start_hour,
    modifiers,
  });

  // Premium ignores contingency and spends up to the full budget.
  const contingencyPct = mode === 'premium' ? 0 : req.contingency_pct;
  const contingencyReserve = Math.round(req.budget_kzt * contingencyPct);
  const spendable = req.budget_kzt - contingencyReserve;

  // ---- Build candidate sets & detect data-level infeasibility ----
  const selections: Selection[] = [];
  for (const category of req.required_categories) {
    const cands = buildCandidates(category, req, repo, ctx, weights);
    if (cands.length === 0) {
      return dataInfeasible(category, req, repo, ctx);
    }
    selections.push({ category, candidates: cands, chosen: 0, squeezed: false });
  }

  // Minimum achievable total (cheapest feasible per category).
  const minTotal = selections.reduce(
    (s, sel) => s + Math.min(...sel.candidates.map((c) => c.cost)),
    0,
  );
  if (minTotal > spendable) {
    // Budget too low: report the minimum feasible budget.
    const minBudget = Math.ceil(minTotal / (1 - contingencyPct));
    return {
      feasible: false,
      mode,
      failing_constraint: 'budget',
      reason: `The cheapest feasible plan costs ${formatKzt(
        minTotal,
      )}, but only ${formatKzt(spendable)} is spendable after the ${Math.round(
        contingencyPct * 100,
      )}% contingency reserve.`,
      min_budget_required: minBudget,
    };
  }

  const envelopes = allocateEnvelopes(req, spendable);

  // ---- Stage 2: greedy seed ----
  for (const sel of selections) {
    seedSelection(sel, mode, envelopes[sel.category]);
  }

  // ---- Stage 3: local search / repair ----
  localSearch(selections, spendable, mode, maxIter);

  // ---- Stage 4: package ----
  const items: PlanItem[] = selections.map((sel) => {
    const cand = sel.candidates[sel.chosen];
    return {
      category: sel.category,
      item: cand.item,
      cost: cand.cost,
      breakdown: cand.breakdown,
      utility: cand.utility,
      squeezed: sel.squeezed,
      reason: reasonFor(cand, sel.category, sel.envelope, sel.squeezed, mode),
    };
  });

  const total = totalCost(selections);
  return {
    feasible: true,
    mode,
    items,
    total_cost: total,
    contingency_reserve: contingencyReserve,
    spendable,
    remaining: spendable - total,
    budget: req.budget_kzt,
    utility_total: totalUtility(selections),
    envelopes,
  };
}

// ---------------------------------------------------------------------------
// Stage 2: seeding
// ---------------------------------------------------------------------------

function seedSelection(
  sel: Selection,
  mode: PlanMode,
  envelope: number | undefined,
): void {
  sel.envelope = envelope;
  const cands = sel.candidates;

  if (mode === 'economy') {
    // cheapest feasible
    sel.chosen = argmin(cands, (c) => c.cost);
    sel.squeezed = false;
    return;
  }

  if (mode === 'premium' || envelope == null) {
    // highest utility (candidates already sorted best-first)
    sel.chosen = 0;
    sel.squeezed = false;
    return;
  }

  // balanced: highest utility that fits the envelope; else cheapest → squeezed
  const fitIdx = cands.findIndex((c) => c.cost <= envelope);
  if (fitIdx >= 0) {
    sel.chosen = fitIdx; // first (best utility) that fits
    sel.squeezed = false;
  } else {
    sel.chosen = argmin(cands, (c) => c.cost);
    sel.squeezed = true;
  }
}

// ---------------------------------------------------------------------------
// Stage 3: deterministic local search
// ---------------------------------------------------------------------------

function localSearch(
  sels: Selection[],
  spendable: number,
  mode: PlanMode,
  maxIter: number,
): void {
  let iter = 0;

  // Phase A — repair over-budget: downgrade the item with the smallest utility
  // loss per tenge saved, until we are within budget or cannot downgrade.
  while (totalCost(sels) > spendable && iter < maxIter) {
    iter++;
    let best: { sel: Selection; idx: number; ratio: number } | null = null;
    for (const sel of sels) {
      const cur = sel.candidates[sel.chosen];
      for (let i = 0; i < sel.candidates.length; i++) {
        const c = sel.candidates[i];
        if (c.cost >= cur.cost) continue; // must save money
        const saved = cur.cost - c.cost;
        const utilLoss = Math.max(0, cur.utility - c.utility);
        const ratio = utilLoss / saved; // smaller is better
        if (
          best === null ||
          ratio < best.ratio - 1e-12 ||
          (Math.abs(ratio - best.ratio) <= 1e-12 && preferSwap(sel, i, best))
        ) {
          best = { sel, idx: i, ratio };
        }
      }
    }
    if (best === null) break; // cannot downgrade further
    best.sel.chosen = best.idx;
    // Re-evaluate squeezed flag: within envelope again?
    best.sel.squeezed =
      best.sel.envelope != null &&
      best.sel.candidates[best.sel.chosen].cost > best.sel.envelope;
  }

  // Economy stops here (it only minimizes cost).
  if (mode === 'economy') return;

  // Phase B — spend slack: upgrade the item with the largest utility gain per
  // tenge spent, provided the swap keeps us within budget and improves utility.
  while (iter < maxIter) {
    iter++;
    const slack = spendable - totalCost(sels);
    let best: { sel: Selection; idx: number; ratio: number } | null = null;
    for (const sel of sels) {
      const cur = sel.candidates[sel.chosen];
      for (let i = 0; i < sel.candidates.length; i++) {
        const c = sel.candidates[i];
        const extra = c.cost - cur.cost;
        if (extra <= 0) continue; // must be an upgrade in cost
        if (extra > slack) continue; // must still fit
        const utilGain = c.utility - cur.utility;
        if (utilGain <= 0) continue; // must improve the objective
        const ratio = utilGain / extra; // larger is better
        if (
          best === null ||
          ratio > best.ratio + 1e-12 ||
          (Math.abs(ratio - best.ratio) <= 1e-12 && preferSwap(sel, i, best))
        ) {
          best = { sel, idx: i, ratio };
        }
      }
    }
    if (best === null) break; // no improving upgrade fits
    best.sel.chosen = best.idx;
    best.sel.squeezed =
      best.sel.envelope != null &&
      best.sel.candidates[best.sel.chosen].cost > best.sel.envelope
        ? false // upgrading past envelope is fine; not a squeeze
        : best.sel.squeezed;
  }
}

/** Deterministic tie-break between two equally-good swaps. */
function preferSwap(
  sel: Selection,
  idx: number,
  best: { sel: Selection; idx: number },
): boolean {
  const a = sel.candidates[idx].item.id;
  const b = best.sel.candidates[best.idx].item.id;
  return a < b;
}

function argmin<T>(arr: T[], f: (x: T) => number): number {
  let bi = 0;
  let bv = Infinity;
  for (let i = 0; i < arr.length; i++) {
    const v = f(arr[i]);
    if (v < bv) {
      bv = v;
      bi = i;
    }
  }
  return bi;
}

// ---------------------------------------------------------------------------
// Data-level infeasibility (no candidate can ever satisfy hard constraints)
// ---------------------------------------------------------------------------

function dataInfeasible(
  category: Category,
  req: PlanRequest,
  repo: VendorRepository,
  ctx: CostContext,
): PlanResult {
  const inCity = repo.byCategory(category, req.city);

  if (category === 'venue') {
    const maxSeat = inCity.reduce((m, v) => Math.max(m, v.capacity_max), 0);
    if (maxSeat < req.guest_count) {
      return {
        feasible: false,
        mode: 'balanced',
        failing_constraint: 'venue.capacity',
        reason: `No venue in ${req.city} seats ${req.guest_count} guests (largest available seats ${maxSeat}). Add a larger venue.`,
        min_budget_required: null,
      };
    }
  }

  if (category === 'catering' && req.preferences.halal) {
    const anyHalal = inCity.some((v) => v.halal === true);
    if (!anyHalal) {
      return {
        feasible: false,
        mode: 'balanced',
        failing_constraint: 'catering.halal',
        reason: `No halal catering is available in ${req.city}. Turn off the halal filter or add a halal caterer.`,
        min_budget_required: null,
      };
    }
  }

  void ctx;
  return {
    feasible: false,
    mode: 'balanced',
    failing_constraint: `${category}.none`,
    reason: `No ${category} option in ${req.city} satisfies the current filters (rating / dietary / district).`,
    min_budget_required: null,
  };
}

// ---------------------------------------------------------------------------
// Three variants
// ---------------------------------------------------------------------------

export function planAll(
  req: PlanRequest,
  repo: VendorRepository,
  opts: OptimizeOptions = {},
): PlanBundle {
  const [economy, balanced, premium] = MODE_ORDER.map((m) =>
    optimize(req, repo, m, opts),
  );
  return { economy, balanced, premium };
}
