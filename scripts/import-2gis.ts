/**
 * Import REAL Astana places from the 2GIS Catalog API into the planner data
 * store. Places (name, address, phone, rating, district) are real; PRICES are
 * *estimated* by category (2GIS does not expose vendor prices), so every row is
 * written with `verified: false` and a `price-estimated` tag.
 *
 *   TWOGIS_API_KEY=xxxx npx tsx scripts/import-2gis.ts [--merge] [--dry-run] [--limit N]
 *
 * Get a key: https://docs.2gis.com/en/platform-manager/subscription/keys
 *
 * Flags:
 *   --merge     upsert into the existing vendors.json (by id) instead of replacing
 *   --dry-run   fetch + map + validate, print a summary, but do not write
 *   --limit N   cap total rows written (after mapping)
 *
 * The planner keeps reading lib/planner/data/vendors.json unchanged.
 */
import { writeFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseVendors } from "../lib/planner/domain/schema";
import type { Category, PriceModel, VendorItem } from "../lib/planner/domain/types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, "..", "lib", "planner", "data", "vendors.json");

const BASE = "https://catalog.api.2gis.com/3.0/items";
const ASTANA = { lon: 71.4304, lat: 51.1282 };
const RADIUS_M = 40000;
const FIELDS =
  "items.point,items.address,items.rubrics,items.contact_groups,items.reviews,items.adm_div";
const PAGE_SIZE = 50;
const MAX_PAGES = 2; // up to 100 places per collector

// --- 2GIS response shapes (minimal) ----------------------------------------
interface TwoGisContact {
  type?: string;
  value?: string;
}
interface TwoGisContactGroup {
  contacts?: TwoGisContact[];
}
interface TwoGisAdmDiv {
  type?: string;
  name?: string;
}
interface TwoGisRubric {
  name?: string;
}
interface TwoGisReviews {
  general_rating?: number;
  general_review_count?: number;
}
interface TwoGisItem {
  id?: string;
  name?: string;
  address_name?: string;
  adm_div?: TwoGisAdmDiv[];
  contact_groups?: TwoGisContactGroup[];
  rubrics?: TwoGisRubric[];
  reviews?: TwoGisReviews;
  rating?: number;
}
interface TwoGisResponse {
  meta?: { code?: number; error?: { message?: string } };
  result?: { items?: TwoGisItem[]; total?: number };
}

// --- what to fetch: category "collectors" with price/capacity estimates ------
interface Collector {
  category: Category;
  query: string;
  price_model: PriceModel;
  priceMin: number;
  priceMax: number;
  step: number;
  capMin: number;
  capMax: number;
  tags: string[];
  role?: string;
  minOrder?: number;
  halalHint?: boolean;
}

const COLLECTORS: Collector[] = [
  // venues
  { category: "venue", query: "банкетный зал", price_model: "per_person", priceMin: 6000, priceMax: 20000, step: 500, capMin: 40, capMax: 350, tags: ["banquet", "hall", "indoor"] },
  { category: "venue", query: "ресторан", price_model: "per_person", priceMin: 10000, priceMax: 30000, step: 500, capMin: 30, capMax: 250, tags: ["restaurant", "banquet"] },
  { category: "venue", query: "конференц-зал", price_model: "per_day", priceMin: 150000, priceMax: 900000, step: 5000, capMin: 30, capMax: 500, tags: ["conference", "seminar", "business"] },
  { category: "venue", query: "коворкинг", price_model: "per_day", priceMin: 150000, priceMax: 500000, step: 5000, capMin: 20, capMax: 160, tags: ["coworking", "seminar"] },
  // catering
  { category: "catering", query: "кейтеринг", price_model: "per_person", priceMin: 5000, priceMax: 25000, step: 250, capMin: 0, capMax: 100000, tags: ["banquet", "served"], minOrder: 30, halalHint: true },
  { category: "catering", query: "кофе-брейк кейтеринг", price_model: "per_person", priceMin: 2500, priceMax: 6000, step: 250, capMin: 0, capMax: 100000, tags: ["coffee-break", "conference"], minOrder: 20, halalHint: true },
  // staff
  { category: "staff", query: "тамада", price_model: "flat", priceMin: 150000, priceMax: 450000, step: 5000, capMin: 0, capMax: 100000, tags: ["host", "toi"], role: "tamada" },
  { category: "staff", query: "фотограф", price_model: "flat", priceMin: 100000, priceMax: 300000, step: 5000, capMin: 0, capMax: 100000, tags: ["photo"], role: "photographer" },
  { category: "staff", query: "видеосъёмка", price_model: "flat", priceMin: 150000, priceMax: 500000, step: 5000, capMin: 0, capMax: 100000, tags: ["video"], role: "videographer" },
  { category: "staff", query: "ди-джей", price_model: "flat", priceMin: 120000, priceMax: 350000, step: 5000, capMin: 0, capMax: 100000, tags: ["music", "sound"], role: "dj" },
  { category: "staff", query: "охранное агентство", price_model: "per_hour", priceMin: 2500, priceMax: 5000, step: 250, capMin: 0, capMax: 100000, tags: ["safety"], role: "security" },
  // equipment
  { category: "equipment", query: "аренда звукового оборудования", price_model: "per_day", priceMin: 40000, priceMax: 200000, step: 2500, capMin: 0, capMax: 100000, tags: ["sound", "audio"] },
  { category: "equipment", query: "аренда светового оборудования", price_model: "per_day", priceMin: 30000, priceMax: 180000, step: 2500, capMin: 0, capMax: 100000, tags: ["lighting", "stage"] },
  { category: "equipment", query: "аренда проектора", price_model: "per_day", priceMin: 25000, priceMax: 80000, step: 2500, capMin: 0, capMax: 100000, tags: ["projector", "screen", "conference"] },
  // decor
  { category: "decor", query: "оформление шарами", price_model: "flat", priceMin: 30000, priceMax: 120000, step: 2500, capMin: 0, capMax: 100000, tags: ["balloons", "birthday"] },
  { category: "decor", query: "флористика оформление", price_model: "flat", priceMin: 60000, priceMax: 300000, step: 2500, capMin: 0, capMax: 100000, tags: ["flowers", "floral", "wedding"] },
  { category: "decor", query: "фотозона аренда", price_model: "flat", priceMin: 60000, priceMax: 250000, step: 2500, capMin: 0, capMax: 100000, tags: ["photo-zone", "backdrop"] },
  // logistics
  { category: "logistics", query: "аренда автобуса", price_model: "per_day", priceMin: 80000, priceMax: 300000, step: 5000, capMin: 0, capMax: 100000, tags: ["transport", "shuttle", "bus"] },
  { category: "logistics", query: "типография", price_model: "flat", priceMin: 20000, priceMax: 120000, step: 2500, capMin: 0, capMax: 100000, tags: ["printing", "signage"] },
];

const DISTRICT_MAP: [RegExp, string][] = [
  [/есил|есіл/i, "Esil"],
  [/алматин/i, "Almaty"],
  [/сарыарк|сарыарқ/i, "Saryarka"],
  [/байконыр|байконур/i, "Baikonyr"],
  [/нуринск|нура/i, "Nura"],
];

// --- deterministic price estimate -------------------------------------------
function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 100000) / 100000;
}
function estimatePrice(id: string, c: Collector, rating: number): number {
  const h = hash01(id);
  const ratingNorm = Math.min(1, Math.max(0, (rating - 1) / 4));
  const t = Math.min(1, Math.max(0, 0.7 * h + 0.3 * ratingNorm));
  const raw = c.priceMin + t * (c.priceMax - c.priceMin);
  return Math.round(raw / c.step) * c.step;
}

function districtOf(item: TwoGisItem): string {
  for (const d of item.adm_div ?? []) {
    if (!d.name) continue;
    for (const [re, name] of DISTRICT_MAP) if (re.test(d.name)) return name;
  }
  return "Astana";
}
function phoneOf(item: TwoGisItem): string {
  for (const g of item.contact_groups ?? [])
    for (const c of g.contacts ?? [])
      if (c.type === "phone" && c.value) return c.value;
  return "";
}
function ratingOf(item: TwoGisItem): number {
  const r = item.reviews?.general_rating ?? item.rating ?? 0;
  if (!r || r < 1) return 4.0; // default when 2GIS has no rating
  return Math.round(Math.min(5, Math.max(1, r)) * 10) / 10;
}

function toVendor(item: TwoGisItem, c: Collector): VendorItem | null {
  if (!item.id || !item.name) return null;
  const id = `2gis-${c.category}-${item.id}`;
  const rating = ratingOf(item);
  const name = item.name.trim();
  const halal =
    c.category === "catering"
      ? c.halalHint === true ||
        /халал|halal|казах|қазақ|дастархан/i.test(
          name + " " + (item.rubrics ?? []).map((r) => r.name).join(" "),
        )
      : undefined;

  const vendor: VendorItem = {
    id,
    city: "Astana",
    district: districtOf(item),
    name,
    category: c.category,
    price_model: c.price_model,
    price_kzt: estimatePrice(id, c, rating),
    rating,
    capacity_min: c.capMin,
    capacity_max: c.capMax,
    tags: Array.from(new Set([...c.tags, "price-estimated", "2gis"])),
    contact: phoneOf(item),
    notes: item.address_name ? `2GIS: ${item.address_name}` : "Imported from 2GIS",
    source: "2gis",
    verified: false,
  };
  if (c.role) vendor.role = c.role;
  if (c.minOrder != null) vendor.min_order = c.minOrder;
  if (halal !== undefined) vendor.halal = halal;
  return vendor;
}

async function fetchPage(key: string, query: string, page: number): Promise<TwoGisItem[]> {
  const url =
    `${BASE}?q=${encodeURIComponent(query)}` +
    `&location=${ASTANA.lon},${ASTANA.lat}&radius=${RADIUS_M}` +
    `&fields=${encodeURIComponent(FIELDS)}` +
    `&page=${page}&page_size=${PAGE_SIZE}&key=${key}`;
  const res = await fetch(url);
  if (res.status === 403 || res.status === 401) {
    throw new Error("2GIS rejected the API key (401/403). Check TWOGIS_API_KEY.");
  }
  const json = (await res.json()) as TwoGisResponse;
  const code = json.meta?.code;
  if (code && code !== 200) {
    // 404 = no results for this page/query; treat as empty, not fatal
    if (code === 404) return [];
    throw new Error(`2GIS error ${code}: ${json.meta?.error?.message ?? "unknown"}`);
  }
  return json.result?.items ?? [];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const args = process.argv.slice(2);
  const merge = args.includes("--merge");
  const dryRun = args.includes("--dry-run");
  const limitArg = args[args.indexOf("--limit") + 1];
  const limit = args.includes("--limit") ? Number(limitArg) : Infinity;

  const key = process.env.TWOGIS_API_KEY;
  if (!key) {
    console.error(
      "Missing TWOGIS_API_KEY.\n" +
        "Get a key at https://docs.2gis.com/en/platform-manager/subscription/keys\n" +
        "Then run:  TWOGIS_API_KEY=xxxx npx tsx scripts/import-2gis.ts",
    );
    process.exit(1);
  }

  const byId = new Map<string, VendorItem>();
  for (const c of COLLECTORS) {
    let got = 0;
    for (let page = 1; page <= MAX_PAGES; page++) {
      let items: TwoGisItem[];
      try {
        items = await fetchPage(key, c.query, page);
      } catch (e) {
        console.error(`  ! ${c.category}/"${c.query}" page ${page}: ${(e as Error).message}`);
        break;
      }
      for (const it of items) {
        const v = toVendor(it, c);
        if (v) {
          byId.set(v.id, v);
          got++;
        }
      }
      if (items.length < PAGE_SIZE) break;
      await sleep(250); // be polite to the API
    }
    console.log(`  ${c.category.padEnd(10)} "${c.query}" -> ${got}`);
    await sleep(250);
  }

  let mapped = Array.from(byId.values());
  if (Number.isFinite(limit)) mapped = mapped.slice(0, limit);

  // Validate loudly before writing.
  const validated = parseVendors(mapped);
  const byCat: Record<string, number> = {};
  for (const v of validated) byCat[v.category] = (byCat[v.category] ?? 0) + 1;
  console.log(`\nFetched ${validated.length} real places:`, byCat);

  if (dryRun) {
    console.log("--dry-run: nothing written.");
    return;
  }

  let result: VendorItem[];
  if (merge) {
    const existing = parseVendors(JSON.parse(readFileSync(DATA, "utf8")));
    const m = new Map(existing.map((v) => [v.id, v]));
    for (const v of validated) m.set(v.id, v);
    result = Array.from(m.values());
  } else {
    result = validated;
  }

  writeFileSync(DATA, JSON.stringify(result, null, 2) + "\n", "utf8");
  console.log(
    `Wrote ${result.length} row(s) to ${DATA}${merge ? " (merged)" : " (replaced)"}.`,
  );
  console.log("Note: places are real; prices are estimates (verified:false).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
