/**
 * Import vendor rows from a CSV into the planner data store.
 * This is how real Astana data (and future cities) get added.
 *
 *   npx tsx scripts/import-planner-csv.ts <path-to.csv> [--merge]
 *
 * CSV header (first line) must contain these columns (order-independent):
 *   id,city,district,name,category,price_model,price_kzt,rating,
 *   capacity_min,capacity_max,tags,contact,notes,source,verified
 * Optional columns: includes,min_order,cuisine,halal,role
 *
 * `tags` and `includes` are ";"-separated lists. `halal`/`verified` are
 * true/false. Every row is validated with zod; a bad row aborts the import.
 *
 * Without --merge the file is REPLACED. With --merge, rows are upserted by id.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { parseVendors } from "../lib/planner/domain/schema";
import type { VendorItem } from "../lib/planner/domain/types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, "..", "lib", "planner", "data", "vendors.json");

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQ = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQ = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function rowToVendor(headers: string[], cols: string[]): unknown {
  const get = (k: string) => {
    const idx = headers.indexOf(k);
    return idx >= 0 ? cols[idx] : undefined;
  };
  const list = (v?: string) =>
    v ? v.split(";").map((s) => s.trim()).filter(Boolean) : [];
  const num = (v?: string) => (v == null || v === "" ? undefined : Number(v));
  const bool = (v?: string) => (v == null ? undefined : /^(true|1|yes)$/i.test(v));

  const row: Record<string, unknown> = {
    id: get("id"),
    city: get("city"),
    district: get("district"),
    name: get("name"),
    category: get("category"),
    price_model: get("price_model"),
    price_kzt: num(get("price_kzt")),
    rating: num(get("rating")),
    capacity_min: num(get("capacity_min")) ?? 0,
    capacity_max: num(get("capacity_max")) ?? 0,
    tags: list(get("tags")),
    contact: get("contact") ?? "",
    notes: get("notes") ?? "",
    source: get("source") ?? "csv-import",
    verified: bool(get("verified")) ?? false,
  };
  const includes = get("includes");
  if (includes) row.includes = list(includes);
  const minOrder = num(get("min_order"));
  if (minOrder != null) row.min_order = minOrder;
  if (get("cuisine")) row.cuisine = get("cuisine");
  if (get("halal") != null && get("halal") !== "") row.halal = bool(get("halal"));
  if (get("role")) row.role = get("role");
  return row;
}

function main() {
  const args = process.argv.slice(2);
  const merge = args.includes("--merge");
  const file = args.find((a) => !a.startsWith("--"));
  if (!file) {
    console.error("Usage: npx tsx scripts/import-planner-csv.ts <file.csv> [--merge]");
    process.exit(1);
  }

  const text = readFileSync(resolve(file), "utf8").replace(/^﻿/, "");
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) throw new Error("CSV has no data rows");

  const headers = parseCsvLine(lines[0]);
  const raw = lines.slice(1).map((l) => rowToVendor(headers, parseCsvLine(l)));

  // Validate loudly — a bad row aborts the whole import.
  const incoming = parseVendors(raw);
  console.log(`Validated ${incoming.length} row(s) from ${file}`);

  let result: VendorItem[];
  if (merge) {
    const existing = parseVendors(JSON.parse(readFileSync(DATA, "utf8")));
    const byId = new Map(existing.map((v) => [v.id, v]));
    for (const v of incoming) byId.set(v.id, v);
    result = [...byId.values()];
  } else {
    result = incoming;
  }

  writeFileSync(DATA, JSON.stringify(result, null, 2) + "\n", "utf8");
  console.log(`Wrote ${result.length} row(s) to ${DATA}${merge ? " (merged)" : " (replaced)"}`);
}

main();
