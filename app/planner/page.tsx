"use client";

import { useEffect, useMemo, useState } from "react";
import { BlurFade } from "@/components/ui/blur-fade";
import { useMetadata } from "@/app/hooks/useMetadata";
import { vendorRepository } from "@/lib/planner/data/JsonVendorRepository";
import { planAll } from "@/lib/planner/optimizer/optimizer";
import { candidatesFor, utility } from "@/lib/planner/optimizer/utility";
import { computeCost, makeCostContext } from "@/lib/planner/cost/costEngine";
import { formatKzt, formatDelta } from "@/lib/planner/domain/money";
import { DEFAULT_CONTINGENCY_PCT } from "@/lib/planner/config/envelopes";
import { translate, type Lang, type TKey } from "@/lib/planner/i18n";
import type {
  Category,
  EventType,
  PlanItem,
  PlanMode,
  PlanRequest,
} from "@/lib/planner/domain/types";

const ALL_CATS: Category[] = [
  "venue",
  "catering",
  "staff",
  "equipment",
  "decor",
  "logistics",
];
const EVENT_OPTIONS: EventType[] = [
  "conference",
  "wedding",
  "corporate_party",
  "seminar",
  "birthday",
  "kids_party",
];
const LANGS: Lang[] = ["ru", "kk", "en"];

function defaultRequest(): PlanRequest {
  return {
    budget_kzt: 3_000_000,
    city: "Astana",
    event_type: "conference",
    guest_count: 100,
    date: "2025-10-15",
    duration_hours: 10,
    start_hour: 10,
    required_categories: ["venue", "catering", "equipment", "staff", "logistics"],
    preferences: { must_have_tags: [] },
    contingency_pct: DEFAULT_CONTINGENCY_PCT,
  };
}

const EXAMPLES: { key: TKey; req: PlanRequest }[] = [
  {
    key: "examples.flagship",
    req: defaultRequest(),
  },
  {
    key: "examples.wedding",
    req: {
      ...defaultRequest(),
      event_type: "wedding",
      budget_kzt: 5_000_000,
      guest_count: 150,
      date: "2025-07-19",
      duration_hours: 6,
      start_hour: 18,
      required_categories: ["venue", "catering", "staff", "decor", "equipment"],
      preferences: { halal: true, must_have_tags: [] },
    },
  },
  {
    key: "examples.seminar",
    req: {
      ...defaultRequest(),
      event_type: "seminar",
      budget_kzt: 900_000,
      guest_count: 40,
      date: "2025-11-12",
      duration_hours: 5,
      start_hour: 10,
      required_categories: ["venue", "catering", "equipment"],
    },
  },
];

const card = "bg-white rounded-2xl border border-color-light shadow-sm";
const label = "block text-sm font-medium text-color-dark mb-1";
const input =
  "w-full rounded-lg border border-color-light bg-color-lightest px-3 py-2 text-color-dark focus:outline-none focus:ring-2 focus:ring-color-medium";

export default function PlannerPage() {
  useMetadata(
    "Планировщик бюджета мероприятий | Auen",
    "Спланируйте мероприятие целиком из бюджета в тенге — площадка, кейтеринг, персонал, оборудование."
  );

  const [lang, setLang] = useState<Lang>("ru");
  const [req, setReq] = useState<PlanRequest>(defaultRequest());
  const [mode, setMode] = useState<PlanMode>("balanced");
  const [overrides, setOverrides] = useState<Partial<Record<Category, string>>>({});
  const [openSwap, setOpenSwap] = useState<Category | null>(null);
  const [copied, setCopied] = useState(false);

  const t = (k: TKey) => translate(lang, k);

  // Restore state from a shared ?plan= link on first load.
  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search).get("plan");
      if (!p) return;
      const s = JSON.parse(decodeURIComponent(escape(atob(p))));
      if (s?.req) setReq(s.req);
      if (s?.mode) setMode(s.mode);
      if (s?.overrides) setOverrides(s.overrides);
      if (s?.lang && LANGS.includes(s.lang)) setLang(s.lang);
    } catch {
      /* ignore malformed links */
    }
  }, []);

  const bundle = useMemo(() => planAll(req, vendorRepository), [req]);
  const plan = bundle[mode];

  const ctx = useMemo(
    () =>
      makeCostContext({
        guest_count: req.guest_count,
        duration_hours: req.duration_hours,
        date: req.date,
        start_hour: req.start_hour,
      }),
    [req]
  );

  function update(patch: Partial<PlanRequest>) {
    setReq((r) => ({ ...r, ...patch }));
    setOverrides({});
  }
  function loadExample(r: PlanRequest) {
    setReq(r);
    setOverrides({});
    setMode("balanced");
  }
  function toggleCategory(cat: Category) {
    setReq((r) => {
      const has = r.required_categories.includes(cat);
      const next = has
        ? r.required_categories.filter((c) => c !== cat)
        : [...r.required_categories, cat];
      return { ...r, required_categories: ALL_CATS.filter((c) => next.includes(c)) };
    });
    setOverrides({});
  }

  const displayItems: PlanItem[] = useMemo(() => {
    if (!plan.feasible) return [];
    return plan.items.map((it) => {
      const overrideId = overrides[it.category];
      if (!overrideId) return it;
      const v = vendorRepository.byId(overrideId);
      if (!v) return it;
      const c = computeCost(v, ctx);
      return {
        ...it,
        item: v,
        cost: c.total,
        breakdown: c.breakdown,
        utility: utility(v, req),
        reason: `${translate(lang, "result.swap")}: ${v.name}`,
      };
    });
  }, [plan, overrides, ctx, req, lang]);

  const displayTotal = displayItems.reduce((s, i) => s + i.cost, 0);
  const spendable = plan.feasible ? plan.spendable : 0;
  const reserve = plan.feasible ? plan.contingency_reserve : 0;
  const remaining = spendable - displayTotal;
  const overBudget = remaining < 0;

  function alternativesFor(cat: Category, currentId: string) {
    const cands = candidatesFor(vendorRepository.byCategory(cat, req.city), req)
      .map((v) => {
        const c = computeCost(v, ctx);
        return { v, cost: c.total, u: utility(v, req) };
      })
      .sort((a, b) => b.u - a.u || a.cost - b.cost);
    const current = cands.find((x) => x.v.id === currentId);
    return { cands, currentCost: current?.cost ?? 0 };
  }

  function shareLink() {
    try {
      const encoded = btoa(
        unescape(encodeURIComponent(JSON.stringify({ req, overrides, mode, lang })))
      );
      const url = `${window.location.origin}${window.location.pathname}?plan=${encoded}`;
      navigator.clipboard?.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  const spentPct =
    spendable + reserve > 0 ? Math.min(100, (displayTotal / (spendable + reserve)) * 100) : 0;
  const reservePct = spendable + reserve > 0 ? (reserve / (spendable + reserve)) * 100 : 0;

  return (
    <div className="min-h-screen bg-color-lightest">
      <div className="max-w-5xl mx-auto px-4 py-8 print:py-2">
        {/* language + banner */}
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2 text-sm text-amber-800">
            {t("banner.demo")}
          </div>
          <div className="flex gap-1 print:hidden shrink-0">
            {LANGS.map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2.5 py-1 rounded-md text-sm ${
                  lang === l ? "bg-color-medium text-white" : "text-color-medium"
                }`}
              >
                {translate(l, `lang.${l}` as TKey)}
              </button>
            ))}
          </div>
        </div>

        <BlurFade delay={0.1}>
          <h1 className="text-3xl font-bold text-color-dark">{t("app.title")}</h1>
          <p className="text-color-medium mb-4">{t("app.subtitle")}</p>
        </BlurFade>

        {/* worked examples */}
        <BlurFade delay={0.12}>
          <div className="mb-6 print:hidden">
            <div className="text-sm font-medium text-color-dark mb-2">
              {t("examples.title")}
            </div>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.key}
                  onClick={() => loadExample(ex.req)}
                  className="px-3 py-2 rounded-lg bg-white border border-color-light text-sm text-color-dark hover:border-color-medium"
                >
                  {t(ex.key)}
                </button>
              ))}
            </div>
          </div>
        </BlurFade>

        {/* form */}
        <BlurFade delay={0.15}>
          <div className={`${card} p-5 mb-6 print:hidden`}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className={label}>{t("form.budget")}</label>
                <input
                  type="number"
                  className={input}
                  value={req.budget_kzt}
                  min={0}
                  onChange={(e) => update({ budget_kzt: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className={label}>{t("form.eventType")}</label>
                <select
                  className={input}
                  value={req.event_type}
                  onChange={(e) => update({ event_type: e.target.value as EventType })}
                >
                  {EVENT_OPTIONS.map((et) => (
                    <option key={et} value={et}>
                      {t(`eventType.${et}` as TKey)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label}>{t("form.guests")}</label>
                <input
                  type="number"
                  className={input}
                  value={req.guest_count}
                  min={1}
                  onChange={(e) => update({ guest_count: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className={label}>{t("form.date")}</label>
                <input
                  type="date"
                  className={input}
                  value={req.date}
                  onChange={(e) => update({ date: e.target.value })}
                />
              </div>
              <div>
                <label className={label}>{t("form.duration")}</label>
                <input
                  type="number"
                  className={input}
                  value={req.duration_hours}
                  min={1}
                  onChange={(e) => update({ duration_hours: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className={label}>{t("form.startHour")}</label>
                <input
                  type="number"
                  className={input}
                  value={req.start_hour ?? 12}
                  min={0}
                  max={23}
                  onChange={(e) => update({ start_hour: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="mt-4">
              <label className={label}>{t("form.categories")}</label>
              <div className="flex flex-wrap gap-2">
                {ALL_CATS.map((cat) => {
                  const on = req.required_categories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition ${
                        on
                          ? "bg-color-medium text-white border-color-medium"
                          : "bg-white text-color-dark border-color-light"
                      }`}
                    >
                      {t(`category.${cat}` as TKey)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-color-dark">
                <input
                  type="checkbox"
                  checked={!!req.preferences.halal}
                  onChange={(e) =>
                    update({ preferences: { ...req.preferences, halal: e.target.checked } })
                  }
                />
                {t("form.halal")}
              </label>
              <label className="flex items-center gap-2 text-sm text-color-dark">
                <input
                  type="checkbox"
                  checked={!!req.preferences.vegetarian}
                  onChange={(e) =>
                    update({
                      preferences: { ...req.preferences, vegetarian: e.target.checked },
                    })
                  }
                />
                {t("form.vegetarian")}
              </label>
              <div className="flex items-center gap-2 text-sm text-color-dark">
                {t("form.contingency")}: {Math.round(req.contingency_pct * 100)}%
                <input
                  type="range"
                  min={0}
                  max={20}
                  value={Math.round(req.contingency_pct * 100)}
                  onChange={(e) => update({ contingency_pct: Number(e.target.value) / 100 })}
                />
              </div>
            </div>
          </div>
        </BlurFade>

        {/* variant compare */}
        <BlurFade delay={0.2}>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {(["economy", "balanced", "premium"] as PlanMode[]).map((m) => {
              const p = bundle[m];
              const active = m === mode;
              return (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m);
                    setOverrides({});
                  }}
                  className={`${card} p-4 text-left transition ${
                    active ? "ring-2 ring-color-medium" : "hover:border-color-medium"
                  }`}
                >
                  <div className="font-semibold text-color-dark">
                    {t(`mode.${m}` as TKey)}
                  </div>
                  <div className="text-xs text-color-medium mb-2">
                    {t(`mode.${m}.desc` as TKey)}
                  </div>
                  <div className="text-lg font-bold text-color-dark">
                    {p.feasible ? formatKzt(p.total_cost) : "—"}
                  </div>
                </button>
              );
            })}
          </div>
        </BlurFade>

        {/* infeasible */}
        {!plan.feasible && (
          <div className={`${card} p-6 border-red-200`}>
            <div className="text-lg font-semibold text-red-700 mb-1">
              {t("infeasible.title")}
            </div>
            <div className="text-color-dark">{plan.reason}</div>
            <div className="mt-2 text-sm text-color-medium">
              {t("infeasible.constraint")}: <b>{plan.failing_constraint}</b>
              {plan.min_budget_required != null && (
                <>
                  {" · "}
                  {t("infeasible.minBudget")}: <b>{formatKzt(plan.min_budget_required)}</b>
                </>
              )}
            </div>
          </div>
        )}

        {/* feasible plan */}
        {plan.feasible && (
          <>
            <BlurFade delay={0.25}>
              <div className={`${card} p-5 mb-6`}>
                <div className="flex flex-wrap justify-between gap-2 text-sm text-color-dark mb-2">
                  <span>
                    {t("budget.spent")}: <b>{formatKzt(displayTotal)}</b>
                  </span>
                  <span>
                    {t("budget.reserve")}: <b>{formatKzt(reserve)}</b>
                  </span>
                  <span className={overBudget ? "text-red-600" : ""}>
                    {t("budget.remaining")}: <b>{formatKzt(remaining)}</b>
                  </span>
                </div>
                <div className="h-4 w-full rounded-full bg-color-light overflow-hidden flex">
                  <div
                    className={overBudget ? "bg-red-500" : "bg-color-medium"}
                    style={{ width: `${spentPct}%` }}
                  />
                  <div className="bg-amber-300" style={{ width: `${reservePct}%` }} />
                </div>
                <div className="mt-2 text-xs text-color-medium">
                  {t("budget.total")} {formatKzt(req.budget_kzt)} · {t("budget.spendable")}{" "}
                  {formatKzt(spendable)}
                </div>
              </div>
            </BlurFade>

            <div className="space-y-4">
              {displayItems.map((it) => {
                const { cands, currentCost } = alternativesFor(it.category, it.item.id);
                return (
                  <BlurFade key={it.category} delay={0.05}>
                    <div className={`${card} p-5`}>
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <div className="text-xs uppercase tracking-wide text-color-medium">
                            {t(`category.${it.category}` as TKey)}
                            {it.squeezed && (
                              <span className="ml-2 text-amber-600">
                                · {t("result.squeezed")}
                              </span>
                            )}
                          </div>
                          <div className="text-lg font-semibold text-color-dark">
                            {it.item.name}
                          </div>
                          <div className="text-sm text-color-medium">
                            {it.item.district} · ★ {it.item.rating.toFixed(1)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-color-dark">
                            {formatKzt(it.cost)}
                          </div>
                          <button
                            onClick={() =>
                              setOpenSwap(openSwap === it.category ? null : it.category)
                            }
                            className="mt-1 text-sm px-3 py-1 rounded-lg bg-color-dark text-white print:hidden"
                          >
                            {t("result.swap")}
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-color-dark/80">{it.breakdown}</div>
                      <div className="mt-1 text-sm text-color-medium italic">{it.reason}</div>

                      {openSwap === it.category && (
                        <div className="mt-3 border-t border-color-light pt-3 space-y-1 print:hidden max-h-72 overflow-auto">
                          {cands.map((alt) => {
                            const delta = alt.cost - currentCost;
                            const fits = displayTotal - it.cost + alt.cost <= spendable;
                            const isCurrent = alt.v.id === it.item.id;
                            return (
                              <button
                                key={alt.v.id}
                                disabled={isCurrent}
                                onClick={() => {
                                  setOverrides((o) => ({ ...o, [it.category]: alt.v.id }));
                                  setOpenSwap(null);
                                }}
                                className={`w-full flex justify-between items-center text-left px-3 py-2 rounded-lg text-sm ${
                                  isCurrent
                                    ? "bg-color-light"
                                    : "hover:bg-color-lightest border border-transparent hover:border-color-light"
                                }`}
                              >
                                <span className="text-color-dark">
                                  {alt.v.name}{" "}
                                  <span className="text-color-medium">
                                    ★ {alt.v.rating.toFixed(1)}
                                  </span>
                                  {isCurrent && (
                                    <span className="ml-2 text-xs text-color-medium">
                                      ({t("swap.current")})
                                    </span>
                                  )}
                                </span>
                                <span className="flex items-center gap-3">
                                  <span className="text-color-dark">{formatKzt(alt.cost)}</span>
                                  {!isCurrent && (
                                    <span
                                      className={delta > 0 ? "text-red-600" : "text-green-600"}
                                    >
                                      {formatDelta(delta)}
                                    </span>
                                  )}
                                  <span
                                    className={`text-xs ${
                                      fits ? "text-green-600" : "text-red-500"
                                    }`}
                                  >
                                    {fits ? t("swap.fits") : t("swap.overBudget")}
                                  </span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </BlurFade>
                );
              })}
            </div>

            <div className={`${card} p-5 mt-6 flex flex-wrap justify-between items-center gap-3`}>
              <div className="text-lg text-color-dark">
                {t("result.total")}: <b>{formatKzt(displayTotal)}</b>{" "}
                <span className="text-color-medium text-sm">/ {formatKzt(spendable)}</span>
              </div>
              <div className="flex gap-2 print:hidden">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-lg border border-color-medium text-color-medium"
                >
                  {t("export.print")}
                </button>
                <button
                  onClick={shareLink}
                  className="px-4 py-2 rounded-lg bg-color-medium text-white"
                >
                  {copied ? t("export.copied") : t("export.share")}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
