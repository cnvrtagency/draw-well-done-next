"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  Mail,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trophy,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { useBasket } from "@/hooks/useBasket";
import { SafePrizeImage } from "@/components/SafePrizeImage";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/Panel";
import { formatMoney } from "@/lib/format";
import { CountdownPill } from "@/components/ui/CountdownPill";
import { computePricing } from "@/components/EntryQuantitySelector";
import type { CompetitionDiscountTier } from "@/types/db";
import { competitionThumbImageUrl } from "@/lib/competitionImages";

type BundleCompetition = {
  id: string;
  title: string;
  slug: string;
  ticket_price: number;
  cash_alternative: number | null;
  max_entries: number;
  current_entries: number;
  manual_reserved_entries?: number | null;
  per_user_entry_limit: number | null;
  opens_at: string | null;
  closes_at: string | null;
  main_image_url: string | null;
  image_original_url?: string | null;
  image_card_url?: string | null;
  image_detail_url?: string | null;
  image_thumb_url?: string | null;
  status: string;
};

const BADGES = [
  { icon: BadgeCheck, label: "Live competitions only" },
  { icon: ShieldCheck, label: "Ticket caps still apply" },
  { icon: Trophy, label: "Secure checkout" },
  { icon: Mail, label: "Free postal entry route" },
];

function remainingFor(c: BundleCompetition) {
  return Math.max(0, Number(c.max_entries || 0) - Number(c.current_entries || 0) - (Number(c.manual_reserved_entries) || 0));
}

export function BundleBuilder() {
  const supabase = createSupabaseBrowserClient();
  const { add, openDrawer } = useBasket();
  const [comps, setComps] = useState<BundleCompetition[] | null>(null);
  const [tiersByComp, setTiersByComp] = useState<Record<string, CompetitionDiscountTier[]>>({});
  const [qty, setQty] = useState<Record<string, number>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setComps([]);
      setError("Competition data is not configured.");
      return;
    }
    let cancelled = false;
    const nowIso = new Date().toISOString();
    setError(null);
    supabase
      .from("competitions")
      .select("id,title,slug,ticket_price,cash_alternative,max_entries,current_entries,manual_reserved_entries,per_user_entry_limit,opens_at,closes_at,main_image_url,image_original_url,image_card_url,image_detail_url,image_thumb_url,status")
      .eq("status", "live")
      .is("archived_at", null)
      .or(`opens_at.is.null,opens_at.lte.${nowIso}`)
      .or(`closes_at.is.null,closes_at.gt.${nowIso}`)
      .order("closes_at", { ascending: true, nullsFirst: false })
      .limit(24)
      .then(({ data, error: queryError }: { data: unknown[] | null; error: { message: string } | null }) => {
        if (cancelled) return;
        if (queryError) {
          setError(queryError.message);
          setComps([]);
          return;
        }
        const rows = ((data ?? []) as BundleCompetition[])
          .map((r) => ({ ...r, ticket_price: Number(r.ticket_price) }))
          .filter((r) => remainingFor(r) > 0);
        setComps(rows);
      });
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !comps || comps.length === 0) return;
    let cancelled = false;
    const ids = comps.map((c) => c.id);
    supabase
      .from("competition_discount_tiers")
      .select("id,competition_id,min_quantity,discount_percentage,label,is_active,sort_order")
      .in("competition_id", ids)
      .eq("is_active", true)
      .order("min_quantity", { ascending: true })
      .then(({ data }: { data: unknown[] | null }) => {
        if (cancelled) return;
        const grouped: Record<string, CompetitionDiscountTier[]> = {};
        ((data ?? []) as CompetitionDiscountTier[]).forEach((t) => {
          const tier = { ...t, discount_percentage: Number(t.discount_percentage) };
          (grouped[tier.competition_id] ||= []).push(tier);
        });
        setTiersByComp(grouped);
      });
    return () => {
      cancelled = true;
    };
  }, [comps, supabase]);

  const capFor = (c: BundleCompetition) => {
    const perUser = c.per_user_entry_limit ?? Infinity;
    return Math.max(0, Math.min(remainingFor(c), perUser));
  };

  const setQ = (c: BundleCompetition, next: number) => {
    const max = capFor(c);
    const clamped = Math.max(0, Math.min(next, max));
    setNotice(null);
    setQty((prev) => ({ ...prev, [c.id]: clamped }));
  };

  const lineFor = (c: BundleCompetition) => {
    const q = qty[c.id] ?? 0;
    const tiers = (tiersByComp[c.id] ?? []).filter((t) => t.is_active !== false).sort((a, b) => a.min_quantity - b.min_quantity);
    const p = computePricing(c.ticket_price, Math.max(1, q), tiers);
    if (q === 0) return { q, subtotal: 0, discount: 0, total: 0, discountPct: 0, tiers, nextTier: tiers[0] ?? null };
    const nextTier = tiers.find((t) => q < t.min_quantity) ?? null;
    return { q, subtotal: p.subtotal, discount: p.discount, total: p.total, discountPct: p.discountPct, tiers, nextTier };
  };

  const totals = useMemo(() => {
    let entries = 0;
    let subtotal = 0;
    let discount = 0;
    let total = 0;
    let selected = 0;
    for (const c of comps ?? []) {
      const l = lineFor(c);
      if (l.q > 0) {
        selected += 1;
        entries += l.q;
        subtotal += l.subtotal;
        discount += l.discount;
        total += l.total;
      }
    }
    return { entries, subtotal, discount, total, selected };
    // lineFor closes over qty/tiersByComp intentionally.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qty, comps, tiersByComp]);

  const handleAdd = () => {
    if (!comps) return;
    let added = 0;
    for (const c of comps) {
      const q = qty[c.id] ?? 0;
      if (q > 0) {
        add(c.id, q);
        added += q;
      }
    }
    if (added === 0) return;
    setNotice(`${added} ${added === 1 ? "ticket" : "tickets"} added across ${totals.selected} ${totals.selected === 1 ? "competition" : "competitions"}.`);
    setQty({});
    openDrawer();
  };

  if (comps === null) {
    return (
      <Panel variant="glass" className="p-6 md:p-8 animate-pulse">
        <div className="h-6 w-48 bg-[color:var(--td-surface-hover)] rounded mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-[color:var(--td-surface-muted)] rounded-lg" />
          ))}
        </div>
      </Panel>
    );
  }

  if (comps.length === 0) {
    return (
      <Panel variant="glass" className="p-10 md:p-14 text-center">
        <span className="inline-grid place-items-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary shadow-glow-soft mb-4">
          <Sparkles className="w-5 h-5" />
        </span>
        <h3 className="font-display text-lg md:text-xl font-bold td-text tracking-tight">Bundle builder will appear when live competitions are available.</h3>
        <p className="text-sm td-muted mt-2 max-w-md mx-auto">{error || "Check back shortly, new prize drops are added regularly."}</p>
        <Button asChild variant="outline" className="mt-5 border-[color:var(--td-border-strong)] text-[color:var(--td-text)] hover:bg-[color:var(--td-surface-hover)] hover:text-[color:var(--td-text)]">
          <Link href="/competitions">View competitions</Link>
        </Button>
      </Panel>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-5 md:gap-6 items-start">
      <Panel variant="glass" className="lg:col-span-2 p-3 md:p-4">
        {notice ? <div className="mb-3 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-xs font-bold text-success">{notice}</div> : null}
        <ul className="space-y-2.5">
          {comps.map((c) => {
            const l = lineFor(c);
            const max = capFor(c);
            const isSel = l.q > 0;
            const isExp = !!expanded[c.id];
            const ticketsLeft = remainingFor(c);
            return (
              <li
                key={c.id}
                className={`rounded-lg border p-3 transition-all ${
                  isSel
                    ? "border-primary/35 bg-primary/[0.04] shadow-[0_0_18px_-12px_hsl(var(--primary)/0.5)]"
                    : "td-minicart-card"
                }`}
              >
                <div className="md:grid md:grid-cols-[140px_minmax(0,1fr)_150px] md:gap-5 md:items-center">
                  <div className="flex items-start gap-3 md:contents">
                    <Link href={`/competitions/${c.slug}`} className="shrink-0 md:block">
                      <div className="w-24 h-24 md:w-[140px] md:h-[140px] rounded-xl overflow-hidden border td-border bg-[color:var(--td-image-placeholder)]">
                        <SafePrizeImage url={competitionThumbImageUrl(c)} alt={c.title} aspect="aspect-square" imgClassName="h-full" width={200} height={200} />
                      </div>
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link href={`/competitions/${c.slug}`} className="block font-display font-bold tracking-tight td-text text-sm md:text-base line-clamp-2 md:line-clamp-1 hover:text-primary" title={c.title}>
                        {c.title}
                      </Link>
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap text-[11px] font-mono-num td-muted min-w-0">
                        <span className="td-text font-bold">{formatMoney(c.ticket_price)}</span>
                        <span className="td-faint">·</span>
                        <span className="whitespace-nowrap">{ticketsLeft.toLocaleString()} left</span>
                        {c.closes_at ? (
                          <>
                            <span className="td-faint">·</span>
                            <CountdownPill closesAt={c.closes_at} prefix="" />
                          </>
                        ) : null}
                      </div>
                      <div className="mt-2 hidden md:flex flex-wrap items-center gap-1.5">
                        {l.tiers.length > 0 ? (
                          <>
                            <span className="text-[10px] uppercase tracking-wider font-bold td-faint mr-0.5">Discounts</span>
                            {l.tiers.map((t) => {
                              const reached = l.q >= t.min_quantity;
                              const isNext = !reached && l.nextTier?.id === t.id;
                              const cls = reached
                                ? "bg-emerald-400/12 border-emerald-400/30 text-emerald-300"
                                : isNext
                                  ? "bg-primary/10 border-primary/30 text-primary"
                                  : "td-badge-muted";
                              return (
                                <span key={t.id} className={`inline-flex items-center whitespace-nowrap text-[10px] font-mono-num font-bold px-2 py-0.5 rounded border ${cls}`}>
                                  {t.min_quantity}+ save {Number(t.discount_percentage)}%
                                </span>
                              );
                            })}
                          </>
                        ) : (
                          <span className="text-[11px] td-faint">No multi-ticket discounts</span>
                        )}
                      </div>
                      <div className="mt-1.5 text-xs text-primary/90">
                        {l.tiers.length === 0 ? null : l.q === 0 ? (
                          <span className="td-soft">Savings from {l.tiers[0].min_quantity} tickets.</span>
                        ) : l.nextTier ? (
                          <span>Add {l.nextTier.min_quantity - l.q} more {l.nextTier.min_quantity - l.q === 1 ? "ticket" : "tickets"} to unlock {Number(l.nextTier.discount_percentage)}% off.</span>
                        ) : (
                          <span className="text-emerald-300 font-bold">Best saving unlocked.</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setExpanded((p) => ({ ...p, [c.id]: !isExp }))}
                        className="mt-1.5 inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wider td-soft hover:text-[color:var(--td-text)]"
                      >
                        Details <ChevronDown className={`w-3 h-3 transition-transform ${isExp ? "rotate-180" : ""}`} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 md:mt-0 flex items-center justify-between md:flex-col md:items-end md:gap-1">
                    <div className="hidden md:block text-[10px] uppercase tracking-wider font-bold td-faint">Tickets</div>
                    <div className="td-minicart-qty inline-flex items-center rounded-md">
                      <button onClick={() => setQ(c, l.q - 1)} disabled={l.q <= 0} className="w-9 h-9 grid place-items-center td-text hover:bg-[color:var(--td-surface-hover)] disabled:opacity-30 disabled:cursor-not-allowed" aria-label="Decrease">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={l.q}
                        onChange={(e) => {
                          const n = parseInt(e.target.value.replace(/\D/g, ""), 10);
                          setQ(c, Number.isNaN(n) ? 0 : n);
                        }}
                        className="w-10 text-center text-sm font-mono-num font-bold td-text bg-transparent outline-none"
                        aria-label="Quantity"
                      />
                      <button onClick={() => setQ(c, l.q + 1)} disabled={l.q >= max} className="w-9 h-9 grid place-items-center td-text hover:bg-[color:var(--td-surface-hover)] disabled:opacity-30 disabled:cursor-not-allowed" aria-label="Increase">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-sm md:text-xs font-mono-num font-bold td-text md:mt-0.5 text-right">
                      {isSel ? formatMoney(l.total) : <span className="td-faint">-</span>}
                      {isSel && l.discount > 0 ? <span className="ml-1.5 text-[10px] font-mono-num td-faint line-through font-normal">{formatMoney(l.subtotal)}</span> : null}
                    </div>
                  </div>
                </div>

                <div className="md:hidden mt-2 text-[11px] td-soft">
                  {l.tiers.length === 0 ? (
                    <span>No multi-ticket discounts</span>
                  ) : l.q === 0 ? (
                    <span>Savings from {l.tiers[0].min_quantity} tickets.</span>
                  ) : l.nextTier ? (
                    <span className="text-primary/90">Add {l.nextTier.min_quantity - l.q} more to unlock {Number(l.nextTier.discount_percentage)}% off.</span>
                  ) : (
                    <span className="text-emerald-300 font-bold">Best saving unlocked.</span>
                  )}
                </div>

                {isExp ? (
                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] td-muted border-t td-border pt-2">
                    <dt>Ticket price</dt><dd className="text-right font-mono-num td-text">{formatMoney(c.ticket_price)}</dd>
                    <dt>Selected tickets</dt><dd className="text-right font-mono-num td-text">{l.q}</dd>
                    <dt>Subtotal</dt><dd className="text-right font-mono-num td-text">{formatMoney(l.subtotal)}</dd>
                    <dt>Discount</dt><dd className="text-right font-mono-num text-emerald-300">{l.discount > 0 ? `-${formatMoney(l.discount)}` : "-"}</dd>
                    <dt>Row total</dt><dd className="text-right font-mono-num font-bold td-text">{formatMoney(l.total)}</dd>
                    <dt>Tickets left</dt><dd className="text-right font-mono-num td-text">{ticketsLeft.toLocaleString()}</dd>
                    <dd className="col-span-2 text-[10.5px] td-faint mt-1">Free postal entry route available, no purchase necessary.</dd>
                  </dl>
                ) : null}
              </li>
            );
          })}
        </ul>
      </Panel>

      <div className="lg:sticky lg:top-24 self-start">
        <Panel variant="glass" tone="primary" className="p-5">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-primary mb-2">Bundle summary</div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="td-minicart-card rounded-lg p-3">
              <div className="text-[10px] uppercase tracking-wider td-soft font-bold">Competitions</div>
              <div className="font-mono-num text-xl font-extrabold td-text mt-1">{totals.selected}</div>
            </div>
            <div className="td-minicart-card rounded-lg p-3">
              <div className="text-[10px] uppercase tracking-wider td-soft font-bold">Total tickets</div>
              <div className="font-mono-num text-xl font-extrabold td-text mt-1">{totals.entries}</div>
            </div>
          </div>
          <dl className="text-sm space-y-1.5 border-t td-border pt-3">
            <div className="flex justify-between td-muted"><dt>Subtotal</dt><dd className="font-mono-num td-text">{formatMoney(totals.subtotal)}</dd></div>
            <div className="flex justify-between">
              <dt className={totals.discount > 0 ? "text-emerald-300" : "td-soft"}>Discount savings</dt>
              <dd className={`font-mono-num ${totals.discount > 0 ? "text-emerald-300" : "td-soft"}`}>{totals.discount > 0 ? `-${formatMoney(totals.discount)}` : formatMoney(0)}</dd>
            </div>
            <div className="flex justify-between border-t td-border pt-2 mt-1">
              <dt className="font-bold td-text">Final total</dt>
              <dd className="font-mono-num font-extrabold td-text text-xl leading-none">{formatMoney(totals.total)}</dd>
            </div>
          </dl>
          <p className="text-[11px] td-soft mt-1.5">Final price confirmed securely at checkout.</p>
          <div className="td-minicart-card mt-4 rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-wider td-soft font-bold mb-2">Selected prizes</div>
            {totals.selected === 0 ? (
              <p className="text-[11px] td-soft">Choose tickets from the prize list to build your bundle.</p>
            ) : (
              <ul className="space-y-1.5">
                {(comps ?? []).filter((c) => (qty[c.id] ?? 0) > 0).map((c) => {
                  const l = lineFor(c);
                  return (
                    <li key={c.id} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center text-[11.5px] min-w-0">
                      <span className="td-text line-clamp-1 min-w-0" title={c.title}>{c.title}</span>
                      <span className="font-mono-num td-muted shrink-0">x{l.q}</span>
                      <span className="font-mono-num font-bold td-text shrink-0 min-w-[3.5rem] text-right">{formatMoney(l.total)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <Button onClick={handleAdd} disabled={totals.entries === 0} className="w-full mt-4 btn-primary-glow font-extrabold uppercase tracking-wider">
            <ShoppingBag className="w-4 h-4 mr-1.5" />
            {totals.entries === 0 ? "Add bundle to basket" : `Add bundle · ${formatMoney(totals.total)}`}
          </Button>
          {totals.entries === 0 ? <p className="text-[11px] td-soft text-center mt-2">Choose at least one ticket.</p> : null}
          <Button asChild variant="outline" className="w-full mt-2 border-[color:var(--td-border-strong)] text-[color:var(--td-text)] bg-transparent hover:bg-[color:var(--td-surface-hover)] hover:text-[color:var(--td-text)] font-bold">
            <Link href="/competitions">View all competitions <ArrowRight className="w-3.5 h-3.5 ml-1" /></Link>
          </Button>
          <ul className="mt-5 grid grid-cols-2 gap-1.5">
            {BADGES.map((b) => (
              <li key={b.label} className="flex items-center gap-1.5 text-[10.5px] td-muted">
                <b.icon className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="leading-tight">{b.label}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
