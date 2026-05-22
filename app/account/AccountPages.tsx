"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, Archive, ArrowDownCircle, ArrowRight, ArrowUpCircle, Calendar, CheckCircle2, Coins, ExternalLink, Gift, LifeBuoy, LogOut, Mail, MapPin, Phone, Receipt, RotateCcw, ShieldAlert, ShieldCheck, ShoppingBag, Sparkles, Ticket as TicketIcon, Trophy, User, UserCog, Wallet as WalletIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/Panel";
import { EmptyState } from "@/components/EmptyState";
import { SafePrizeImage } from "@/components/SafePrizeImage";
import { StatusBadge } from "@/components/StatusBadge";
import { StatTile } from "@/components/ui/StatTile";
import { VerifiedBadge } from "@/components/account/VerifiedBadge";
import { useAuth } from "@/hooks/useAuth";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { competitionThumbImageUrl } from "@/lib/competitionImages";
import { formatMoney } from "@/lib/format";

const LIVE = new Set(["live", "sold_out"]);
const KIND_META: Record<string, { label: string; icon: any; tone: string }> = {
  earn_purchase: { label: "Earned from purchase", icon: ArrowUpCircle, tone: "text-success" },
  earn_promo: { label: "Promo credit", icon: Sparkles, tone: "text-info" },
  earn_admin_grant: { label: "Site credit", icon: Gift, tone: "text-gold" },
  spend_entry: { label: "Used at checkout", icon: ArrowDownCircle, tone: "text-warning" },
  refund_to_wallet: { label: "Refund to wallet", icon: RotateCcw, tone: "text-info" },
  expiry: { label: "Credit expired", icon: Calendar, tone: "text-white/60" },
  adjustment: { label: "Adjustment", icon: ArrowUpCircle, tone: "text-white/60" },
};

type EntryRow = { id: string; ticket_number: number; entry_type?: string; status?: string; is_winner: boolean; created_at: string; competition_id: string };
type CompetitionLite = { id: string; title: string; slug: string; status: string; draw_at: string | null; closes_at: string | null; main_image_url?: string | null; image_original_url?: string | null; image_card_url?: string | null; image_detail_url?: string | null; image_thumb_url?: string | null; cash_alternative?: number | null };
type PaymentRow = { id: string; created_at: string; amount: number; status: string; quantity: number | null; competition_id: string | null; subtotal_amount: number | null; discount_amount: number | null; discount_percentage: number | null; wallet_amount_used: number | null; refund_status: string | null; refunded_amount: number | null; is_multiline: boolean | null; pricing_snapshot: Record<string, any> | null };
type LineRow = { payment_id: string; competition_id: string; quantity: number | null; line_total: number | null };
type Txn = { id: string; delta: number; balance_after: number; kind: string; note: string | null; created_at: string; expires_at: string | null; reference_type?: string | null; reference_id?: string | null };

function useSupabaseUser() {
  const supabase = createSupabaseBrowserClient();
  const { user, signOut } = useAuth();
  return { supabase, user, signOut };
}

function fmtDate(d?: string | null) {
  return d ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "-";
}

function shortId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

function ticketLabel(n: number) {
  return `#${String(n).padStart(5, "0")}`;
}

function paymentStatus(p: Pick<PaymentRow, "status" | "refund_status">) {
  if (p.refund_status === "full" || p.status === "refunded") return { label: "Refunded", status: "refunded" };
  if (p.refund_status === "partial") return { label: "Partially refunded", status: "refunded" };
  if (p.status === "succeeded") return { label: "Paid", status: "paid" };
  if (p.status === "allocation_failed") return { label: "Allocation issue", status: "allocation_failed" };
  return { label: p.status, status: p.status };
}

function snapshotLines(snap: Record<string, any> | null): { competition_id?: string; title?: string; quantity?: number; line_total?: number }[] {
  const candidates = snap?.lines ?? snap?.items ?? snap?.basket ?? null;
  return Array.isArray(candidates) ? candidates.map((l: any) => ({ competition_id: l.competition_id ?? l.id, title: l.title ?? l.competition_title, quantity: l.quantity ?? l.qty, line_total: l.line_total ?? l.total ?? l.amount })) : [];
}

function PageTitle({ icon, title, body }: { icon?: React.ReactNode; title: string; body?: string }) {
  return (
    <div className="mb-5">
      <div className="mb-1 flex items-center gap-2">
        {icon}
        <h1 className="font-display text-2xl font-semibold text-white md:text-3xl">{title}</h1>
      </div>
      {body ? <p className="max-w-2xl text-sm text-white/70">{body}</p> : null}
    </div>
  );
}

export function AccountOverviewPage() {
  const { supabase, user } = useSupabaseUser();
  const [profile, setProfile] = useState<any>(null);
  const [rows, setRows] = useState<EntryRow[]>([]);
  const [comps, setComps] = useState<Map<string, CompetitionLite>>(new Map());
  const [winsCount, setWinsCount] = useState(0);
  const [activeExclusion, setActiveExclusion] = useState<{ ends_at: string | null } | null>(null);
  const [unclaimedCount, setUnclaimedCount] = useState(0);

  useEffect(() => {
    if (!supabase || !user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }: any) => setProfile(data));
    supabase.rpc("get_active_self_exclusion").then(({ data }: any) => setActiveExclusion(Array.isArray(data) ? data[0] ?? null : data ?? null));
    (async () => {
      const { data: entries } = await supabase.from("entries").select("id,ticket_number,is_winner,created_at,competition_id").eq("user_id", user.id).is("archived_at", null).order("created_at", { ascending: false });
      const list = (entries ?? []) as EntryRow[];
      const ids = Array.from(new Set(list.map((r) => r.competition_id))).filter(Boolean);
      let cMap = new Map<string, CompetitionLite>();
      if (ids.length) {
        const { data: cs } = await supabase.from("competitions").select("id,title,slug,status,draw_at,closes_at").in("id", ids);
        cMap = new Map(((cs ?? []) as CompetitionLite[]).map((c) => [c.id, c]));
      }
      setRows(list);
      setComps(cMap);
      const { count } = await supabase.from("winners").select("id", { count: "exact", head: true }).eq("user_id", user.id);
      const fallbackWins = list.filter((r) => r.is_winner).length;
      setWinsCount(typeof count === "number" ? Math.max(count, fallbackWins) : fallbackWins);
      const { count: unclaimed } = await supabase.from("winners").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("claim_status", "unclaimed");
      setUnclaimedCount(unclaimed ?? 0);
    })();
  }, [supabase, user]);

  const stats = useMemo(() => {
    const live = rows.filter((r) => LIVE.has(comps.get(r.competition_id)?.status ?? ""));
    const past = rows.filter((r) => {
      const s = comps.get(r.competition_id)?.status;
      return s && !LIVE.has(s);
    });
    const latest = rows[0];
    const latestComp = latest ? comps.get(latest.competition_id) : null;
    const nextDraw = live.map((r) => comps.get(r.competition_id)).filter((c): c is CompetitionLite => !!c?.draw_at).sort((a, b) => new Date(a.draw_at!).getTime() - new Date(b.draw_at!).getTime())[0];
    return { entries: rows.length, live: live.length, past: past.length, latest: latest && latestComp ? { title: latestComp.title, slug: latestComp.slug, created_at: latest.created_at, ticket_number: latest.ticket_number } : undefined, nextDraw: nextDraw ? { title: nextDraw.title, slug: nextDraw.slug, draw_at: nextDraw.draw_at! } : undefined };
  }, [rows, comps]);

  const profileContactComplete = Boolean(profile?.phone && profile?.address_line_1 && profile?.postcode);
  const displayValue = (value?: string | null) => value?.trim() || "Not added yet";

  return (
    <div className="space-y-2.5 md:space-y-6">
      <div className="rounded-xl border border-white/10 bg-[linear-gradient(135deg,hsl(222_28%_13%/0.9),hsl(222_34%_7%/0.82))] p-3 shadow-[0_24px_70px_-38px_hsl(204_100%_40%/0.55),inset_0_1px_0_hsl(0_0%_100%/0.08)] md:rounded-2xl md:p-6">
        <div className="eyebrow mb-1">Welcome back</div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-display inline-flex items-center gap-2 text-xl font-bold tracking-tight text-white md:text-4xl">{profile?.full_name || "My account"}{profile?.verification_status === "verified" && <VerifiedBadge size="sm" />}</h1>
            <p className="mt-2 hidden max-w-2xl text-sm text-white/70 md:block">Review your tickets, prizes, wallet credit and account details from one place.</p>
          </div>
          <Button asChild size="sm" className="btn-primary-glow font-bold uppercase tracking-wider"><Link href="/competitions">Enter now <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
        </div>
      </div>
      {activeExclusion ? <Panel variant="glass" tone="warning" className="p-4"><div className="flex gap-3"><ShieldAlert className="mt-0.5 h-5 w-5 text-warning" /><div><div className="font-semibold text-white">Self-exclusion active</div><div className="mt-0.5 text-sm text-white/75">{activeExclusion.ends_at ? <>You cannot enter competitions until <span className="font-semibold">{new Date(activeExclusion.ends_at).toLocaleString()}</span>.</> : "You are self-excluded indefinitely and cannot enter competitions."}</div><Link href="/account/responsible-play" className="mt-2 inline-block text-xs text-primary hover:underline">Manage responsible play</Link></div></div></Panel> : null}
      {unclaimedCount > 0 ? <Panel variant="glass" tone="primary" className="p-4"><div className="flex gap-3"><Trophy className="mt-0.5 h-5 w-5 text-primary" /><div><div className="font-semibold text-white">You have a prize waiting to claim</div><div className="mt-0.5 text-sm text-white/75">{unclaimedCount === 1 ? "1 prize is ready" : `${unclaimedCount} prizes are ready`} for you to confirm delivery details.</div><Link href="/account/wins" className="mt-2 inline-block text-xs text-primary hover:underline">Claim prize</Link></div></div></Panel> : null}
      <div className="grid grid-cols-2 gap-2 md:gap-3 lg:grid-cols-4">
        <StatTile label="Live entries" value={stats.live} tone="primary" icon={<Activity className="h-4 w-4" />} />
        <StatTile label="Total entries" value={stats.entries} tone="info" icon={<TicketIcon className="h-4 w-4" />} />
        <StatTile label="Past entries" value={stats.past} icon={<Archive className="h-4 w-4" />} />
        <StatTile label="Wins" value={winsCount} tone="gold" icon={<Trophy className="h-4 w-4" />} />
      </div>
      <div className="grid grid-cols-2 gap-2 md:gap-3">
        <Panel variant="glass" className="border-white/10 bg-white/[0.045] p-2.5 md:p-5"><div className="eyebrow mb-1">Latest entry</div>{stats.latest ? <><Link href={`/competitions/${stats.latest.slug}`} className="line-clamp-1 block text-[13px] font-semibold leading-snug text-white transition hover:text-primary md:text-base">{stats.latest.title}</Link><div className="font-mono-num mt-1 text-[10px] text-white/55 md:text-xs">Ticket {ticketLabel(stats.latest.ticket_number)} · {fmtDate(stats.latest.created_at)}</div></> : <p className="mt-1 text-xs text-white/60 md:text-sm">No entries yet.</p>}</Panel>
        <Panel variant="glass" tone="primary" className="bg-primary/[0.055] p-2.5 md:p-5"><div className="eyebrow mb-1">Next draw</div>{stats.nextDraw ? <><Link href={`/competitions/${stats.nextDraw.slug}`} className="line-clamp-1 block text-[13px] font-semibold leading-snug text-white transition hover:text-primary md:text-base">{stats.nextDraw.title}</Link><div className="font-mono-num mt-1 text-[10px] text-white/55 md:text-xs">{new Date(stats.nextDraw.draw_at).toLocaleString()}</div></> : <p className="mt-1 text-xs text-white/60 md:text-sm">No upcoming draw scheduled for your live entries.</p>}</Panel>
      </div>
      <Panel variant="glass" className="overflow-hidden border-primary/20 bg-[linear-gradient(135deg,hsl(222_28%_12%/0.9),hsl(222_32%_8%/0.82))] p-0">
        <div className="border-b border-white/10 p-3.5 md:p-6"><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div><h2 className="font-display text-lg font-bold tracking-tight text-white md:text-2xl">Profile details</h2><p className="mt-1.5 hidden max-w-2xl text-sm text-white/70 md:block">Keep your details up to date so we can verify your account and contact you if you win.</p></div><div><Button asChild className="w-full border border-primary/40 bg-primary/15 text-white hover:bg-primary/25 md:w-auto"><Link href="/account/profile">{profileContactComplete ? "Edit profile details" : "Complete profile details"}</Link></Button>{!profileContactComplete ? <p className="mt-2 max-w-[34ch] text-xs leading-relaxed text-white/60">Add your phone number and address details so prize claims are quicker if you win.</p> : null}</div></div></div>
        {profile ? <dl className="grid grid-cols-2 gap-2 p-3 text-sm md:gap-3 md:p-6">{[{ label: "Name", value: displayValue(profile.full_name), icon: User }, { label: "Email", value: displayValue(profile.email), icon: Mail }, { label: "Postcode", value: displayValue(profile.postcode), icon: MapPin }, { label: "Phone", value: displayValue(profile.phone), icon: Phone }].map(({ label, value, icon: Icon }) => <div key={label} className="min-w-0 rounded-xl border border-white/10 bg-white/[0.045] p-2.5 md:p-3.5"><dt className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/55 md:text-[11px]"><Icon className="h-3.5 w-3.5 text-primary" />{label}</dt><dd className={`mt-1 truncate text-[13px] md:text-sm ${value === "Not added yet" ? "text-white/50" : "text-white"}`}>{value}</dd></div>)}</dl> : <p className="p-5 text-sm text-white/60 md:p-6">Loading...</p>}
      </Panel>
      {stats.entries === 0 ? <EmptyState title="No entries yet" body="Browse live UK prize competitions and place your first entry, paid or via the free postal entry route." action={<Button asChild><Link href="/competitions">View competitions</Link></Button>} /> : null}
    </div>
  );
}

export function AccountEntriesPage() {
  const { supabase, user } = useSupabaseUser();
  const [rows, setRows] = useState<EntryRow[] | null>(null);
  const [comps, setComps] = useState<Map<string, CompetitionLite>>(new Map());
  const [tab, setTab] = useState<"current" | "past">("current");

  useEffect(() => {
    if (!supabase || !user) return;
    let cancelled = false;
    (async () => {
      const { data: entries } = await supabase.from("entries").select("id,ticket_number,entry_type,status,is_winner,created_at,competition_id").eq("user_id", user.id).is("archived_at", null).order("created_at", { ascending: false });
      const list = (entries ?? []) as EntryRow[];
      const ids = Array.from(new Set(list.map((e) => e.competition_id)));
      let map = new Map<string, CompetitionLite>();
      if (ids.length) {
        const { data: c } = await supabase.from("competitions").select("id,title,slug,status,closes_at,draw_at,main_image_url,image_original_url,image_card_url,image_detail_url,image_thumb_url").in("id", ids);
        map = new Map(((c ?? []) as CompetitionLite[]).map((x) => [x.id, x]));
      }
      if (!cancelled) { setRows(list); setComps(map); }
    })();
    return () => { cancelled = true; };
  }, [supabase, user]);

  const groups = useMemo(() => {
    const m = new Map<string, { competition: CompetitionLite | null; competition_id: string; entries: EntryRow[]; hasWinner: boolean; types: Set<string>; latestEntryAt: string }>();
    for (const r of rows ?? []) {
      let g = m.get(r.competition_id);
      if (!g) { g = { competition: comps.get(r.competition_id) ?? null, competition_id: r.competition_id, entries: [], hasWinner: false, types: new Set(), latestEntryAt: r.created_at }; m.set(r.competition_id, g); }
      g.entries.push(r); if (r.is_winner) g.hasWinner = true; if (r.entry_type) g.types.add(r.entry_type); if (r.created_at > g.latestEntryAt) g.latestEntryAt = r.created_at;
    }
    return Array.from(m.values());
  }, [rows, comps]);
  const current = groups.filter((g) => g.competition && LIVE.has(g.competition.status));
  const past = groups.filter((g) => !g.competition || !LIVE.has(g.competition.status));
  const shown = tab === "current" ? current : past;
  return (
    <div>
      <PageTitle title="My tickets" body="Your tickets grouped by competition. Track current entries and past results in one place." />
      {rows === null ? <p className="text-white/60">Loading...</p> : rows.length === 0 ? <EmptyState title="No tickets yet" body="Browse live competitions and pick up your first ticket." action={<Button asChild><Link href="/competitions">View competitions</Link></Button>} /> : <>
        <div className="mb-4 inline-flex rounded-lg border border-white/10 bg-white/5 p-1"><button onClick={() => setTab("current")} className={`rounded-md px-3 py-1.5 text-sm font-bold ${tab === "current" ? "bg-primary text-white" : "text-white/70"}`}>Current ({current.length})</button><button onClick={() => setTab("past")} className={`rounded-md px-3 py-1.5 text-sm font-bold ${tab === "past" ? "bg-primary text-white" : "text-white/70"}`}>Past ({past.length})</button></div>
        <div className="space-y-4">{shown.length ? shown.map((g) => <EntryGroupCard key={g.competition_id} group={g} />) : <EmptyState title={tab === "current" ? "No current tickets yet." : "No past tickets yet."} body={tab === "current" ? "Your tickets in live competitions will appear here." : "Closed and drawn competitions you've entered will appear here."} />}</div>
      </>}
    </div>
  );
}

function EntryGroupCard({ group }: { group: { competition: CompetitionLite | null; competition_id: string; entries: EntryRow[]; hasWinner: boolean; types: Set<string> } }) {
  const [expanded, setExpanded] = useState(false);
  const c = group.competition;
  const tickets = [...group.entries].sort((a, b) => a.ticket_number - b.ticket_number);
  const visible = expanded ? tickets : tickets.slice(0, 5);
  const img = competitionThumbImageUrl(c ?? {});
  return (
    <div className="glass-panel rounded-xl border border-white/10 bg-card p-4 md:p-5">
      <div className="flex flex-col gap-4 sm:flex-row">{img ? <img src={img} alt={c?.title ?? ""} className="h-32 w-full flex-shrink-0 rounded-lg border border-white/10 object-cover sm:w-32" /> : <div className="flex h-32 w-full flex-shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/50 sm:w-32"><TicketIcon className="h-8 w-8" /></div>}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2"><div>{c?.slug ? <Link href={`/competitions/${c.slug}`} className="text-base font-semibold text-white transition hover:text-primary md:text-lg">{c.title}</Link> : <span className="text-base font-semibold text-white/60 md:text-lg">Competition unavailable</span>}<div className="mt-1.5 flex flex-wrap items-center gap-2">{c && <StatusBadge status={c.status} />}{Array.from(group.types).map((t) => <StatusBadge key={t} status={t} />)}{group.hasWinner && <StatusBadge status="verified" />}</div></div><div className="space-y-0.5 text-right text-xs text-white/60"><div><span className="text-sm font-semibold text-white">{tickets.length}</span> ticket{tickets.length === 1 ? "" : "s"}</div>{c?.draw_at && <div>Draw: {fmtDate(c.draw_at)}</div>}</div></div>
          <div className="mt-3 flex flex-wrap gap-1.5">{visible.map((t) => <span key={t.id} className={`font-mono text-xs rounded border px-2 py-1 ${t.is_winner ? "border-primary/50 bg-primary/20 font-bold text-primary" : "border-white/10 bg-white/5 text-white/80"}`}>{ticketLabel(t.ticket_number)}</span>)}{tickets.length > 5 && <button onClick={() => setExpanded((v) => !v)} className="rounded border border-primary/30 px-2 py-1 text-xs text-primary transition hover:bg-primary/10">{expanded ? "Show less" : `Show all ${tickets.length} tickets`}</button>}</div>
          {c?.slug ? <Link href={`/competitions/${c.slug}`} className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline">View competition <ExternalLink className="h-3 w-3" /></Link> : null}
        </div>
      </div>
    </div>
  );
}

export function AccountOrdersPage() {
  const data = useOrdersData();
  const totals = useMemo(() => ({ total: data.payments.length, ok: data.payments.filter((p) => p.status === "succeeded").length, spent: data.payments.filter((p) => p.status === "succeeded").reduce((s, p) => s + Number(p.amount || 0), 0), refunded: data.payments.reduce((s, p) => s + Number(p.refunded_amount || 0), 0) }), [data.payments]);
  return (
    <div><PageTitle icon={<Receipt className="h-5 w-5 text-primary" />} title="Orders" body="View your recent TopDraw purchases, entry totals and payment status." />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4"><StatTile label="Total orders" value={totals.total} icon={<ShoppingBag className="h-4 w-4" />} /><StatTile label="Successful" value={totals.ok} tone="success" icon={<CheckCircle2 className="h-4 w-4" />} /><StatTile label="Total spent" value={formatMoney(totals.spent)} tone="primary" icon={<Coins className="h-4 w-4" />} /><StatTile label="Refunded" value={formatMoney(totals.refunded)} tone="info" icon={<RotateCcw className="h-4 w-4" />} /></div>
      {data.loading ? <p className="text-sm text-white/60">Loading orders...</p> : data.payments.length === 0 ? <EmptyState icon={<Receipt className="h-5 w-5" />} title="No orders yet" body="Once you check out, your purchases will appear here with a full breakdown." action={<Button asChild><Link href="/competitions">View live competitions</Link></Button>} /> : <div className="space-y-4">{data.payments.map((p) => <OrderCard key={p.id} payment={p} lines={data.linesByPayment[p.id] ?? []} compsById={data.compsById} />)}</div>}
    </div>
  );
}

function useOrdersData() {
  const { supabase, user } = useSupabaseUser();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [linesByPayment, setLinesByPayment] = useState<Record<string, LineRow[]>>({});
  const [compsById, setCompsById] = useState<Record<string, CompetitionLite>>({});
  useEffect(() => {
    if (!supabase || !user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: pays } = await supabase.from("payments").select("id,created_at,amount,status,quantity,competition_id,subtotal_amount,discount_amount,discount_percentage,wallet_amount_used,refund_status,refunded_amount,is_multiline,pricing_snapshot").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
      const list = (pays ?? []) as PaymentRow[];
      const multilineIds = list.filter((p) => p.is_multiline).map((p) => p.id);
      let lines: LineRow[] = [];
      if (multilineIds.length) {
        const { data: ls } = await supabase.from("payment_lines").select("payment_id,competition_id,quantity,line_total").in("payment_id", multilineIds);
        lines = (ls ?? []) as LineRow[];
      }
      const compIds = new Set<string>();
      for (const p of list) { if (p.competition_id) compIds.add(p.competition_id); for (const s of snapshotLines(p.pricing_snapshot)) if (s.competition_id) compIds.add(s.competition_id); }
      for (const l of lines) if (l.competition_id) compIds.add(l.competition_id);
      let comps: CompetitionLite[] = [];
      if (compIds.size) {
        const { data: cs } = await supabase.from("competitions").select("id,title,slug,main_image_url,image_original_url,image_card_url,image_detail_url,image_thumb_url,status").in("id", Array.from(compIds));
        comps = (cs ?? []) as CompetitionLite[];
      }
      if (!cancelled) { setPayments(list); setLinesByPayment(lines.reduce((m, l) => ((m[l.payment_id] ||= []).push(l), m), {} as Record<string, LineRow[]>)); setCompsById(Object.fromEntries(comps.map((c) => [c.id, c]))); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [supabase, user]);
  return { loading, payments, linesByPayment, compsById };
}

function OrderCard({ payment: p, lines, compsById }: { payment: PaymentRow; lines: LineRow[]; compsById: Record<string, CompetitionLite> }) {
  const status = paymentStatus(p);
  const snapLines = snapshotLines(p.pricing_snapshot);
  const allLines = lines.length ? lines : snapLines;
  const totalQty = allLines.length ? allLines.reduce((s, l: any) => s + (l.quantity || 0), 0) : p.quantity || 0;
  const singleComp = !p.is_multiline && p.competition_id ? compsById[p.competition_id] : null;
  return (
    <Panel variant="glass" className="p-4 md:p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><span className="text-[11px] font-bold uppercase tracking-wider text-white/55">Order</span><span className="font-mono-num text-sm text-white">#{shortId(p.id)}</span><StatusBadge status={status.status} /></div><div className="mt-1 flex items-center gap-1.5 text-xs text-white/60"><Calendar className="h-3.5 w-3.5" />{new Date(p.created_at).toLocaleString()}</div></div><div className="text-right"><div className="font-mono-num font-display text-2xl font-extrabold text-white">{formatMoney(Number(p.amount || 0))}</div><div className="mt-0.5 flex justify-end gap-1 text-[11px] text-white/55">{totalQty} {totalQty === 1 ? "entry" : "entries"}</div></div></div>
      <div className="mb-3 flex flex-wrap gap-2">{Number(p.discount_amount || 0) > 0 && <SmallChip>Discount -{formatMoney(Number(p.discount_amount))}</SmallChip>}{Number(p.wallet_amount_used || 0) > 0 && <SmallChip>Wallet -{formatMoney(Number(p.wallet_amount_used))}</SmallChip>}{Number(p.refunded_amount || 0) > 0 && <SmallChip>Refunded {formatMoney(Number(p.refunded_amount))}</SmallChip>}</div>
      <div className="border-t border-white/10 pt-3"><div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-white/55">{p.is_multiline ? "Competitions in this order" : "Competition"}</div>{p.is_multiline ? <ul className="space-y-2">{allLines.map((l: any, i) => { const c = compsById[l.competition_id]; return <li key={i} className="flex items-center justify-between gap-3 text-sm"><div className="min-w-0 text-white">{c?.title ?? l.title ?? "Competition"}<div className="text-[11px] text-white/55">{l.quantity ?? 0} entries</div></div>{c ? <Link href={`/competitions/${c.slug}`} className="shrink-0 text-[11px] text-primary hover:text-white">View</Link> : null}</li>; })}</ul> : <div className="flex items-center justify-between gap-3"><div className="min-w-0 text-sm text-white">{singleComp?.title ?? "Competition"}<div className="text-[11px] text-white/55">{totalQty} entries</div></div>{singleComp ? <Link href={`/competitions/${singleComp.slug}`} className="shrink-0 text-[11px] text-primary hover:text-white">View competition</Link> : null}</div>}</div>
    </Panel>
  );
}

function SmallChip({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/80">{children}</span>;
}

export function AccountWalletPage() {
  const { supabase, user } = useSupabaseUser();
  const [balance, setBalance] = useState<number | null>(null);
  const [lifetimeEarned, setLifetimeEarned] = useState(0);
  const [lifetimeSpent, setLifetimeSpent] = useState(0);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [settings, setSettings] = useState<{ is_earn_enabled: boolean; earn_percentage: number } | null>(null);
  useEffect(() => { if (!supabase || !user) return; (async () => { const [{ data: w }, { data: t }, { data: s }] = await Promise.all([supabase.from("wallets").select("balance,lifetime_earned,lifetime_spent").eq("user_id", user.id).maybeSingle(), supabase.from("wallet_transactions").select("id,delta,balance_after,kind,note,created_at,expires_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10), supabase.from("wallet_public_settings").select("is_earn_enabled,earn_percentage").maybeSingle()]); setBalance(Number(w?.balance ?? 0)); setLifetimeEarned(Number(w?.lifetime_earned ?? 0)); setLifetimeSpent(Number(w?.lifetime_spent ?? 0)); setTxns(t ?? []); setSettings(s); })(); }, [supabase, user]);
  return <WalletView balance={balance} lifetimeEarned={lifetimeEarned} lifetimeSpent={lifetimeSpent} txns={txns} settings={settings} compact />;
}

function WalletView({ balance, lifetimeEarned, lifetimeSpent, txns, settings, compact }: { balance: number | null; lifetimeEarned: number; lifetimeSpent: number; txns: Txn[]; settings: any; compact?: boolean }) {
  return (
    <div><PageTitle icon={<WalletIcon className="h-5 w-5 text-gold" />} title="Wallet" body="Your wallet shows TopDraw credit added to your account, including eligible refunds and admin-issued credit." />
      <Panel variant="glass" tone="gold" className="mb-5 p-6"><div className="eyebrow">Available credit</div><div className="font-mono-num font-display mt-1 text-4xl font-extrabold text-white">{formatMoney(balance ?? 0)}</div><div className="mt-4 grid grid-cols-2 gap-4 text-sm"><div><div className="text-[11px] font-bold uppercase tracking-wider text-white/55">Credit added</div><div className="font-mono-num font-bold text-white">{formatMoney(lifetimeEarned)}</div></div><div><div className="text-[11px] font-bold uppercase tracking-wider text-white/55">Credit spent</div><div className="font-mono-num font-bold text-white">{formatMoney(lifetimeSpent)}</div></div></div>{settings?.is_earn_enabled && Number(settings.earn_percentage) > 0 ? <div className="mt-4 inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-1.5 text-xs text-white"><Sparkles className="h-3 w-3 text-gold" />Earn {Number(settings.earn_percentage)}% of every paid entry as wallet credit</div> : null}</Panel>
      <div className="mb-2 flex items-end justify-between"><h2 className="text-lg font-semibold text-white">Recent activity</h2>{compact ? <Link href="/account/transactions" className="text-xs text-primary hover:text-white">View all transactions</Link> : null}</div>
      {txns.length === 0 ? <p className="rounded-lg border border-white/10 bg-card p-4 text-sm text-white/70">No wallet activity yet. Refunds and admin-issued credit will appear here.</p> : <div className="space-y-2">{txns.map((t) => <WalletTxnRow key={t.id} txn={t} />)}</div>}
    </div>
  );
}

function WalletTxnRow({ txn: t }: { txn: Txn }) {
  const meta = KIND_META[t.kind] ?? { label: t.kind, icon: ArrowUpCircle, tone: "text-white/60" };
  const Icon = meta.icon;
  return <Panel variant="glass" className="p-3 md:p-4"><div className="flex items-start gap-3"><div className={`mt-0.5 grid h-9 w-9 place-items-center rounded-lg bg-white/5 ${meta.tone}`}><Icon className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="text-sm font-semibold text-white">{meta.label}</div><div className="mt-0.5 text-[11px] text-white/55">{new Date(t.created_at).toLocaleString()}</div>{t.note ? <div className="mt-1 text-xs text-white/60">{t.note}</div> : null}{t.expires_at ? <div className="mt-1 text-[11px] text-warning">Expires {fmtDate(t.expires_at)}</div> : null}</div><div className="shrink-0 text-right"><div className={`font-mono-num font-bold ${Number(t.delta) < 0 ? "text-warning" : "text-success"}`}>{Number(t.delta) < 0 ? "-" : "+"}{formatMoney(Math.abs(Number(t.delta)))}</div><div className="font-mono-num text-[11px] text-white/50">Bal {formatMoney(Number(t.balance_after))}</div></div></div></Panel>;
}

export function AccountProfilePage() {
  const { supabase, user } = useSupabaseUser();
  const [form, setForm] = useState<any>({ full_name: "", phone: "", date_of_birth: "", address_line_1: "", address_line_2: "", town_city: "", county: "", postcode: "", country: "United Kingdom", marketing_consent: false });
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => { if (!supabase || !user) return; supabase.from("profiles").select("email,full_name,phone,date_of_birth,address_line_1,address_line_2,town_city,county,postcode,country,marketing_consent,verification_status").eq("id", user.id).maybeSingle().then(({ data }: any) => { if (data) { setEmail(data.email || user.email || ""); setForm({ full_name: data.full_name || "", phone: data.phone || "", date_of_birth: data.date_of_birth || "", address_line_1: data.address_line_1 || "", address_line_2: data.address_line_2 || "", town_city: data.town_city || "", county: data.county || "", postcode: data.postcode || "", country: data.country || "United Kingdom", marketing_consent: !!data.marketing_consent, verification_status: data.verification_status }); } else setEmail(user.email || ""); setLoading(false); }); }, [supabase, user]);
  async function save(e: React.FormEvent) { e.preventDefault(); if (!supabase || !user) return; if (!form.full_name.trim()) return setMessage("Please enter your full name"); setSaving(true); const payload = { full_name: form.full_name.trim(), phone: form.phone.trim() || null, date_of_birth: form.date_of_birth || null, address_line_1: form.address_line_1.trim() || null, address_line_2: form.address_line_2.trim() || null, town_city: form.town_city.trim() || null, county: form.county.trim() || null, postcode: form.postcode.trim() || null, country: form.country.trim() || "United Kingdom", marketing_consent: form.marketing_consent }; const { error } = await supabase.from("profiles").update(payload).eq("id", user.id); setSaving(false); setMessage(error ? error.message : "Profile updated"); }
  const update = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  return <div className="space-y-6"><PageTitle icon={<UserCog className="h-5 w-5 text-primary" />} title="Profile details" body="Keep your details up to date so we can verify your account and contact you if you win." />{loading ? <p className="text-white/60">Loading...</p> : <form onSubmit={save} className="space-y-5"><Panel variant="glass" className="p-5 md:p-6"><div className="eyebrow mb-3">Personal details</div><div className="grid gap-4 sm:grid-cols-2"><Field label="Full name"><Input value={form.full_name} onChange={(e) => update("full_name", e.target.value)} required /></Field><Field label="Login email" hint="Email is read-only here. Use Login & security to request a change."><Input value={email} readOnly disabled /></Field><Field label="Date of birth"><Input type="date" value={form.date_of_birth} onChange={(e) => update("date_of_birth", e.target.value)} /></Field></div></Panel><Panel variant="glass" className="border-primary/20 bg-[linear-gradient(135deg,hsl(222_28%_12%/0.86),hsl(222_32%_8%/0.78))] p-5 md:p-6"><div className="eyebrow mb-3">Contact and delivery details</div><div className="grid gap-4 sm:grid-cols-2">{["phone","address_line_1","address_line_2","town_city","county","postcode","country"].map((k) => <Field key={k} label={k.replaceAll("_", " ")}><Input value={form[k] || ""} onChange={(e) => update(k, e.target.value)} /></Field>)}</div></Panel><Panel variant="glass" className="p-5 md:p-6"><div className="eyebrow mb-3">Marketing preferences</div><label className="flex cursor-pointer items-start gap-3"><input type="checkbox" checked={form.marketing_consent} onChange={(e) => update("marketing_consent", e.target.checked)} className="mt-0.5 h-4 w-4 accent-primary" /><span className="text-sm text-white/80">Email me occasional updates about new competitions, winners and free entry routes. You can opt out at any time.</span></label></Panel>{message ? <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">{message}</div> : null}<Button type="submit" disabled={saving} className="bg-primary font-bold uppercase tracking-wider hover:bg-primary/90">{saving ? "Saving..." : "Save changes"}</Button></form>}</div>;
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return <div className="space-y-1.5"><label className="text-xs font-bold uppercase tracking-wider text-white/60">{label}</label>{children}{hint ? <p className="text-[11px] text-white/45">{hint}</p> : null}</div>;
}

export function AccountSecurityPage() {
  const { supabase, user, signOut } = useSupabaseUser();
  const router = useRouter();
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [pwd, setPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => { if (!supabase || !user) return; supabase.from("profiles").select("created_at").eq("id", user.id).maybeSingle().then(({ data }: any) => setCreatedAt(data?.created_at ?? null)); }, [supabase, user]);
  async function updatePassword(e: React.FormEvent) { e.preventDefault(); if (!supabase) return; if (pwd.length < 8) return setMessage("Password must be at least 8 characters"); if (pwd !== confirmPwd) return setMessage("Passwords do not match"); setSaving(true); const { error } = await supabase.auth.updateUser({ password: pwd }); setSaving(false); if (error) setMessage(error.message); else { setPwd(""); setConfirmPwd(""); setMessage("Password updated"); } }
  async function logout() { await signOut(); router.replace("/login"); }
  return <div className="space-y-6"><PageTitle icon={<ShieldCheck className="h-5 w-5 text-primary" />} title="Login & security" body="Manage how you sign in to TopDraw. For your safety, password changes take effect immediately." /><Panel variant="glass" className="p-5 md:p-6"><div className="eyebrow mb-3">Account</div><dl className="grid gap-3 text-sm sm:grid-cols-2"><Info label="Login email" value={user?.email || "-"} /><Info label="Account created" value={createdAt ? fmtDate(createdAt) : "-"} /></dl><p className="mt-3 text-xs text-white/50">Need to change your login email? Contact support.</p></Panel><Panel variant="glass" className="p-5 md:p-6"><div className="eyebrow mb-3">Change password</div><form onSubmit={updatePassword} className="max-w-md space-y-4"><Field label="New password"><Input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} minLength={8} required /></Field><Field label="Confirm new password"><Input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} minLength={8} required /></Field>{message ? <div className="text-sm text-white/75">{message}</div> : null}<Button type="submit" disabled={saving} className="bg-primary font-bold uppercase tracking-wider hover:bg-primary/90">{saving ? "Updating..." : "Update password"}</Button></form></Panel><Panel variant="glass" className="p-5 md:p-6"><div className="eyebrow mb-2">Sign out</div><p className="mb-3 text-sm text-white/70">Sign out of TopDraw on this device.</p><Button onClick={logout} variant="outline"><LogOut className="h-4 w-4" /> Sign out</Button></Panel></div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3"><dt className="text-[11px] font-bold uppercase tracking-wider text-white/50">{label}</dt><dd className="mt-0.5 break-all text-white">{value}</dd></div>;
}

export function AccountWinsPage() {
  const { supabase, user } = useSupabaseUser();
  const [rows, setRows] = useState<any[] | null>(null);
  const load = useCallback(async () => { if (!supabase || !user) return; const { data } = await supabase.from("winners").select("id,prize_title,winning_ticket_number,draw_date,proof_url,is_published,competition_id,display_name,display_location,image_url,entry_id,claim_status,claim_submitted_at,claim_verified_at,dispatched_at,delivered_at,prize_choice,delivery_courier,delivery_tracking_url,competition:competitions(title,slug,main_image_url,cash_alternative)").eq("user_id", user.id).order("draw_date", { ascending: false }); setRows((data ?? []).map((w: any) => ({ ...w, competition: Array.isArray(w.competition) ? w.competition[0] : w.competition }))); }, [supabase, user]);
  useEffect(() => { load(); }, [load]);
  return <div><PageTitle title="My wins" />{rows === null ? <p className="text-white/60">Loading...</p> : rows.length === 0 ? <EmptyState title="No wins yet" body="When you win, your prize and winning ticket will appear here. Good luck!" action={<Button asChild><Link href="/competitions">Browse competitions</Link></Button>} /> : <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{rows.map((w) => <li key={w.id} className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-card"><SafePrizeImage url={w.competition?.main_image_url ?? w.image_url ?? null} alt={w.prize_title || "Prize"} aspect="aspect-square" width={560} height={560} /><div className="flex flex-1 flex-col p-4"><div className="flex items-center justify-between gap-2"><StatusBadge status={w.is_published ? "published" : "pending"} /><span className="font-mono text-xs text-white">#{w.winning_ticket_number}</span></div><div className="mt-2 font-semibold text-white">{w.competition?.title || w.prize_title}</div><div className="mt-1 text-xs text-white/60">Drawn {fmtDate(w.draw_date)}</div><div className="mt-3"><StatusBadge status={w.claim_status || "unclaimed"} /></div>{w.delivery_tracking_url ? <a href={w.delivery_tracking_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-primary">Track delivery</a> : null}{w.proof_url ? <a href={w.proof_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-primary">Draw proof</a> : null}<div className="mt-auto pt-3">{(w.claim_status === "unclaimed" || w.claim_status === "claim_started") ? <p className="text-xs text-white/60">Prize claim support is being ported. Contact support to claim this prize.</p> : null}</div></div></li>)}</ul>}</div>;
}

export function AccountResponsiblePlayPage() {
  const { supabase, user } = useSupabaseUser();
  const [active, setActive] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [duration, setDuration] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const options = [{ value: "24_hours", label: "24 hours", sub: "Cool-off for one day" }, { value: "7_days", label: "7 days", sub: "One week break" }, { value: "30_days", label: "30 days", sub: "Month-long break" }, { value: "6_months", label: "6 months", sub: "Extended break" }, { value: "indefinite", label: "Indefinite", sub: "No automatic end date" }];
  const load = useCallback(async () => { if (!supabase || !user) return; setLoading(true); const { data, error } = await supabase.rpc("get_active_self_exclusion"); setActive(error ? null : Array.isArray(data) ? data[0] ?? null : data ?? null); setLoading(false); }, [supabase, user]);
  useEffect(() => { load(); }, [load]);
  async function submit() { if (!supabase || !duration || !confirmed) return; setSubmitting(true); const { error } = await supabase.rpc("create_self_exclusion", { p_duration: duration, p_reason: reason.trim() || null }); setSubmitting(false); if (error) setMessage(error.message || "Could not start self-exclusion."); else { setMessage("Self-exclusion is now active."); setDuration(null); setReason(""); setConfirmed(false); await load(); } }
  return <div><PageTitle icon={<LifeBuoy className="h-5 w-5 text-primary" />} title="Responsible play" body="TopDraw is for UK residents aged 18 or over. If you need a break from entering competitions, you can use self-exclusion to stop yourself from entering for a selected period." /><Panel variant="glass" tone={active ? "warning" : "default"} className="mb-6 p-5"><div className="flex gap-3"><ShieldAlert className={`mt-0.5 h-5 w-5 ${active ? "text-warning" : "text-white/50"}`} /><div><div className="eyebrow mb-1">Status</div>{loading ? <p className="text-sm text-white/60">Loading...</p> : active ? <p className="text-white">{active.ends_at ? <>You are self-excluded until <span className="font-semibold">{new Date(active.ends_at).toLocaleString()}</span>.</> : "You are self-excluded indefinitely."}</p> : <p className="text-white/80">You do not currently have an active self-exclusion.</p>}{active ? <p className="mt-2 text-xs text-white/55">You cannot enter competitions during this period. This cannot be shortened or removed from your account.</p> : null}</div></div></Panel>{!active && !loading ? <Panel variant="glass" className="mb-6 p-5"><h2 className="mb-1 text-lg font-semibold text-white">Start a self-exclusion</h2><p className="mb-4 text-sm text-white/60">Choose how long you want to be excluded from entering.</p><div className="mb-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{options.map((o) => <button key={o.value} type="button" onClick={() => setDuration(o.value)} className={`rounded-lg border p-3 text-left transition ${duration === o.value ? "border-primary/60 bg-primary/15 shadow-glow-soft" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"}`}><div className="text-sm font-semibold text-white">{o.label}</div><div className="mt-0.5 text-[11px] text-white/55">{o.sub}</div></button>)}</div><label className="mb-1 block text-xs font-bold uppercase tracking-wider text-white/55">Reason (optional)</label><textarea value={reason} onChange={(e) => setReason(e.target.value.slice(0, 500))} rows={3} className="mb-4 w-full rounded-md border border-white/10 bg-white/5 p-3 text-white" /><label className="mb-4 flex cursor-pointer items-start gap-2"><input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5 h-4 w-4 accent-primary" /><span className="text-sm text-white/80">I understand I will not be able to enter competitions during this period.</span></label><Button disabled={!duration || !confirmed || submitting} onClick={submit} className="bg-primary font-bold uppercase tracking-wider hover:bg-primary/90">{submitting ? "Starting..." : "Start self-exclusion"}</Button></Panel> : null}{message ? <div className="mb-4 rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white/80">{message}</div> : null}<Panel variant="outline" className="p-5"><h3 className="mb-1 font-semibold text-white">Need support?</h3><p className="text-sm text-white/70">If you feel you need support with controlling your play, consider speaking to a trusted person or contacting a support organisation. You can also read our <Link href="/responsible-play" className="text-primary hover:underline">responsible play guidance</Link>.</p></Panel></div>;
}

export function AccountTransactionsPage() {
  const { supabase, user } = useSupabaseUser();
  const [wallet, setWallet] = useState<Txn[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { if (!supabase || !user) return; (async () => { const [{ data: w }, { data: p }] = await Promise.all([supabase.from("wallet_transactions").select("id,delta,balance_after,kind,note,created_at,expires_at,reference_type,reference_id").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100), supabase.from("payments").select("id,created_at,amount,status,refund_status,refunded_amount,wallet_amount_used,discount_amount,is_multiline").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100)]); setWallet(w ?? []); setPayments(p ?? []); setLoading(false); })(); }, [supabase, user]);
  return <div><PageTitle title="Transactions" body="Track wallet credit, refunds, adjustments and payment activity on your TopDraw account." />{loading ? <p className="text-white/60">Loading...</p> : <div className="space-y-2">{wallet.map((t) => <WalletTxnRow key={t.id} txn={t} />)}{payments.map((p) => <Panel key={p.id} variant="glass" className="p-3 md:p-4"><div className="flex items-start gap-3"><div className="mt-0.5 grid h-9 w-9 place-items-center rounded-lg bg-white/5 text-primary"><ShoppingBag className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-[11px] font-bold uppercase tracking-wider text-white/55">Order</span><span className="font-mono-num text-sm text-white">#{shortId(p.id)}</span><StatusBadge status={paymentStatus(p).status} /></div><div className="mt-0.5 text-[11px] text-white/55">{new Date(p.created_at).toLocaleString()}</div></div><div className="shrink-0 text-right"><div className="font-mono-num font-bold text-white">{formatMoney(Number(p.amount || 0))}</div><Link href="/account/orders" className="text-[11px] text-primary hover:text-white">View order</Link></div></div></Panel>)}</div>}</div>;
}
