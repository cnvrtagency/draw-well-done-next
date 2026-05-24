"use client";

import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import type { CompetitionDiscountTier } from "@/types/db";

export interface QuantityPricing {
  qty: number;
  subtotal: number;
  discount: number;
  total: number;
  discountPct: number;
  tier: CompetitionDiscountTier | null;
}

export function computePricing(
  ticketPrice: number,
  qty: number,
  tiers: CompetitionDiscountTier[],
): QuantityPricing {
  const subP = Math.round(ticketPrice * 100) * qty;
  const tier = [...tiers].reverse().find((t) => qty >= t.min_quantity) ?? null;
  const pct = tier ? Number(tier.discount_percentage) : 0;
  const discP = tier ? Math.floor((subP * pct) / 100) : 0;
  const totalP = Math.max(0, subP - discP);
  return {
    qty,
    subtotal: subP / 100,
    discount: discP / 100,
    total: totalP / 100,
    discountPct: pct,
    tier,
  };
}

interface Props {
  ticketPrice: number;
  remaining: number;
  maxEntries: number;
  perUserLimit?: number | null;
  tiers: CompetitionDiscountTier[];
  disabled: boolean;
  submitting: boolean;
  ctaLabel: string;
  isLive: boolean;
  value: number;
  onChange: (n: number) => void;
  onSubmit: () => void;
  profileBlocked?: boolean;
}

export function EntryQuantitySelector({
  ticketPrice,
  remaining,
  maxEntries,
  perUserLimit,
  tiers,
  disabled,
  submitting,
  ctaLabel,
  isLive,
  value,
  onChange,
  onSubmit,
  profileBlocked,
}: Props) {
  const sortedTiers = [...tiers].filter((t) => t.is_active !== false).sort((a, b) => a.min_quantity - b.min_quantity);
  const maxQty = Math.max(1, Math.min(remaining || 1, perUserLimit ?? Infinity));
  const qty = Math.min(Math.max(1, value), maxQty);
  const tierTiles = sortedTiers.map((t) => t.min_quantity);
  let tileQtys: number[];
  if (tierTiles.length > 0) {
    tileQtys = Array.from(new Set([1, ...tierTiles])).filter((q) => q <= maxQty).sort((a, b) => a - b);
  } else {
    tileQtys = [1, 5, 10, 25].filter((q) => q <= maxQty);
  }
  if (tileQtys.length === 0) tileQtys = [Math.min(1, maxQty)];

  const pricing = computePricing(ticketPrice, qty, sortedTiers);
  const nextTier = sortedTiers.find((t) => qty < t.min_quantity) ?? null;
  const ticketsToNext = nextTier ? nextTier.min_quantity - qty : 0;
  const atBest = sortedTiers.length > 0 && !nextTier;

  function setQty(n: number) {
    onChange(Math.max(1, Math.min(maxQty, Math.round(n))));
  }

  return (
    <div className="space-y-3.5 pt-1">
      <div>
        <div className="mb-2 text-[13px] font-extrabold uppercase tracking-[0.22em] text-info">Choose your tickets</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {tileQtys.map((q) => {
            const p = computePricing(ticketPrice, q, sortedTiers);
            const active = q === qty;
            return (
              <button
                key={q}
                type="button"
                disabled={disabled}
                onClick={() => setQty(q)}
                className={`relative flex flex-col items-start justify-between gap-1.5 text-left rounded-xl px-3 py-3 min-h-[88px] transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  active
                    ? "border-primary bg-primary/10 ring-1 ring-primary/50 shadow-[0_0_22px_-6px_hsl(var(--primary)/0.65)]"
                    : "td-quantity-tile"
                }`}
              >
                <div className="w-full flex flex-col gap-1">
                  <div className={`font-mono-num font-extrabold leading-none text-[color:var(--td-text)] ${active ? "text-xl" : "text-lg"}`}>{q}</div>
                  <div className="td-muted text-[11px] font-mono-num leading-none">{formatMoney(p.total)}</div>
                </div>
                {p.discountPct > 0 ? (
                  <div className="inline-flex items-center whitespace-nowrap leading-none text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-success/20 text-success border border-success/40">
                    Save {p.discountPct}%
                  </div>
                ) : (
                  <div className="td-badge-muted inline-flex items-center whitespace-nowrap leading-none text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded">
                    No discount
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[color:var(--td-text)]">
            Selected: <span className="font-mono-num">{qty}</span> {qty === 1 ? "TICKET" : "TICKETS"} | Est. chance 1 in {maxEntries > 0 ? Math.ceil(maxEntries / qty).toLocaleString() : "-"}
          </span>
          {perUserLimit ? <span className="td-faint font-mono-num text-[11px]">Max {perUserLimit} per person</span> : null}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" disabled={disabled || qty <= 1} onClick={() => setQty(qty - 1)} className="td-icon-button w-9 h-9 shrink-0 rounded-md border td-border text-lg font-bold disabled:opacity-40" aria-label="Decrease quantity">
            −
          </button>
          <input
            type="range"
            min={1}
            max={maxQty}
            step={1}
            value={qty}
            disabled={disabled}
            onChange={(e) => setQty(Number(e.target.value))}
            aria-label="Quantity"
            className="entry-range entry-range--slim flex-1 disabled:opacity-40"
            style={{
              background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${((qty - 1) / Math.max(1, maxQty - 1)) * 100}%, hsl(var(--muted)) ${((qty - 1) / Math.max(1, maxQty - 1)) * 100}%, hsl(var(--muted)) 100%)`,
            }}
          />
          <button type="button" disabled={disabled || qty >= maxQty} onClick={() => setQty(qty + 1)} className="td-icon-button w-9 h-9 shrink-0 rounded-md border td-border text-lg font-bold disabled:opacity-40" aria-label="Increase quantity">
            +
          </button>
        </div>
      </div>

      {sortedTiers.length > 0 && (
        <div className="text-center text-[12px] font-extrabold uppercase tracking-wider text-info">
          {nextTier ? (
            <span>Add {ticketsToNext} more {ticketsToNext === 1 ? "entry" : "entries"} to unlock {Number(nextTier.discount_percentage)}% off</span>
          ) : atBest ? (
            <span className="text-success">Best discount unlocked</span>
          ) : null}
        </div>
      )}

      <div className="td-minicart-card rounded-xl px-3.5 py-2.5">
        <div className="eyebrow !mb-1.5">Order summary</div>
        <dl className="text-[13px] space-y-1">
          <div className="flex justify-between td-muted">
            <dt>Tickets</dt>
            <dd className="font-mono-num text-[color:var(--td-text)]">{qty}</dd>
          </div>
          <div className="flex justify-between td-muted">
            <dt>Price per ticket</dt>
            <dd className="font-mono-num">{formatMoney(ticketPrice)}</dd>
          </div>
          {pricing.discount > 0 ? (
            <div className="flex justify-between text-success">
              <dt>Discount ({pricing.discountPct}%)</dt>
              <dd className="font-mono-num">−{formatMoney(pricing.discount)}</dd>
            </div>
          ) : (
            <div className="flex justify-between td-soft">
              <dt>Discount</dt>
              <dd>None</dd>
            </div>
          )}
          {qty > 0 && maxEntries > 0 && (
            <div className="flex justify-between td-muted">
              <dt className="flex items-center gap-1.5">
                <span>Estimated chance</span>
                <button
                  type="button"
                  aria-label="About estimated chance"
                  title="This estimate uses your selected ticket quantity against the maximum ticket cap for this competition. Actual chances may vary depending on the final number of valid paid and free postal entries included in the draw."
                  className="text-primary/70 hover:text-primary"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </dt>
              <dd className="font-mono-num text-[color:var(--td-text)]">1 in {Math.ceil(maxEntries / qty).toLocaleString()}</dd>
            </div>
          )}
          <div className="flex justify-between border-t td-border pt-1.5 mt-1">
            <dt className="font-bold text-[color:var(--td-text)] text-sm">Total</dt>
            <dd className="flex items-baseline justify-end gap-2">
              {pricing.discount > 0 && pricing.subtotal > pricing.total && (
                <span className="font-mono-num font-extrabold text-sm leading-none td-faint line-through">{formatMoney(pricing.subtotal)}</span>
              )}
              <span className={`font-mono-num font-extrabold text-base leading-none ${pricing.discount > 0 && pricing.subtotal > pricing.total ? "text-success" : "text-[color:var(--td-text)]"}`}>{formatMoney(pricing.total)}</span>
            </dd>
          </div>
        </dl>
      </div>

      {profileBlocked && (
        <div className="text-xs rounded-md border border-yellow-500/40 bg-yellow-500/10 text-yellow-200 p-2">
          <div className="font-bold">Profile incomplete</div>
          <div className="mt-1">Add your date of birth, confirm you are 18+, and accept the terms before entering.</div>
        </div>
      )}

      <Button
        className="w-full h-11 text-[13px] uppercase tracking-wider font-extrabold bg-primary hover:bg-primary/90 shadow-glow-soft"
        disabled={submitting || disabled || profileBlocked}
        onClick={onSubmit}
      >
        {submitting ? "Adding…" : isLive ? `${ctaLabel} · ${formatMoney(pricing.total)}` : ctaLabel}
      </Button>
    </div>
  );
}
