# Event Budget Planner (Astana)

A deterministic event-budget planner built into the Auen app. Give it a budget
in tenge and an event brief, and it returns a complete, costed plan under
budget — venue, catering, staff, equipment, decor, logistics — every line item
with a real price, a running total, remaining budget, and the reason each item
was chosen. Swap any item for an alternative and the plan recomputes instantly.

- **Page:** `/planner` (linked from the navbar as “Планировщик”).
- **No LLM at runtime.** The planner is a pure, deterministic optimizer — same
  input → same output, always.
- **No API keys, works offline.** All data is bundled JSON.

## How to run

The planner ships inside the Auen Next.js app:

```bash
npm install
npm run dev
```

Open <http://localhost:3000/planner>.

Run the planner test suite (optimizer + cost engine):

```bash
npm test
```

## Architecture

All planner code is pure TypeScript with zero UI imports, under `lib/planner/`:

```
lib/planner/
  domain/      types.ts · money.ts (KZT integer + "3 000 000 ₸") · schema.ts (zod)
  config/      envelopes.ts (budget templates) · modifiers.ts (multipliers, weights)
  cost/        costEngine.ts (+ .test.ts)   — cost(item, ctx) for all price models
  optimizer/   optimizer.ts (+ .test.ts) · utility.ts — the 4-stage optimizer
  data/        VendorRepository.ts (interface) · JsonVendorRepository.ts · vendors.json
  i18n/        ru.ts (default) · kk.ts · en.ts · index.ts
app/planner/page.tsx   — UI, reuses Auen's palette/components
```

- **Money** is always an integer number of KZT. Displayed as `3 000 000 ₸`
  (space thousands separator, symbol after).
- **`city`** is a first-class field on every record, so adding Almaty /
  Shymkent / Turkistan later means adding rows, not refactoring.
- Data access sits behind the **`VendorRepository`** interface. Swapping the
  JSON store for Postgres later touches exactly one file
  (`JsonVendorRepository.ts`).
- All seed rows are validated with **zod at load time** and fail loudly on a bad
  row.

## How the optimizer works

Input: `{ budget_kzt, city, event_type, guest_count, date, duration_hours,
required_categories[], preferences, contingency_pct }`.

**Hard constraints (never violated):** venue capacity brackets the guest count;
every required category is filled; halal respected if requested;
`total_cost ≤ budget − contingency_reserve`.

**Objective:** maximize total utility, where
`utility = w_rating·(rating/5) + w_preference·tagMatch + w_capacity_fit·fit`.
Weights default to `{ rating: 0.5, preference: 0.3, capacity_fit: 0.2 }`
(`lib/planner/config/modifiers.ts`) and are normalized internally.

Four stages (`lib/planner/optimizer/optimizer.ts`):

1. **Envelope allocation** — reserve `contingency_pct` (default 7%) off the top,
   then split the spendable budget across the required categories using the
   event-type template.
2. **Greedy seed** — in each category pick the highest-utility option that fits
   its envelope; if nothing fits, take the cheapest feasible option and mark the
   category *squeezed*.
3. **Local search / repair** — deterministic hill-climb, capped at 500
   iterations:
   - while over budget, downgrade the item with the smallest *utility loss per
     tenge saved*;
   - while under budget, upgrade the item with the largest *utility gain per
     tenge spent*;
   - stop when no swap improves the objective. Ties break by item id, so the
     result is fully deterministic.
4. **Package** — return the plan plus a per-item `reason` string.

**Three variants** are always returned: **Economy** (minimize cost), **Balanced**
(the objective above, default), **Premium** (maximize utility up to 100% of
budget, no contingency).

**Infeasibility is a first-class result, not an error.** If no plan exists, the
result carries the failing constraint and the minimum feasible budget, e.g.
*“The cheapest feasible plan costs 2 340 000 ₸…”* or *“No venue in Astana seats
400 guests…”*.

### Price modifiers

Stored as config (`modifiers.ts`), applied by the cost engine — never baked into
the stored prices:

- weekend (Fri–Sun) ×1.15
- high season (May, Jun, Sep, Dec) ×1.10
- evening (start ≥ 18:00) ×1.10

`per_day` / `per_person_per_day` treat 12 event-hours as one day.

## Tuning the envelope templates

Each event type has a budget-envelope template in
`lib/planner/config/envelopes.ts` — fractions that (with `reserve`) sum to 1.0:

```ts
conference: { venue: 0.30, catering: 0.30, equipment: 0.20,
              staff: 0.10, logistics: 0.05, reserve: 0.05 },
```

Edit these fractions to re-tune how the budget is split. Only the weights of the
*required* categories are used; they are renormalized at plan time, so you don't
have to keep a template summing to exactly 1 for every subset. `reserve` here is
a soft cushion inside the spendable budget; the hard, off-the-top cushion is
`contingency_pct`.

## Adding a vendor

Vendors live in `lib/planner/data/vendors.json`. Each row (validated by
`lib/planner/domain/schema.ts`) needs:

```
id, city, district, name, category, price_model, price_kzt, rating (1–5),
capacity_min, capacity_max, tags[], contact, notes, source, verified
```

`price_model` ∈ `flat | per_hour | per_day | per_person | per_person_per_day`.
Category-specific optional fields: `includes[]` (venue), `min_order`, `cuisine`,
`halal` (catering), `role` (staff).

Two ways to add rows:

- **CSV import** (how real Astana data and future cities get added):

  ```bash
  npm run import-planner-csv -- path/to/vendors.csv          # replace
  npm run import-planner-csv -- path/to/vendors.csv --merge  # upsert by id
  ```

  `tags`/`includes` are `;`-separated; `halal`/`verified` are `true`/`false`.
  Every row is validated with zod — a single bad row aborts the import.

- **Regenerate the synthetic demo seed** (deterministic, ~185 rows):

  ```bash
  npm run generate-planner-seed
  ```

- **Import REAL Astana places from 2GIS** (real name/address/phone/rating/district;
  prices are *estimated* per category since 2GIS has no vendor prices):

  ```bash
  TWOGIS_API_KEY=xxxx npm run import-2gis            # replace vendors.json
  TWOGIS_API_KEY=xxxx npm run import-2gis -- --merge # upsert into existing
  TWOGIS_API_KEY=xxxx npm run import-2gis -- --dry-run
  ```

  Get a key from the [2GIS Platform Manager](https://docs.2gis.com/en/platform-manager/subscription/keys)
  (free demo key available). The importer queries the 2GIS Catalog API around
  Astana for each planner category (banquet halls, конференц-зал, кейтеринг,
  тамада, фотограф, аренда оборудования, …), maps results to `VendorItem`, and
  tags every row `2gis` + `price-estimated` with `verified: false`. Prices are
  deterministic estimates in the realistic ranges above (seeded by place id +
  rating), so re-running is stable. Keep the API key in server env only — never
  ship it to the browser. Respect 2GIS's terms on caching/storing their data.

> **Demo data note:** every seeded row is `verified: false`,
> `source: "synthetic"`, and the UI shows a banner: *“Demo prices are estimates,
> not live vendor quotes.”* Replace them with real collected data via the CSV
> importer.

## Adding a new city

1. Add vendor rows with the new `city` value (CSV import or JSON). Include at
   least one venue per capacity band you expect, plus every required category.
2. That's it — `city` is a first-class field, so the optimizer, repository and
   UI already handle it. (The demo form is pinned to Astana; expose a city
   selector by reading `vendorRepository.cities()`.)

## i18n

Kazakh / Russian / English, default Russian. All planner strings live in
`lib/planner/i18n/{ru,kk,en}.ts`; the page has its own RU/KZ/EN switch.
