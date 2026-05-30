export interface CalcInputs {
  prizeName: string;
  prizeCost: number;
  cashAlternative: number;
  ticketPrice: number;
  entryCap: number;
  maxEntriesPerUser: number;
  providerFeePct: number; // 2.9 = 2.9%
  providerFixedFee: number;
  avgEntriesPerOrder: number;
  adSpend: number;
  otherCosts: number;
  avgDiscountPct: number; // 0-100
  desiredMarginPct: number; // 0-100
  targetEntriesPerCustomer: number;
  desiredAOV: number;
  tiers: TierInput[];
}

export interface TierInput {
  quantity: number;
  discountPct: number; // 0-100
}

export const DEFAULT_INPUTS: CalcInputs = {
  prizeName: "New competition",
  prizeCost: 0,
  cashAlternative: 0,
  ticketPrice: 0,
  entryCap: 0,
  maxEntriesPerUser: 0,
  providerFeePct: 0,
  providerFixedFee: 0,
  avgEntriesPerOrder: 0,
  adSpend: 0,
  otherCosts: 0,
  avgDiscountPct: 0,
  desiredMarginPct: 0,
  targetEntriesPerCustomer: 0,
  desiredAOV: 0,
  tiers: [
    { quantity: 5, discountPct: 0 },
    { quantity: 10, discountPct: 0 },
    { quantity: 25, discountPct: 0 },
    { quantity: 50, discountPct: 0 },
  ],
};

const safe = (n: number) => (Number.isFinite(n) ? n : 0);
const div = (a: number, b: number) => (b === 0 ? 0 : a / b);

export interface CoreResult {
  prizeLiability: number;
  grossRevenue: number;
  discountCost: number;
  netRevenue: number;
  estOrders: number;
  providerPctFee: number;
  providerFixedFees: number;
  totalProviderFees: number;
  totalFixedCosts: number;
  totalCosts: number;
  netProfit: number;
  margin: number; // 0-1
  breakEvenEntries: number;
  breakEvenPct: number; // 0-1
  breakEvenRevenue: number;
  fixedCostPerEntry: number;
}

export function compute(i: CalcInputs): CoreResult {
  const prizeLiability = Math.max(safe(i.prizeCost), safe(i.cashAlternative));
  const grossRevenue = safe(i.ticketPrice) * safe(i.entryCap);
  const discountCost = grossRevenue * (safe(i.avgDiscountPct) / 100);
  const netRevenue = grossRevenue - discountCost;
  const estOrders = div(safe(i.entryCap), safe(i.avgEntriesPerOrder));
  const providerPctFee = netRevenue * (safe(i.providerFeePct) / 100);
  const providerFixedFees = estOrders * safe(i.providerFixedFee);
  const totalProviderFees = providerPctFee + providerFixedFees;
  const totalFixedCosts = prizeLiability + safe(i.adSpend) + safe(i.otherCosts);
  const totalCosts = totalFixedCosts + totalProviderFees;
  const netProfit = netRevenue - totalCosts;
  const margin = div(netProfit, netRevenue);
  const breakEvenEntries = div(totalCosts, safe(i.ticketPrice));
  const breakEvenPct = div(breakEvenEntries, safe(i.entryCap));
  const breakEvenRevenue = breakEvenEntries * safe(i.ticketPrice);
  const fixedCostPerEntry = div(totalFixedCosts, safe(i.entryCap));

  return {
    prizeLiability,
    grossRevenue,
    discountCost,
    netRevenue,
    estOrders,
    providerPctFee,
    providerFixedFees,
    totalProviderFees,
    totalFixedCosts,
    totalCosts,
    netProfit,
    margin,
    breakEvenEntries,
    breakEvenPct,
    breakEvenRevenue,
    fixedCostPerEntry,
  };
}

export interface ScenarioRow {
  pct: number;
  entriesSold: number;
  grossRevenue: number;
  netRevenue: number;
  fees: number;
  totalCosts: number;
  profit: number;
  margin: number;
  isCrossover: boolean;
}

export function scenarios(i: CalcInputs, core: CoreResult): ScenarioRow[] {
  const pcts = [0.25, 0.5, 0.75, 1];
  const rows = pcts.map((pct) => {
    const entriesSold = safe(i.entryCap) * pct;
    const grossRevenue = entriesSold * safe(i.ticketPrice);
    const discountCost = grossRevenue * (safe(i.avgDiscountPct) / 100);
    const netRevenue = grossRevenue - discountCost;
    const orders = div(entriesSold, safe(i.avgEntriesPerOrder));
    const fees = netRevenue * (safe(i.providerFeePct) / 100) + orders * safe(i.providerFixedFee);
    const fixed = core.totalFixedCosts;
    const totalCosts = fixed + fees;
    const profit = netRevenue - totalCosts;
    const margin = div(profit, netRevenue);

    return { pct, entriesSold, grossRevenue, netRevenue, fees, totalCosts, profit, margin, isCrossover: false };
  });

  const first = rows.find((r) => r.profit >= 0);
  if (first) first.isCrossover = true;

  return rows;
}

type TierVerdict = "recommended" | "caution" | "too_aggressive";

export interface TierResult extends TierInput {
  fullPrice: number;
  bundlePrice: number;
  effectiveTicket: number;
  discountCost: number;
  estFee: number;
  fixedCostPerBundle: number;
  profitPerBundle: number;
  marginPerBundle: number;
  verdict: TierVerdict;
  reason: string;
}

export function evaluateTiers(i: CalcInputs, core: CoreResult): TierResult[] {
  const desired = safe(i.desiredMarginPct) / 100;
  return i.tiers.map((t) => evaluateTier(t, i, core, desired));
}

function evaluateTier(t: TierInput, i: CalcInputs, core: CoreResult, desired: number): TierResult {
  const qty = safe(t.quantity);
  const disc = safe(t.discountPct) / 100;
  const fullPrice = safe(i.ticketPrice) * qty;
  const bundlePrice = fullPrice * (1 - disc);
  const effectiveTicket = div(bundlePrice, qty);
  const discountCost = fullPrice - bundlePrice;
  const estFee = bundlePrice * (safe(i.providerFeePct) / 100) + safe(i.providerFixedFee);
  const fixedCostPerBundle = core.fixedCostPerEntry * qty;
  const profitPerBundle = bundlePrice - estFee - fixedCostPerBundle;
  const marginPerBundle = div(profitPerBundle, bundlePrice);

  let verdict: TierVerdict = "recommended";
  let reason = "Healthy margin at this quantity. Good tier for encouraging multi-entry orders.";

  const tooAggressive = marginPerBundle < 0.1 || profitPerBundle <= 0 || effectiveTicket < core.fixedCostPerEntry;
  const isCaution =
    marginPerBundle < desired ||
    (core.breakEvenPct > 0.7 && t.discountPct >= 15) ||
    (i.ticketPrice < 1 && t.discountPct >= 15);

  if (tooAggressive) {
    verdict = "too_aggressive";
    if (effectiveTicket < core.fixedCostPerEntry) {
      reason = "Effective ticket price falls below fixed cost per entry. This tier loses money on the prize and ad spend allocation.";
    } else if (profitPerBundle <= 0) {
      reason = "This tier produces no profit per bundle. Reduce discount or raise ticket price.";
    } else {
      reason = "Margin under 10%. Too aggressive, leaves no room for fees, refunds or surprises.";
    }
  } else if (isCaution) {
    verdict = "caution";
    if (marginPerBundle < desired) {
      reason = "Margin drops below your target. Consider reducing this discount.";
    } else if (i.ticketPrice < 1 && t.discountPct >= 15) {
      reason = "Low ticket price plus high discount leaves limited room for fees and ad spend.";
    } else {
      reason = "Break-even is already high, large discounts add risk at this sell-through.";
    }
  }

  return {
    ...t,
    fullPrice,
    bundlePrice,
    effectiveTicket,
    discountCost,
    estFee,
    fixedCostPerBundle,
    profitPerBundle,
    marginPerBundle,
    verdict,
    reason,
  };
}

export interface SuggestedTier {
  quantity: number;
  discountPct: number | null; // null = drop tier
  note: string;
}

const CAPS: Record<number, [number, number]> = {
  5: [0, 5],
  10: [5, 10],
  25: [10, 15],
  50: [10, 20],
};

export function suggestTiers(i: CalcInputs, core: CoreResult): { tiers: SuggestedTier[]; weak: boolean } {
  const desired = safe(i.desiredMarginPct) / 100;
  const weak = core.margin < Math.max(0.1, desired * 0.5) || core.netProfit <= 0;
  const tiers: SuggestedTier[] = i.tiers.map((t) => {
    const cap = CAPS[t.quantity] ?? [0, t.discountPct];
    const [lo, hi] = cap;
    let chosen: number | null = null;

    for (let d = hi; d >= lo; d--) {
      const ev = evaluateTier({ quantity: t.quantity, discountPct: d }, i, core, desired);
      if (ev.verdict !== "too_aggressive" && ev.marginPerBundle >= desired) {
        chosen = d;
        break;
      }
    }

    if (chosen === null) {
      const ev = evaluateTier({ quantity: t.quantity, discountPct: lo }, i, core, desired);
      if (ev.verdict !== "too_aggressive" && ev.profitPerBundle > 0) {
        return {
          quantity: t.quantity,
          discountPct: lo,
          note: lo === 0 ? "No discount safely fits this tier." : "Conservative discount for this tier.",
        };
      }
      return {
        quantity: t.quantity,
        discountPct: null,
        note: "Margin too tight, drop this tier.",
      };
    }

    return {
      quantity: t.quantity,
      discountPct: chosen,
      note: "Keeps margin above your target.",
    };
  });

  return { tiers, weak };
}

export function recommendations(i: CalcInputs, core: CoreResult): string[] {
  const out: string[] = [];
  const desired = safe(i.desiredMarginPct) / 100;

  if (core.netProfit < 0) {
    out.push(
      "This setup is projected to lose money even at full sell-out. Increase ticket price, raise the entry cap, reduce prize cost or lower ad spend.",
    );
  }
  if (core.breakEvenPct > 0.8) {
    out.push("High risk. You need to sell more than 80% of entries to break even.");
  } else if (core.breakEvenPct >= 0.6) {
    out.push("Moderate risk. This can work, but it relies on strong sell-through.");
  }

  if (core.netProfit >= 0 && core.margin >= desired) {
    out.push("Commercially healthy based on your assumptions.");
  }

  if (i.ticketPrice < 1 && i.providerFixedFee >= 0.2) {
    out.push("Low ticket prices are sensitive to fixed payment fees. Encourage bundles to improve average order value.");
  }

  if (safe(i.adSpend) === 0) {
    out.push("No ad spend allowance is included. Add a realistic acquisition budget before launching paid campaigns.");
  }

  if (safe(i.cashAlternative) > safe(i.prizeCost)) {
    out.push("Cash alternative is higher than prize cost, so it is treated as the prize liability.");
  }

  return out;
}

export function formatPct(n: number, digits = 1): string {
  if (!Number.isFinite(n)) return "0%";
  return `${(n * 100).toFixed(digits)}%`;
}
