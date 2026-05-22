"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Lock, ShieldCheck, ShoppingBag, Sparkles, Tag, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/Panel";
import { useAuth } from "@/hooks/useAuth";
import { useBasket } from "@/hooks/useBasket";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { competitionThumbImageUrl } from "@/lib/competitionImages";
import { formatMoney } from "@/lib/format";
import type { CompetitionDiscountTier } from "@/types/db";

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
  per_user_entry_limit: number | null;
  opens_at: string | null;
  closes_at: string | null;
};

type Validation = {
  valid: boolean;
  reason?: string;
  discount_amount: number;
  discount_label?: string;
};

function applyTier(quantity: number, unit: number, tiers: CompetitionDiscountTier[]) {
  const sorted = [...tiers].sort((a, b) => Number(b.min_quantity) - Number(a.min_quantity));
  const tier = sorted.find((t) => quantity >= Number(t.min_quantity));
  const subtotal = unit * quantity;
  if (!tier) return { subtotal, discount: 0, after: subtotal, pct: 0 };
  const pct = Number(tier.discount_percentage);
  const discount = +(subtotal * pct / 100).toFixed(2);
  return { subtotal, discount, after: +(subtotal - discount).toFixed(2), pct };
}

function lineEligibilityReason(line: { item: { quantity: number }; comp: CompLite; remaining: number }, now = Date.now()) {
  if (line.comp.status !== "live") return "This competition is not currently live.";
  if (line.comp.opens_at && new Date(line.comp.opens_at).getTime() > now) return "This competition is not open yet.";
  if (line.comp.closes_at && new Date(line.comp.closes_at).getTime() <= now) return "This competition has closed.";
  if (line.item.quantity > line.remaining) return "Not enough tickets are available.";
  return null;
}

function friendlyError(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export function CheckoutClient() {
  const supabase = createSupabaseBrowserClient();
  const { items, clear, count, setDrawerOpen, remove } = useBasket();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [comps, setComps] = useState<Record<string, CompLite>>({});
  const [tiersByComp, setTiersByComp] = useState<Record<string, CompetitionDiscountTier[]>>({});
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletSettings, setWalletSettings] = useState<{ is_earn_enabled: boolean; earn_percentage: number; max_wallet_use_percentage: number; min_purchase_for_earn: number } | null>(null);
  const [useWallet, setUseWallet] = useState(false);
  const [walletAmountInput, setWalletAmountInput] = useState("");
  const [code, setCode] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [codeValidation, setCodeValidation] = useState<Validation | null>(null);
  const [validating, setValidating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [profileOk, setProfileOk] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [marketingOptIn, setMarketingOptIn] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      const ids = items.map((i) => i.competition_id);
      const [{ data: cData }, { data: tData }, { data: wData }, { data: wsData }, { data: pData }] = await Promise.all([
        ids.length ? supabase.from("competitions").select("id,title,slug,ticket_price,main_image_url,image_original_url,image_card_url,image_detail_url,image_thumb_url,status,max_entries,current_entries,manual_reserved_entries,per_user_entry_limit,opens_at,closes_at").in("id", ids).is("archived_at", null) : Promise.resolve({ data: [] as any }),
        ids.length ? supabase.from("competition_discount_tiers").select("id,competition_id,min_quantity,discount_percentage,label,is_active,sort_order").in("competition_id", ids).eq("is_active", true) : Promise.resolve({ data: [] as any }),
        supabase.from("wallets").select("balance").eq("user_id", user.id).maybeSingle(),
        supabase.from("wallet_public_settings").select("is_earn_enabled,earn_percentage,max_wallet_use_percentage,min_purchase_for_earn").maybeSingle(),
        supabase.from("profiles").select("date_of_birth,terms_accepted_at,age_confirmed_at").eq("id", user.id).maybeSingle(),
      ]);
      const cmap: Record<string, CompLite> = {};
      for (const c of (cData ?? []) as any[]) cmap[c.id] = { ...c, ticket_price: Number(c.ticket_price) };
      const tmap: Record<string, CompetitionDiscountTier[]> = {};
      for (const t of (tData ?? []) as any[]) {
        (tmap[t.competition_id] = tmap[t.competition_id] ?? []).push({ ...t, discount_percentage: Number(t.discount_percentage) });
      }
      setComps(cmap);
      setTiersByComp(tmap);
      setWalletBalance(Number((wData as any)?.balance ?? 0));
      setWalletSettings(wsData as any);
      setProfileOk(Boolean((pData as any)?.date_of_birth && (pData as any)?.terms_accepted_at && (pData as any)?.age_confirmed_at));
      setLoading(false);
    })();
  }, [items, supabase, user]);

  const lines = useMemo(() => items.map((item) => {
    const comp = comps[item.competition_id];
    if (!comp) return null;
    const tier = applyTier(item.quantity, comp.ticket_price, tiersByComp[comp.id] ?? []);
    const remaining = Math.max(0, comp.max_entries - comp.current_entries - (Number(comp.manual_reserved_entries) || 0));
    return { item, comp, tier, remaining };
  }).filter(Boolean) as Array<{ item: typeof items[number]; comp: CompLite; tier: ReturnType<typeof applyTier>; remaining: number }>, [comps, items, tiersByComp]);

  const subtotal = lines.reduce((s, l) => s + l.tier.subtotal, 0);
  const tierDiscount = lines.reduce((s, l) => s + l.tier.discount, 0);
  const afterTiers = subtotal - tierDiscount;
  const codeDiscount = appliedCode && codeValidation?.valid ? codeValidation.discount_amount : 0;
  const afterCode = Math.max(0, afterTiers - codeDiscount);
  const maxWalletPct = walletSettings?.max_wallet_use_percentage ?? 100;
  const maxWalletByPct = +(afterCode * (maxWalletPct / 100)).toFixed(2);
  const maxWalletApplicable = Math.min(walletBalance, maxWalletByPct, afterCode);
  const requestedWallet = useWallet ? Math.min(maxWalletApplicable, Math.max(0, Number(walletAmountInput) || maxWalletApplicable)) : 0;
  const total = +(afterCode - requestedWallet).toFixed(2);
  const invalidLines = useMemo(() => lines.map((line) => {
    const reason = lineEligibilityReason(line);
    return reason ? { ...line, reason } : null;
  }).filter(Boolean) as Array<typeof lines[number] & { reason: string }>, [lines]);
  const missingItems = useMemo(() => items.filter((item) => !comps[item.competition_id]), [comps, items]);
  const hasInvalidBasket = invalidLines.length > 0 || missingItems.length > 0;
  const earnPct = walletSettings?.is_earn_enabled ? Number(walletSettings?.earn_percentage ?? 0) : 0;
  const minEarn = Number(walletSettings?.min_purchase_for_earn ?? 0);
  const willEarn = earnPct > 0 && total >= minEarn ? +(total * (earnPct / 100)).toFixed(2) : 0;
  const ticketWord = count === 1 ? "ticket" : "tickets";
  const compWord = lines.length === 1 ? "competition" : "competitions";

  async function applyCode() {
    if (!supabase || !code.trim()) return;
    setValidating(true);
    setNotice(null);
    try {
      const { data, error } = await supabase.functions.invoke("validate-discount-code", {
        body: { code: code.trim().toUpperCase(), items: items.map((i) => ({ competition_id: i.competition_id, quantity: i.quantity })) },
      });
      if (error) throw error;
      const validation = data as Validation;
      setCodeValidation(validation);
      if (validation.valid) {
        setAppliedCode(code.trim().toUpperCase());
        setNotice(`Code applied, ${formatMoney(validation.discount_amount)} off`);
      } else {
        setAppliedCode(null);
        setNotice(validation.reason || "Code not valid");
      }
    } catch (error) {
      setCodeValidation(null);
      setAppliedCode(null);
      setNotice(friendlyError(error));
    } finally {
      setValidating(false);
    }
  }

  function clearCode() {
    setCode("");
    setAppliedCode(null);
    setCodeValidation(null);
  }

  async function pay() {
    if (!supabase) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (profileOk === false) {
      setNotice("Please complete your profile (DOB, terms, 18+).");
      return;
    }
    if (lines.length === 0) {
      setNotice("Basket is empty.");
      return;
    }
    const freshInvalidLine = lines.map((line) => ({ line, reason: lineEligibilityReason(line) })).find((entry) => entry.reason);
    if (freshInvalidLine) {
      setNotice(`${freshInvalidLine.reason} ${freshInvalidLine.line.comp.title}`);
      return;
    }
    if (missingItems.length > 0) {
      setNotice("A basket item is no longer available. Remove unavailable items before paying.");
      return;
    }
    setSubmitting(true);
    try {
      const firstLine = lines[0];
      sessionStorage.setItem("topdraw_marketing_opt_in", JSON.stringify({
        opt_in: marketingOptIn,
        email: user.email ?? "",
        competition_id: firstLine?.comp.id ?? null,
        competition_title: firstLine?.comp.title ?? null,
      }));
    } catch {}
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          items: lines.map((l) => ({ competition_id: l.comp.id, quantity: l.item.quantity })),
          discount_code: appliedCode || undefined,
          use_wallet_amount: requestedWallet || 0,
        },
      });
      if (error) throw error;
      if ((data as any)?.url) {
        window.location.href = (data as any).url;
        return;
      }
      if ((data as any)?.mode === "free") {
        clear();
        router.push(`/checkout/success?payment_id=${(data as any).payment_id}`);
        return;
      }
      if ((data as any)?.mode === "dev") {
        setNotice("Dev payment created. Mark it succeeded from /admin/payments-dev to allocate tickets.");
      } else {
        setNotice((data as any)?.error || "Could not start checkout");
      }
    } catch (error) {
      setNotice(friendlyError(error));
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return <CheckoutShell><Panel variant="glass" className="p-6 text-white">Loading checkout...</Panel></CheckoutShell>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <Lock className="mx-auto mb-3 h-8 w-8 text-primary" />
        <h1 className="font-display mb-2 text-2xl font-bold text-white">Sign in to checkout</h1>
        <p className="mb-4 text-white/70">You need an account to enter competitions.</p>
        <div className="flex justify-center gap-2">
          <Button asChild><Link href="/login">Log in</Link></Button>
          <Button asChild variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"><Link href="/register">Create account</Link></Button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-white/5">
          <ShoppingBag className="h-7 w-7 text-white/50" />
        </div>
        <h1 className="font-display mb-2 text-2xl font-bold text-white">Your basket is empty</h1>
        <p className="mb-6 text-white/70">Choose a live competition to get started.</p>
        <Button asChild className="btn-primary-glow font-bold uppercase tracking-wider">
          <Link href="/competitions">View live competitions</Link>
        </Button>
      </div>
    );
  }

  const ctaLabel = submitting ? "Processing..." : total === 0 ? "Place order (free)" : `Pay securely · ${formatMoney(total)}`;

  return (
    <CheckoutShell>
      <div className="mb-6 md:mb-8">
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-white md:text-4xl">Finalise your order</h1>
      </div>
      {loading ? (
        <Panel variant="glass" className="h-64 rounded-xl p-6 text-white/70">Loading order...</Panel>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px] xl:gap-10">
          <div className="min-w-0 space-y-4">
            {missingItems.length > 0 && <WarningPanel title="A basket item is no longer available." detail="Remove unavailable items before continuing to payment." onRemove={() => missingItems.forEach((item) => remove(item.competition_id))} />}
            {invalidLines.length > 0 && (
              <Panel variant="outline" tone="warning" className="p-4 text-sm text-white">
                <div className="flex gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-white">Some basket items can no longer be purchased.</div>
                    <div className="mt-1 text-white/75">Remove them before continuing to payment.</div>
                    <div className="mt-3 space-y-2">
                      {invalidLines.map((line) => (
                        <div key={line.comp.id} className="flex flex-col gap-2 rounded-lg border border-warning/25 bg-warning/10 p-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <div className="line-clamp-1 font-bold text-white">{line.comp.title}</div>
                            <div className="text-xs text-white/70">{line.reason}</div>
                          </div>
                          <button type="button" onClick={() => remove(line.comp.id)} className="shrink-0 rounded-md border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/15">Remove</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Panel>
            )}
            <Panel variant="glass" className="overflow-hidden rounded-2xl border-white/10 p-0">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4 sm:p-5">
                <div className="min-w-0">
                  <div className="font-display text-base font-bold text-white sm:text-lg">Order review</div>
                  <div className="mt-0.5 text-xs text-white/60"><span className="font-bold text-primary">{count}</span> {ticketWord} selected across {lines.length} {compWord}</div>
                </div>
                <button type="button" onClick={() => setDrawerOpen(true)} className="shrink-0 text-xs font-bold uppercase tracking-wider text-primary hover:underline">Edit basket</button>
              </div>
              <div className="space-y-2.5 p-3 sm:p-4">
                {lines.map((line) => {
                  const image = competitionThumbImageUrl(line.comp);
                  return (
                    <div key={line.comp.id} className="rounded-xl border border-white/10 bg-white/[0.035] p-3 transition hover:border-white/15 sm:p-3.5">
                      <div className="flex items-start gap-3">
                        {image ? <img src={image} alt="" loading="lazy" decoding="async" className="h-20 w-20 shrink-0 rounded-xl border border-white/10 bg-black/20 object-cover sm:h-24 sm:w-24" /> : <div className="h-20 w-20 shrink-0 rounded-xl border border-white/10 bg-white/5 sm:h-24 sm:w-24" />}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-2">
                            <Link href={`/competitions/${line.comp.slug}`} className="font-display line-clamp-2 min-w-0 flex-1 text-sm font-bold text-white transition hover:text-primary">{line.comp.title}</Link>
                            <div className="font-mono-num shrink-0 text-right">
                              <div className="text-sm font-extrabold text-white">{formatMoney(line.tier.after)}</div>
                              {line.tier.discount > 0 && <div className="text-[10px] leading-tight text-white/40 line-through">{formatMoney(line.tier.subtotal)}</div>}
                            </div>
                          </div>
                          <div className="font-mono-num mt-0.5 text-[11px] text-white/55">{formatMoney(line.comp.ticket_price)} x {line.item.quantity}</div>
                          {line.tier.pct > 0 && <span className="mt-1.5 inline-flex rounded-md border border-success/40 bg-success/15 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-success">-{line.tier.pct}% bundle</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          </div>

          <aside className="lg:sticky lg:top-24">
            <Panel variant="glass" className="space-y-4 rounded-2xl border-primary/25 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5 shadow-[0_0_60px_-18px_hsl(var(--primary)/0.45)] backdrop-blur-xl sm:p-6">
              <div className="flex items-center justify-between">
                <div className="font-display text-lg font-bold tracking-tight text-white">Order summary</div>
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary"><Lock className="h-2.5 w-2.5" /> Secure</span>
              </div>
              <div className="max-h-44 space-y-2.5 overflow-y-auto pr-1">
                {lines.map((line) => <div key={line.comp.id} className="flex items-start gap-2 text-xs"><span className="font-mono-num inline-flex h-6 min-w-[28px] items-center justify-center rounded-md border border-primary/30 bg-primary/15 px-1.5 text-[11px] font-bold text-primary">x{line.item.quantity}</span><span className="line-clamp-2 flex-1 leading-snug text-white/85">{line.comp.title}</span><span className="font-mono-num shrink-0 font-bold text-white">{formatMoney(line.tier.after)}</span></div>)}
              </div>
              <div className="border-t border-white/10" />
              <div className="space-y-2">
                <SummaryLine label="Tickets" value={`${count} ${ticketWord}`} />
                {tierDiscount > 0 ? <><SummaryLine label="Original subtotal" value={formatMoney(subtotal)} muted strike /><SummaryLine label="Bundle savings" value={`-${formatMoney(tierDiscount)}`} tone="success" /><SummaryLine label="Discounted subtotal" value={formatMoney(afterTiers)} tone="success" /></> : <SummaryLine label="Subtotal" value={formatMoney(subtotal)} />}
                {codeDiscount > 0 && <SummaryLine label={`Code (${appliedCode})`} value={`-${formatMoney(codeDiscount)}`} tone="success" />}
                {requestedWallet > 0 && <SummaryLine label="Wallet credit" value={`-${formatMoney(requestedWallet)}`} tone="gold" />}
              </div>
              <div className="flex items-baseline justify-between rounded-xl border border-primary/25 bg-primary/[0.06] px-4 py-3">
                <span className="text-xs font-bold uppercase tracking-[0.15em] text-white/80">Total to pay</span>
                <span className="font-mono-num font-display text-3xl font-extrabold leading-none text-white">{formatMoney(total)}</span>
              </div>
              {tierDiscount + codeDiscount + requestedWallet > 0 && <div className="text-center text-[11px] font-bold uppercase tracking-wider text-success">You&apos;re saving {formatMoney(tierDiscount + codeDiscount + requestedWallet)} on this order</div>}
              <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-center gap-2"><Tag className="h-3.5 w-3.5 text-primary" /><span className="text-[11px] font-bold uppercase tracking-wider text-white/80">Discount code</span></div>
                {appliedCode ? <div className="flex items-center justify-between rounded-lg border border-success/30 bg-success/10 px-2.5 py-1.5 text-xs"><span className="min-w-0 truncate text-white"><span className="font-mono font-bold text-success">{appliedCode}</span>, {formatMoney(codeValidation?.discount_amount ?? 0)} off</span><button type="button" onClick={clearCode} className="ml-2 shrink-0 text-[11px] text-white/70 underline hover:text-white">Remove</button></div> : <div className="flex gap-2"><Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Enter code" className="h-9 flex-1 bg-white text-sm uppercase text-black placeholder:text-black/50" /><Button type="button" onClick={applyCode} disabled={!code.trim() || validating} className="h-9 px-3 text-xs font-bold uppercase tracking-wider">{validating ? "..." : "Apply"}</Button></div>}
              </div>
              {walletBalance > 0 && <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-3"><div className="flex items-center gap-2"><Wallet className="h-3.5 w-3.5 text-gold" /><span className="text-[11px] font-bold uppercase tracking-wider text-white/80">Wallet credit</span><span className="font-mono-num ml-auto text-[11px] text-white/60">{formatMoney(walletBalance)} available</span></div><label className="flex cursor-pointer select-none items-center gap-2 text-xs text-white/85"><input type="checkbox" checked={useWallet} onChange={(e) => setUseWallet(e.target.checked)} className="h-4 w-4 accent-gold" disabled={maxWalletApplicable <= 0} />Apply up to <span className="font-mono-num font-bold text-gold">{formatMoney(maxWalletApplicable)}</span></label>{useWallet && maxWalletApplicable > 0 && <div className="flex items-center gap-2"><Input type="number" min="0" max={maxWalletApplicable} step="0.01" value={walletAmountInput} placeholder={String(maxWalletApplicable.toFixed(2))} onChange={(e) => setWalletAmountInput(e.target.value)} className="h-9 flex-1 bg-white text-sm text-black" /><span className="font-mono-num text-[11px] text-white/60">-{formatMoney(requestedWallet)}</span></div>}</div>}
              {willEarn > 0 && total > 0 && <div className="flex items-center justify-center gap-1 text-[11px] text-gold"><Sparkles className="h-3 w-3" /> You&apos;ll earn {formatMoney(willEarn)} in wallet credit</div>}
              <label className="flex cursor-pointer select-none items-start gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-[12px] leading-relaxed text-white/80"><input type="checkbox" checked={marketingOptIn} onChange={(e) => setMarketingOptIn(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-primary" /><span>Email me TopDraw offers and similar competitions. You can unsubscribe at any time.</span></label>
              {notice ? <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/80">{notice}</div> : null}
              <Button type="button" onClick={pay} disabled={submitting || lines.length === 0 || hasInvalidBasket} className="btn-primary-glow h-12 w-full text-sm font-bold uppercase tracking-wider">{ctaLabel}</Button>
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-white/60"><ShieldCheck className="h-3 w-3 text-primary" /> Secure checkout. Entries confirmed after payment.</div>
            </Panel>
            <p className="mx-auto mt-4 max-w-[34ch] text-balance text-center text-xs leading-relaxed text-white sm:max-w-[58ch] sm:text-sm">
              18+ UK only. By placing this order you agree to our <Link href="/terms" className="underline decoration-white/40 underline-offset-2 hover:decoration-white">Terms</Link> and confirm you are 18 or over. A free postal entry route is available. See <Link href="/free-entry" className="underline decoration-white/40 underline-offset-2 hover:decoration-white">Free entry</Link>.
            </p>
          </aside>
        </div>
      )}
    </CheckoutShell>
  );
}

function CheckoutShell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-7xl px-4 py-6 pb-10 sm:px-6 lg:px-8">{children}</div>;
}

function WarningPanel({ title, detail, onRemove }: { title: string; detail: string; onRemove: () => void }) {
  return (
    <Panel variant="outline" tone="warning" className="p-4 text-sm text-white">
      <div className="flex gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
        <div className="min-w-0 flex-1">
          <div className="font-bold text-white">{title}</div>
          <div className="mt-1 text-white/75">{detail}</div>
          <button type="button" onClick={onRemove} className="mt-3 rounded-md border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/15">Remove unavailable item</button>
        </div>
      </div>
    </Panel>
  );
}

function SummaryLine({ label, value, tone = "default", muted, strike }: { label: string; value: string; tone?: "default" | "success" | "gold"; muted?: boolean; strike?: boolean }) {
  const valueClass = tone === "success" ? "text-success" : tone === "gold" ? "text-gold" : muted ? "text-white/50" : "text-white";
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={`${tone === "success" ? "font-bold text-success/90" : "text-white/70"}`}>{label}</span>
      <span className={`font-mono-num font-bold ${valueClass} ${strike ? "line-through" : ""}`}>{value}</span>
    </div>
  );
}
