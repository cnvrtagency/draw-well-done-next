"use client";

import Link from "next/link";
import { ArrowRight, BadgePercent, Minus, Plus, ShoppingBag, Sparkles, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useBasket } from "@/hooks/useBasket";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { competitionThumbImageUrl } from "@/lib/competitionImages";
import { formatMoney } from "@/lib/format";

type CompLite = {
  id: string;
  title: string;
  slug: string;
  ticket_price: number;
  main_image_url: string | null;
  image_original_url?: string | null;
  image_card_url?: string | null;
  image_detail_url?: string | null;
  image_thumb_url?: string | null;
  status: string;
  max_entries: number;
  current_entries: number;
  manual_reserved_entries?: number | null;
  per_user_entry_limit?: number | null;
};

type TierLite = { min_quantity: number; discount_percentage: number };

export function MiniCartTrigger() {
  const { count, openDrawer } = useBasket();
  return (
    <button
      type="button"
      aria-label={`Basket (${count} items)`}
      onClick={openDrawer}
      className="td-header-control td-icon-button relative grid h-10 w-10 place-items-center rounded-xl focus-visible:ring-2 focus-visible:ring-primary/60"
    >
      <ShoppingBag className="w-5 h-5" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-white text-[10px] font-extrabold grid place-items-center">
          {count}
        </span>
      )}
    </button>
  );
}

export function MiniCart() {
  const supabase = createSupabaseBrowserClient();
  const { items, count, update, remove, isOpen, setDrawerOpen } = useBasket();
  const [comps, setComps] = useState<Record<string, CompLite>>({});
  const [tiersByComp, setTiersByComp] = useState<Record<string, TierLite[]>>({});
  const [limitMessage, setLimitMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase || !isOpen || items.length === 0) return;
    const ids = items.map((i) => i.competition_id);
    supabase
      .from("competitions")
      .select("id,title,slug,ticket_price,main_image_url,image_original_url,image_card_url,image_detail_url,image_thumb_url,status,max_entries,current_entries,manual_reserved_entries,per_user_entry_limit")
      .in("id", ids)
      .then(({ data }: { data: any[] | null }) => {
        const map: Record<string, CompLite> = {};
        for (const c of (data ?? []) as any[]) map[c.id] = { ...c, ticket_price: Number(c.ticket_price) };
        setComps(map);
      });
    supabase
      .from("competition_discount_tiers")
      .select("competition_id,min_quantity,discount_percentage,is_active")
      .in("competition_id", ids)
      .eq("is_active", true)
      .then(({ data }: { data: any[] | null }) => {
        const map: Record<string, TierLite[]> = {};
        for (const r of (data ?? []) as any[]) {
          (map[r.competition_id] ||= []).push({
            min_quantity: Number(r.min_quantity),
            discount_percentage: Number(r.discount_percentage),
          });
        }
        for (const k of Object.keys(map)) map[k].sort((a, b) => a.min_quantity - b.min_quantity);
        setTiersByComp(map);
      });
  }, [isOpen, items, supabase]);

  useEffect(() => {
    for (const i of items) {
      const c = comps[i.competition_id];
      if (!c) continue;
      const remaining = Math.max(0, c.max_entries - c.current_entries - (Number(c.manual_reserved_entries) || 0));
      const perUser = c.per_user_entry_limit ?? Infinity;
      const cap = Math.max(0, Math.min(remaining, perUser));
      if (i.quantity > cap) update(i.competition_id, cap);
    }
  }, [comps, items, update]);

  function activeTierFor(compId: string, qty: number) {
    const tiers = tiersByComp[compId];
    if (!tiers || tiers.length === 0) return null;
    let active: TierLite | null = null;
    for (const t of tiers) if (qty >= t.min_quantity) active = t;
    return active;
  }

  const subtotal = items.reduce((sum, i) => {
    const c = comps[i.competition_id];
    return sum + (c ? c.ticket_price * i.quantity : 0);
  }, 0);
  const savings = items.reduce((sum, i) => {
    const c = comps[i.competition_id];
    const tier = activeTierFor(i.competition_id, i.quantity);
    if (!c || !tier) return sum;
    return sum + (c.ticket_price * i.quantity * tier.discount_percentage) / 100;
  }, 0);
  const discountedSubtotal = Math.max(0, subtotal - savings);
  const hasSavings = savings > 0;
  const anyDiscounted = items.some((i) => Boolean(activeTierFor(i.competition_id, i.quantity)));
  const allDiscounted = items.length > 0 && items.every((i) => Boolean(activeTierFor(i.competition_id, i.quantity)));
  const upsellMsg = allDiscounted
    ? "Ticket bundle savings applied."
    : anyDiscounted
      ? "Some entries have bundle savings applied."
      : "Add more entries to unlock ticket bundle savings.";
  const close = () => setDrawerOpen(false);
  const itemWord = count === 1 ? "item" : "items";

  return (
    <>
      {isOpen && <button type="button" aria-label="Close basket" onClick={close} className="td-modal-backdrop fixed inset-0 z-50" />}
      <aside
        className={`td-minicart-drawer td-minicart-dropdown fixed z-[51] theme-dark transition-[transform,opacity,box-shadow] duration-300 will-change-transform ${isOpen ? "is-open" : ""}`}
        aria-hidden={!isOpen}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
        <div className="flex h-full flex-col overflow-hidden">
          <div className="td-minicart-header flex shrink-0 items-center justify-between px-5 py-4">
            <div className="min-w-0">
              <div className="font-display text-lg font-bold uppercase leading-none tracking-wide text-[color:var(--td-text)]">Your basket</div>
              <div className="td-soft mt-1 text-xs">
                {count > 0 ? <><span className="font-bold text-primary">{count}</span> {itemWord}</> : "Empty"}
              </div>
            </div>
            <button type="button" onClick={close} aria-label="Close basket" className="td-icon-button grid h-9 w-9 place-items-center rounded-lg transition">
              <X className="h-5 w-5" />
            </button>
          </div>

          {items.length === 0 ? (
            <div className="td-muted grid flex-1 place-items-center px-6 py-10 text-center">
              <div>
                <div className="td-minicart-card mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl">
                  <ShoppingBag className="h-7 w-7 text-[color:var(--td-text-soft)]" />
                </div>
                <div className="font-display mb-1 text-base font-bold text-[color:var(--td-text)]">Your basket is empty</div>
                <div className="td-soft mb-5 text-sm">Choose a live competition to get started.</div>
                <Button asChild onClick={close} className="btn-primary-glow font-bold uppercase tracking-wider">
                  <Link href="/competitions">View live competitions</Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-2.5 overflow-y-auto px-4 py-4">
                {items.map((i) => {
                  const c = comps[i.competition_id];
                  const remaining = c ? Math.max(0, c.max_entries - c.current_entries - (Number(c.manual_reserved_entries) || 0)) : Infinity;
                  const perUser = c && c.per_user_entry_limit != null ? c.per_user_entry_limit : Infinity;
                  const maxQty = Math.min(remaining, perUser);
                  const atLimit = i.quantity >= maxQty;
                  const lineTotal = c ? c.ticket_price * i.quantity : 0;
                  const activeTier = activeTierFor(i.competition_id, i.quantity);
                  const image = competitionThumbImageUrl(c ?? {});
                  return (
                    <div key={i.competition_id} className="td-minicart-card rounded-xl p-3 transition sm:p-3.5">
                      <div className="flex items-start gap-3">
                        {image ? (
                          <img src={image} alt="" className="h-20 w-20 shrink-0 rounded-xl border td-border bg-[color:var(--td-image-placeholder)] object-cover sm:h-24 sm:w-24" loading="lazy" decoding="async" />
                        ) : (
                          <div className="h-20 w-20 shrink-0 rounded-xl border td-border bg-[color:var(--td-image-placeholder)] sm:h-24 sm:w-24" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-2">
                            <Link href={c ? `/competitions/${c.slug}` : "#"} onClick={close} className="font-display line-clamp-2 min-w-0 flex-1 text-sm font-bold text-[color:var(--td-text)] transition hover:text-primary">
                              {c?.title ?? "Loading..."}
                            </Link>
                            <button type="button" onClick={() => remove(i.competition_id)} aria-label={c ? `Remove ${c.title}` : "Remove item"} className="td-icon-button grid h-7 w-7 shrink-0 place-items-center rounded-md text-[color:var(--td-text-soft)] transition hover:text-warning">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="td-soft font-mono-num mt-0.5 text-[11px]">{c ? formatMoney(c.ticket_price) : "-"} per ticket</div>
                          <div className="mt-1.5">
                            {activeTier ? (
                              <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-success/40 bg-success/15 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-success">
                                <BadgePercent className="h-3 w-3" /> Save {activeTier.discount_percentage}% applied
                              </span>
                            ) : (
                              <span className="td-badge-muted inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider">No discount</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between pl-[92px] sm:pl-[108px]">
                        <div className="td-minicart-qty inline-flex h-[34px] items-center rounded-md">
                          <button type="button" onClick={() => update(i.competition_id, i.quantity - 1)} aria-label="Decrease quantity" className="td-icon-button grid h-full w-9 place-items-center rounded-l-md">
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="font-mono-num w-8 text-center text-sm font-bold text-[color:var(--td-text)]">{i.quantity}</span>
                          <button
                            type="button"
                            onClick={() => {
                              if (atLimit) {
                                setLimitMessage("Entry limit reached for this competition.");
                                window.setTimeout(() => setLimitMessage(null), 2200);
                                return;
                              }
                              update(i.competition_id, Math.min(maxQty, i.quantity + 1));
                            }}
                            disabled={atLimit}
                            aria-label="Increase quantity"
                            className="td-icon-button grid h-full w-9 place-items-center rounded-r-md disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="font-mono-num whitespace-nowrap text-sm font-bold text-[color:var(--td-text)]">{formatMoney(lineTotal)}</div>
                      </div>
                      {c && c.per_user_entry_limit != null && i.quantity >= c.per_user_entry_limit && (
                        <div className="mt-1.5 pl-[92px] text-[11px] text-warning sm:pl-[108px]">Entry limit reached ({c.per_user_entry_limit} per person).</div>
                      )}
                    </div>
                  );
                })}
                {limitMessage ? <div className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">{limitMessage}</div> : null}
              </div>

              <div className="td-minicart-footer shrink-0 px-4 pb-2 pt-4 sm:px-5" style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))" }}>
                <div className="td-minicart-card relative mb-3 overflow-hidden rounded-2xl p-4">
                  <div className="pointer-events-none absolute inset-0 opacity-60 [background:radial-gradient(circle_at_top_right,hsl(var(--primary)/0.12),transparent_60%)]" />
                  <div className="relative space-y-2.5">
                    {hasSavings ? (
                      <>
                        <SummaryRow label="Original subtotal" value={formatMoney(subtotal)} muted strike />
                        <SummaryRow label="Bundle savings" value={`-${formatMoney(savings)}`} success />
                        <SummaryRow label="Discounted subtotal" value={formatMoney(discountedSubtotal)} success />
                      </>
                    ) : (
                      <SummaryRow label="Subtotal" value={formatMoney(subtotal)} />
                    )}
                    <div className="td-divider-soft" />
                    <div className="flex items-baseline justify-between">
                      <span className="font-display text-sm font-extrabold uppercase tracking-wider text-[color:var(--td-text)]">Total</span>
                      <span className="font-mono-num text-2xl font-extrabold leading-none text-[color:var(--td-text)]">{formatMoney(hasSavings ? discountedSubtotal : subtotal)}</span>
                    </div>
                    <p className="td-muted pt-1 text-[12px] leading-relaxed">Discount codes and wallet credit can be applied at checkout.</p>
                  </div>
                </div>
                {anyDiscounted ? (
                  <div className="mb-3 flex items-center gap-2.5 rounded-xl border border-success/40 bg-success/[0.10] px-3.5 py-2.5 shadow-[0_0_24px_-10px_hsl(var(--success)/0.6)]">
                    <BadgePercent className="h-4 w-4 shrink-0 text-success" />
                    <span className="font-display text-[13px] font-extrabold uppercase leading-tight tracking-wider text-[color:var(--td-text)]">Ticket bundle savings applied</span>
                  </div>
                ) : (
                  <div className="mb-3 flex items-center gap-2 rounded-lg border border-info/25 bg-info/[0.06] px-3 py-2">
                    <Sparkles className="h-3.5 w-3.5 shrink-0 text-info" />
                    <span className="td-muted text-[12px] leading-snug">{upsellMsg}</span>
                  </div>
                )}
                <Button asChild className="btn-primary-glow h-14 w-full text-[15px] font-extrabold uppercase tracking-wider shadow-[0_10px_30px_-8px_hsl(var(--primary)/0.7)]" onClick={close}>
                  <Link href="/checkout" className="flex items-center justify-center gap-2">
                    <span>Continue to checkout · {formatMoney(hasSavings ? discountedSubtotal : subtotal)}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}

function SummaryRow({ label, value, muted, strike, success }: { label: string; value: string; muted?: boolean; strike?: boolean; success?: boolean }) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className={`text-[11px] font-bold uppercase tracking-wider ${success ? "text-success" : "td-soft"}`}>{label}</span>
      <span className={`font-mono-num ${success ? "font-extrabold text-success" : muted ? "td-soft" : "font-bold text-[color:var(--td-text)]"} ${strike ? "line-through" : ""}`}>{value}</span>
    </div>
  );
}
