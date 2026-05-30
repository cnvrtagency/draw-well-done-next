"use client";

import { useMemo, useState } from "react";
import { Calculator, ClipboardCopy, RefreshCw } from "lucide-react";
import { AdminPageHeader } from "./AdminKit";
import { StatTile } from "../ui/StatTile";
import { formatMoney } from "@/lib/format";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { AdminPanel } from "./AdminKit";
import {
  CalcInputs,
  DEFAULT_INPUTS,
  compute,
  evaluateTiers,
  formatPct,
  recommendations,
  scenarios,
  suggestTiers,
  TierResult,
} from "@/lib/profitCalc";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="admin-field-label text-xs font-semibold uppercase tracking-[0.18em]">{children}</label>;
}

function NumField({
  label,
  value,
  onChange,
  step = "any",
  min,
  max,
  prefix,
  suffix,
  hint,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  step?: string;
  min?: number;
  max?: number;
  prefix?: string;
  suffix?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <FieldLabel>{label}</FieldLabel>
      <div className="relative">
        {prefix ? (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs td-soft pointer-events-none">{prefix}</span>
        ) : null}
        <Input
          type="number"
          inputMode="decimal"
          step={step}
          min={min}
          max={max}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
          className={`${prefix ? "pl-7" : ""} ${suffix ? "pr-9" : ""}`}
        />
        {suffix ? <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs td-soft pointer-events-none">{suffix}</span> : null}
      </div>
      {hint ? <p className="admin-helper-text mt-1 text-xs">{hint}</p> : null}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <AdminPanel title={<span className="text-sm md:text-base">{title}</span>} description={<span className="admin-helper-text">{title.includes("Advanced") ? "Add assumptions when you need more precision." : ""}</span>}>
      {children}
    </AdminPanel>
  );
}

function verdictTone(v: TierResult["verdict"]) {
  if (v === "recommended") {
    return "bg-success/20 text-success border-success/30";
  }
  if (v === "caution") {
    return "bg-amber-500/20 text-amber-300 border-amber-500/30";
  }
  return "bg-destructive/20 text-destructive border-destructive/30";
}

type PresetPatch = Partial<CalcInputs>;

const PRESETS: { id: string; label: string; patch: PresetPatch }[] = [
  {
    id: "low",
    label: "Low ticket test",
    patch: {
      ticketPrice: 0.49,
      entryCap: 5000,
      providerFeePct: 2.9,
      providerFixedFee: 0.3,
      avgEntriesPerOrder: 5,
      desiredMarginPct: 25,
      tiers: [
        { quantity: 5, discountPct: 5 },
        { quantity: 10, discountPct: 10 },
        { quantity: 25, discountPct: 15 },
        { quantity: 50, discountPct: 20 },
      ],
    },
  },
  {
    id: "standard",
    label: "Standard prize drop",
    patch: {
      ticketPrice: 0.99,
      entryCap: 3000,
      providerFeePct: 2.9,
      providerFixedFee: 0.3,
      avgEntriesPerOrder: 4,
      desiredMarginPct: 25,
      tiers: [
        { quantity: 5, discountPct: 5 },
        { quantity: 10, discountPct: 10 },
        { quantity: 25, discountPct: 15 },
        { quantity: 50, discountPct: 20 },
      ],
    },
  },
  {
    id: "high",
    label: "Higher-value prize",
    patch: {
      ticketPrice: 1.99,
      entryCap: 2000,
      providerFeePct: 2.9,
      providerFixedFee: 0.3,
      avgEntriesPerOrder: 3,
      desiredMarginPct: 30,
      tiers: [
        { quantity: 5, discountPct: 5 },
        { quantity: 10, discountPct: 10 },
        { quantity: 25, discountPct: 12 },
        { quantity: 50, discountPct: 15 },
      ],
    },
  },
];

export function AdminProfitCalculator() {
  const [inputs, setInputs] = useState<CalcInputs>(DEFAULT_INPUTS);
  const [copyState, setCopyState] = useState<string>("");

  const setInput = <K extends keyof CalcInputs>(key: K, value: CalcInputs[K]) => {
    setInputs((state) => ({ ...state, [key]: value }));
  };

  const setTier = (idx: number, key: "quantity" | "discountPct", value: number) => {
    setInputs((state) => ({
      ...state,
      tiers: state.tiers.map((tier, i) => (i === idx ? { ...tier, [key]: value } : tier)),
    }));
  };

  const applyPreset = (patch: PresetPatch) => setInputs((state) => ({ ...state, ...patch }));

  const core = useMemo(() => compute(inputs), [inputs]);
  const scenarioRows = useMemo(() => scenarios(inputs, core), [inputs, core]);
  const tierRows = useMemo(() => evaluateTiers(inputs, core), [inputs, core]);
  const suggested = useMemo(() => suggestTiers(inputs, core), [inputs, core]);
  const recs = useMemo(() => recommendations(inputs, core), [inputs, core]);

  const hasCore = inputs.ticketPrice > 0 && inputs.entryCap > 0;
  const desiredMargin = inputs.desiredMarginPct / 100;
  const profitTone = core.netProfit > 0 ? "success" : "default";
  const marginTone = core.margin >= desiredMargin ? "success" : core.margin > 0 ? "info" : "default";
  const breakEvenTone = core.breakEvenPct > 0.7 ? "gold" : core.breakEvenPct < 0.5 ? "success" : "info";

  async function copySummary() {
    const lines = [
      `Prize: ${inputs.prizeName}`,
      `Ticket price: ${formatMoney(inputs.ticketPrice)}`,
      `Entry cap: ${inputs.entryCap.toLocaleString()}`,
      `Gross revenue: ${formatMoney(core.grossRevenue)}`,
      `Total costs: ${formatMoney(core.totalCosts)}`,
      `Net profit: ${formatMoney(core.netProfit)} (${formatPct(core.margin)})`,
      `Break-even: ${Math.ceil(core.breakEvenEntries).toLocaleString()} entries (${formatPct(core.breakEvenPct)})`,
      "",
      "Suggested tiers:",
      ...suggested.tiers.map((t) =>
        t.discountPct === null
          ? `- ${t.quantity}+ entries: drop tier (${t.note})`
          : `- ${t.quantity}+ entries: ${t.discountPct}% off`,
      ),
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopyState("Summary copied to clipboard.");
    } catch {
      setCopyState("Clipboard blocked in this browser.");
    }
  }

  function reset() {
    setInputs(DEFAULT_INPUTS);
    setCopyState("");
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Commercial planning"
        title="Competition profit calculator"
        subtitle="Plan ticket pricing, entry caps and discounts before launching a competition."
        actions={
          <Button size="sm" onClick={copySummary} disabled={!hasCore}>
            <ClipboardCopy className="h-3.5 w-3.5 mr-1.5" /> Copy summary
          </Button>
        }
      />

      {copyState ? <p className="admin-helper-text mb-4 text-xs">{copyState}</p> : null}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-[11px] uppercase tracking-wider td-soft font-bold mr-1">Quick start</span>
        {PRESETS.map((preset) => (
          <Button key={preset.id} variant="outline" size="sm" onClick={() => applyPreset(preset.patch)}>
            {preset.label}
          </Button>
        ))}
        <Button variant="ghost" size="sm" onClick={reset}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Reset
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
        <div className="lg:col-span-2 space-y-5 md:space-y-6">
          <Section title="Essential inputs">
            <div className="space-y-1.5 mb-4">
              <FieldLabel>Prize name</FieldLabel>
              <Input value={inputs.prizeName} onChange={(e) => setInput("prizeName", e.target.value)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NumField label="Prize cost" value={inputs.prizeCost} onChange={(value) => setInput("prizeCost", value)} prefix="£" />
              <NumField label="Ticket price" value={inputs.ticketPrice} onChange={(value) => setInput("ticketPrice", value)} prefix="£" step="0.01" />
              <NumField label="Entry cap" value={inputs.entryCap} onChange={(value) => setInput("entryCap", value)} step="1" />
              <NumField label="Ad spend allowance" value={inputs.adSpend} onChange={(value) => setInput("adSpend", value)} prefix="£" />
            </div>
          </Section>

          <Section title="Advanced assumptions">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NumField label="Cash alternative amount" value={inputs.cashAlternative} onChange={(value) => setInput("cashAlternative", value)} prefix="£" />
              <NumField label="Max entries per user" value={inputs.maxEntriesPerUser} onChange={(value) => setInput("maxEntriesPerUser", value)} step="1" />
              <NumField label="Provider fee" value={inputs.providerFeePct} onChange={(value) => setInput("providerFeePct", value)} suffix="%" step="0.01" />
              <NumField label="Provider fixed fee per order" value={inputs.providerFixedFee} onChange={(value) => setInput("providerFixedFee", value)} prefix="£" step="0.01" />
              <NumField label="Avg entries per order" value={inputs.avgEntriesPerOrder} onChange={(value) => setInput("avgEntriesPerOrder", value)} step="0.1" />
              <NumField label="Other costs" value={inputs.otherCosts} onChange={(value) => setInput("otherCosts", value)} prefix="£" />
              <NumField label="Average discount %" value={inputs.avgDiscountPct} onChange={(value) => setInput("avgDiscountPct", value)} suffix="%" hint="Estimate only, not linked to live discount codes." />
              <NumField label="Desired profit margin" value={inputs.desiredMarginPct} onChange={(value) => setInput("desiredMarginPct", value)} suffix="%" />
              <NumField label="Target avg entries per customer" value={inputs.targetEntriesPerCustomer} onChange={(value) => setInput("targetEntriesPerCustomer", value)} step="1" />
              <NumField label="Desired average order value" value={inputs.desiredAOV} onChange={(value) => setInput("desiredAOV", value)} prefix="£" />
            </div>
          </Section>

          <Section title="Bundle discount tiers">
            <div className="space-y-3">
              {inputs.tiers.map((tier, index) => (
                <div key={index} className="grid grid-cols-2 gap-3">
                  <NumField label={`Tier ${index + 1} quantity`} value={tier.quantity} onChange={(value) => setTier(index, "quantity", value)} step="1" />
                  <NumField label={`Tier ${index + 1} discount`} value={tier.discountPct} onChange={(value) => setTier(index, "discountPct", value)} suffix="%" />
                </div>
              ))}
            </div>
          </Section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          {!hasCore ? (
            <div className="glass-panel p-6 text-center">
              <Calculator className="h-8 w-8 text-primary mx-auto mb-3 opacity-70" />
              <h3 className="font-display text-base font-bold">Results will appear here</h3>
              <p className="text-sm td-soft mt-1.5 leading-snug">
                Enter a ticket price and entry cap to start calculating. Add costs to see margin and break-even.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <StatTile label="Gross revenue" value={formatMoney(core.grossRevenue)} tone="primary" />
                <StatTile label="Total costs" value={formatMoney(core.totalCosts)} tone="default" />
                <StatTile label="Net profit" value={formatMoney(core.netProfit)} tone={profitTone} />
                <StatTile
                  label="Margin"
                  value={formatPct(core.margin)}
                  tone={marginTone}
                  hint={inputs.desiredMarginPct > 0 ? `Target ${inputs.desiredMarginPct}%` : undefined}
                />
                <StatTile label="Break-even entries" value={Math.ceil(core.breakEvenEntries).toLocaleString()} tone={breakEvenTone} />
                <StatTile label="Break-even %" value={formatPct(core.breakEvenPct)} tone={breakEvenTone} />
              </div>

              <AdminPanel title="Breakdown">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="td-soft text-[11px]">Net revenue</div>
                    <div className="admin-value font-mono-num">{formatMoney(core.netRevenue)}</div>
                  </div>
                  <div>
                    <div className="td-soft text-[11px]">Provider fees</div>
                    <div className="admin-value font-mono-num">{formatMoney(core.totalProviderFees)}</div>
                  </div>
                </div>
              </AdminPanel>

              <AdminPanel title="Commercial recommendation">
                {recs.length === 0 ? (
                  <p className="text-sm td-soft">Adjust inputs to see commercial guidance.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {recs.map((recommendation, index) => (
                      <li key={`${recommendation}-${index}`} className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </AdminPanel>
            </>
          )}
        </aside>
      </div>

      {!hasCore ? (
        <p className="text-sm td-soft mt-6 text-center">Complete the core inputs to see scenarios and bundle recommendations.</p>
      ) : (
        <>
          <div className="grid gap-5 mt-6">
            <AdminPanel title="Sell-through scenarios">
              <div className="overflow-x-auto -mx-5 px-1">
                <table className="w-full text-sm min-w-[720px]">
                  <thead className="text-left text-[11px] uppercase tracking-[0.16em] td-soft">
                    <tr>
                      <th className="py-2.5 px-3">Sell-through</th>
                      <th className="py-2.5 px-3">Entries sold</th>
                      <th className="py-2.5 px-3">Net revenue</th>
                      <th className="py-2.5 px-3">Provider fees</th>
                      <th className="py-2.5 px-3">Total costs</th>
                      <th className="py-2.5 px-3">Profit / loss</th>
                      <th className="py-2.5 px-3">Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scenarioRows.map((row) => (
                      <tr
                        key={row.pct}
                        className={`border-b border-white/5 ${
                          row.profit < 0
                            ? "bg-destructive/5"
                            : row.profit > 0 && row.margin >= desiredMargin
                              ? "bg-success/5"
                              : ""
                        } ${row.isCrossover ? "ring-1 ring-primary/40" : ""}`}
                      >
                        <td className="py-2.5 px-3">{Math.round(row.pct * 100)}%</td>
                        <td className="py-2.5 px-3">{Math.round(row.entriesSold).toLocaleString()}</td>
                        <td className="py-2.5 px-3 font-mono-num">{formatMoney(row.netRevenue)}</td>
                        <td className="py-2.5 px-3 td-soft font-mono-num">{formatMoney(row.fees)}</td>
                        <td className="py-2.5 px-3 font-mono-num">{formatMoney(row.totalCosts)}</td>
                        <td className={`py-2.5 px-3 font-mono-num font-bold ${row.profit < 0 ? "text-destructive" : "text-success"}`}>
                          {formatMoney(row.profit)}
                        </td>
                        <td className={`py-2.5 px-3 font-mono-num ${row.margin >= desiredMargin ? "text-success" : row.margin >= 0 ? "td-soft" : "text-destructive"}`}>
                          {formatPct(row.margin)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AdminPanel>

            <AdminPanel title="Bundle and discount recommendations">
              <div className="hidden md:block overflow-x-auto -mx-5 px-1">
                <table className="w-full text-sm min-w-[960px]">
                  <thead className="text-left text-[11px] uppercase tracking-[0.16em] td-soft">
                    <tr>
                      <th className="py-2.5 px-3">Tier</th>
                      <th className="py-2.5 px-3">Discount</th>
                      <th className="py-2.5 px-3">Full price</th>
                      <th className="py-2.5 px-3">Bundle price</th>
                      <th className="py-2.5 px-3">Effective ticket</th>
                      <th className="py-2.5 px-3">Discount cost</th>
                      <th className="py-2.5 px-3">Est fee</th>
                      <th className="py-2.5 px-3">Profit / bundle</th>
                      <th className="py-2.5 px-3">Margin</th>
                      <th className="py-2.5 px-3">Verdict</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tierRows.map((tier) => (
                      <tr key={`${tier.quantity}-${tier.discountPct}`} className="border-b border-white/5">
                        <td className="py-3 px-3 font-bold">{tier.quantity}+ entries</td>
                        <td className="py-3 px-3">{tier.discountPct}%</td>
                        <td className="py-3 px-3 font-mono-num">{formatMoney(tier.fullPrice)}</td>
                        <td className="py-3 px-3 font-mono-num">{formatMoney(tier.bundlePrice)}</td>
                        <td className="py-3 px-3 font-mono-num">{formatMoney(tier.effectiveTicket)}</td>
                        <td className="py-3 px-3 font-mono-num">{formatMoney(tier.discountCost)}</td>
                        <td className="py-3 px-3 font-mono-num">{formatMoney(tier.estFee)}</td>
                        <td className={`py-3 px-3 font-mono-num font-bold ${tier.profitPerBundle <= 0 ? "text-destructive" : "text-success"}`}>
                          {formatMoney(tier.profitPerBundle)}
                        </td>
                        <td className={`py-3 px-3 font-mono-num ${tier.marginPerBundle >= desiredMargin ? "text-success" : tier.marginPerBundle >= 0.1 ? "text-amber-300" : "text-destructive"}`}>
                          {formatPct(tier.marginPerBundle)}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-col gap-1.5 max-w-[220px]">
                            <span className={`inline-flex w-fit rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${verdictTone(tier.verdict)}`}>
                              {tier.verdict}
                            </span>
                            <span className="admin-helper-text text-xs leading-snug">{tier.reason}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {tierRows.map((tier) => (
                  <div key={`${tier.quantity}-${tier.discountPct}`} className="rounded-lg border border-white/10 p-4 bg-white/5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-bold">{tier.quantity}+ entries · {tier.discountPct}%</div>
                      <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${verdictTone(tier.verdict)}`}>
                        {tier.verdict}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs td-soft">
                      <div>
                        Full: <span className="td-text font-mono-num">{formatMoney(tier.fullPrice)}</span>
                      </div>
                      <div>
                        Bundle: <span className="td-text font-mono-num">{formatMoney(tier.bundlePrice)}</span>
                      </div>
                      <div>
                        Eff ticket: <span className="td-text font-mono-num">{formatMoney(tier.effectiveTicket)}</span>
                      </div>
                      <div>
                        Fee: <span className="td-text font-mono-num">{formatMoney(tier.estFee)}</span>
                      </div>
                      <div>
                        Profit: <span className={`font-bold ${tier.profitPerBundle <= 0 ? "text-destructive" : "text-success"}`}>{formatMoney(tier.profitPerBundle)}</span>
                      </div>
                      <div>
                        Margin: <span className="font-mono-num">{formatPct(tier.marginPerBundle)}</span>
                      </div>
                    </div>
                    <p className="text-xs td-soft mt-3 leading-snug">{tier.reason}</p>
                  </div>
                ))}
              </div>
            </AdminPanel>

            <AdminPanel title="Suggested tier setup">
              <p className="text-xs td-soft">Advisory only. Apply tiers manually in discount code tooling if desired.</p>
              {suggested.weak ? <p className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 mt-3 text-sm text-amber-100">Use only a small 5+ discount until ticket price, entry cap or costs improve.</p> : null}
              <ul className="mt-3 space-y-2">
                {suggested.tiers.map((tier) => (
                  <li key={tier.quantity} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                    <div className="text-sm">
                      <span className="font-bold">{tier.quantity}+ entries:</span>{" "}
                      {tier.discountPct === null ? <span className="td-soft">drop tier</span> : <span className="text-primary font-bold">{tier.discountPct}% off</span>}
                    </div>
                    <div className="text-xs td-soft text-right max-w-[60%]">{tier.note}</div>
                  </li>
                ))}
              </ul>
            </AdminPanel>
          </div>
        </>
      )}
    </div>
  );
}
