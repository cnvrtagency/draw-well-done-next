"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, Archive, ArrowDownCircle, ArrowRight, ArrowUpCircle, Calendar, CheckCircle2, Coins, ExternalLink, FileCheck2, Gift, Info as InfoIcon, LifeBuoy, Loader2, LogOut, Mail, MapPin, Phone, Receipt, RotateCcw, ShieldAlert, ShieldCheck, ShoppingBag, Sparkles, Ticket as TicketIcon, Trophy, Upload, User, UserCog, Wallet as WalletIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  expiry: { label: "Credit expired", icon: Calendar, tone: "td-soft" },
  adjustment: { label: "Adjustment", icon: ArrowUpCircle, tone: "td-soft" },
};

type EntryRow = { id: string; ticket_number: number; entry_type?: string; status?: string; is_winner: boolean; created_at: string; competition_id: string };
type CompetitionLite = { id: string; title: string; slug: string; status: string; draw_at: string | null; closes_at: string | null; main_image_url?: string | null; image_original_url?: string | null; image_card_url?: string | null; image_detail_url?: string | null; image_thumb_url?: string | null; cash_alternative?: number | null };
type PaymentRow = { id: string; created_at: string; amount: number; status: string; quantity: number | null; competition_id: string | null; subtotal_amount: number | null; discount_amount: number | null; discount_percentage: number | null; wallet_amount_used: number | null; refund_status: string | null; refunded_amount: number | null; is_multiline: boolean | null; pricing_snapshot: Record<string, any> | null };
type LineRow = { payment_id: string; competition_id: string; quantity: number | null; line_total: number | null };
type Txn = { id: string; delta: number; balance_after: number; kind: string; note: string | null; created_at: string; expires_at: string | null; reference_type?: string | null; reference_id?: string | null };
type ProfileForm = {
  full_name: string;
  phone: string;
  date_of_birth: string;
  address_line_1: string;
  address_line_2: string;
  town_city: string;
  county: string;
  postcode: string;
  country: string;
  marketing_consent: boolean;
};
type WinnerRow = {
  id: string;
  prize_title: string | null;
  winning_ticket_number: number | null;
  draw_date: string;
  proof_url: string | null;
  is_published: boolean;
  competition_id: string;
  display_name: string | null;
  display_location: string | null;
  image_url: string | null;
  entry_id: string | null;
  claim_status: string;
  claim_submitted_at: string | null;
  claim_verified_at: string | null;
  dispatched_at: string | null;
  delivered_at: string | null;
  prize_choice: string | null;
  delivery_courier: string | null;
  delivery_tracking_url: string | null;
  competition?: { title: string | null; slug: string | null; main_image_url: string | null; cash_alternative: number | null } | null;
};

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

function friendlyError(error: unknown) {
  const msg = (error as any)?.message ?? String(error ?? "");
  if (/row-level security|new row violates/i.test(msg)) return "You don't have permission to do that.";
  if (/jwt|unauthor/i.test(msg)) return "You need to be signed in to do that.";
  if (/network|failed to fetch/i.test(msg)) return "Network error, please check your connection and try again.";
  return msg || "Something went wrong. Please try again.";
}

function isUnder18(dob: string): boolean {
  if (!dob) return false;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return true;
  const now = new Date();
  const eighteen = new Date(now.getFullYear() - 18, now.getMonth(), now.getDate());
  return d > eighteen;
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
        <h1 className="font-display text-2xl font-semibold td-text md:text-3xl">{title}</h1>
      </div>
      {body ? <p className="max-w-2xl text-sm td-muted">{body}</p> : null}
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
      <div className="account-header">
        <div className="eyebrow mb-1">Welcome back</div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-display inline-flex items-center gap-2 text-xl font-bold tracking-tight td-text md:text-4xl">{profile?.full_name || "My account"}{profile?.verification_status === "verified" && <VerifiedBadge size="sm" />}</h1>
            <p className="mt-2 hidden max-w-2xl text-sm td-muted md:block">Review your tickets, prizes, wallet credit and account details from one place.</p>
          </div>
          <Button asChild size="sm" className="btn-primary-glow font-bold uppercase tracking-wider"><Link href="/competitions">Enter now <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
        </div>
      </div>
      {activeExclusion ? <Panel variant="glass" tone="warning" className="p-4"><div className="flex gap-3"><ShieldAlert className="mt-0.5 h-5 w-5 text-warning" /><div><div className="font-semibold td-text">Self-exclusion active</div><div className="mt-0.5 text-sm td-muted">{activeExclusion.ends_at ? <>You cannot enter competitions until <span className="font-semibold">{new Date(activeExclusion.ends_at).toLocaleString()}</span>.</> : "You are self-excluded indefinitely and cannot enter competitions."}</div><Link href="/account/responsible-play" className="mt-2 inline-block text-xs text-primary hover:underline">Manage responsible play</Link></div></div></Panel> : null}
      {unclaimedCount > 0 ? <Panel variant="glass" tone="primary" className="p-4"><div className="flex gap-3"><Trophy className="mt-0.5 h-5 w-5 text-primary" /><div><div className="font-semibold td-text">You have a prize waiting to claim</div><div className="mt-0.5 text-sm td-muted">{unclaimedCount === 1 ? "1 prize is ready" : `${unclaimedCount} prizes are ready`} for you to confirm delivery details.</div><Link href="/account/wins" className="mt-2 inline-block text-xs text-primary hover:underline">Claim prize</Link></div></div></Panel> : null}
      <div className="grid grid-cols-2 gap-2 md:gap-3 lg:grid-cols-4">
        <StatTile label="Live entries" value={stats.live} tone="primary" icon={<Activity className="h-4 w-4" />} />
        <StatTile label="Total entries" value={stats.entries} tone="info" icon={<TicketIcon className="h-4 w-4" />} />
        <StatTile label="Past entries" value={stats.past} icon={<Archive className="h-4 w-4" />} />
        <StatTile label="Wins" value={winsCount} tone="gold" icon={<Trophy className="h-4 w-4" />} />
      </div>
      <div className="grid grid-cols-2 gap-2 md:gap-3">
        <Panel variant="glass" className="td-border bg-[color:var(--td-surface-soft)] p-2.5 md:p-5"><div className="eyebrow mb-1">Latest entry</div>{stats.latest ? <><Link href={`/competitions/${stats.latest.slug}`} className="line-clamp-1 block text-[13px] font-semibold leading-snug td-text transition hover:text-primary md:text-base">{stats.latest.title}</Link><div className="font-mono-num mt-1 text-[10px] td-soft md:text-xs">Ticket {ticketLabel(stats.latest.ticket_number)} · {fmtDate(stats.latest.created_at)}</div></> : <p className="mt-1 text-xs td-soft md:text-sm">No entries yet.</p>}</Panel>
        <Panel variant="glass" tone="primary" className="bg-primary/[0.055] p-2.5 md:p-5"><div className="eyebrow mb-1">Next draw</div>{stats.nextDraw ? <><Link href={`/competitions/${stats.nextDraw.slug}`} className="line-clamp-1 block text-[13px] font-semibold leading-snug td-text transition hover:text-primary md:text-base">{stats.nextDraw.title}</Link><div className="font-mono-num mt-1 text-[10px] td-soft md:text-xs">{new Date(stats.nextDraw.draw_at).toLocaleString()}</div></> : <p className="mt-1 text-xs td-soft md:text-sm">No upcoming draw scheduled for your live entries.</p>}</Panel>
      </div>
      <Panel variant="glass" className="account-panel overflow-hidden border-primary/20 p-0">
        <div className="border-b td-border p-3.5 md:p-6"><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div><h2 className="font-display text-lg font-bold tracking-tight td-text md:text-2xl">Profile details</h2><p className="mt-1.5 hidden max-w-2xl text-sm td-muted md:block">Keep your details up to date so we can verify your account and contact you if you win.</p></div><div><Button asChild className="w-full border border-primary/40 bg-primary/15 td-text hover:bg-primary/25 md:w-auto"><Link href="/account/profile">{profileContactComplete ? "Edit profile details" : "Complete profile details"}</Link></Button>{!profileContactComplete ? <p className="mt-2 max-w-[34ch] text-xs leading-relaxed td-soft">Add your phone number and address details so prize claims are quicker if you win.</p> : null}</div></div></div>
        {profile ? <dl className="grid grid-cols-2 gap-2 p-3 text-sm md:gap-3 md:p-6">{[{ label: "Name", value: displayValue(profile.full_name), icon: User }, { label: "Email", value: displayValue(profile.email), icon: Mail }, { label: "Postcode", value: displayValue(profile.postcode), icon: MapPin }, { label: "Phone", value: displayValue(profile.phone), icon: Phone }].map(({ label, value, icon: Icon }) => <div key={label} className="min-w-0 rounded-xl border td-border bg-[color:var(--td-surface-soft)] p-2.5 md:p-3.5"><dt className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider td-soft md:text-[11px]"><Icon className="h-3.5 w-3.5 text-primary" />{label}</dt><dd className={`mt-1 truncate text-[13px] md:text-sm ${value === "Not added yet" ? "td-faint" : "td-text"}`}>{value}</dd></div>)}</dl> : <p className="p-5 text-sm td-soft md:p-6">Loading...</p>}
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
      {rows === null ? <p className="td-soft">Loading...</p> : rows.length === 0 ? <EmptyState title="No tickets yet" body="Browse live competitions and pick up your first ticket." action={<Button asChild><Link href="/competitions">View competitions</Link></Button>} /> : <>
        <div className="mb-4 inline-flex rounded-lg border td-border bg-[color:var(--td-surface-muted)] p-1"><button onClick={() => setTab("current")} className={`rounded-md px-3 py-1.5 text-sm font-bold ${tab === "current" ? "bg-primary text-white" : "td-muted"}`}>Current ({current.length})</button><button onClick={() => setTab("past")} className={`rounded-md px-3 py-1.5 text-sm font-bold ${tab === "past" ? "bg-primary text-white" : "td-muted"}`}>Past ({past.length})</button></div>
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
    <div className="glass-panel rounded-xl border td-border bg-[color:var(--td-surface)] p-4 md:p-5">
      <div className="flex flex-col gap-4 sm:flex-row">{img ? <img src={img} alt={c?.title ?? ""} className="h-32 w-full flex-shrink-0 rounded-lg border td-border object-cover sm:w-32" /> : <div className="flex h-32 w-full flex-shrink-0 items-center justify-center rounded-lg border td-border bg-[color:var(--td-surface-muted)] td-faint sm:w-32"><TicketIcon className="h-8 w-8" /></div>}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2"><div>{c?.slug ? <Link href={`/competitions/${c.slug}`} className="text-base font-semibold td-text transition hover:text-primary md:text-lg">{c.title}</Link> : <span className="text-base font-semibold td-soft md:text-lg">Competition unavailable</span>}<div className="mt-1.5 flex flex-wrap items-center gap-2">{c && <StatusBadge status={c.status} />}{Array.from(group.types).map((t) => <StatusBadge key={t} status={t} />)}{group.hasWinner && <StatusBadge status="verified" />}</div></div><div className="space-y-0.5 text-right text-xs td-soft"><div><span className="text-sm font-semibold td-text">{tickets.length}</span> ticket{tickets.length === 1 ? "" : "s"}</div>{c?.draw_at && <div>Draw: {fmtDate(c.draw_at)}</div>}</div></div>
          <div className="mt-3 flex flex-wrap gap-1.5">{visible.map((t) => <span key={t.id} className={`font-mono text-xs rounded border px-2 py-1 ${t.is_winner ? "border-primary/50 bg-primary/20 font-bold text-primary" : "td-border bg-[color:var(--td-surface-muted)] td-muted"}`}>{ticketLabel(t.ticket_number)}</span>)}{tickets.length > 5 && <button onClick={() => setExpanded((v) => !v)} className="rounded border border-primary/30 px-2 py-1 text-xs text-primary transition hover:bg-primary/10">{expanded ? "Show less" : `Show all ${tickets.length} tickets`}</button>}</div>
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
      {data.loading ? <p className="text-sm td-soft">Loading orders...</p> : data.payments.length === 0 ? <EmptyState icon={<Receipt className="h-5 w-5" />} title="No orders yet" body="Once you check out, your purchases will appear here with a full breakdown." action={<Button asChild><Link href="/competitions">View live competitions</Link></Button>} /> : <div className="space-y-4">{data.payments.map((p) => <OrderCard key={p.id} payment={p} lines={data.linesByPayment[p.id] ?? []} compsById={data.compsById} />)}</div>}
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
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><span className="text-[11px] font-bold uppercase tracking-wider td-soft">Order</span><span className="font-mono-num text-sm td-text">#{shortId(p.id)}</span><StatusBadge status={status.status} /></div><div className="mt-1 flex items-center gap-1.5 text-xs td-soft"><Calendar className="h-3.5 w-3.5" />{new Date(p.created_at).toLocaleString()}</div></div><div className="text-right"><div className="font-mono-num font-display text-2xl font-extrabold td-text">{formatMoney(Number(p.amount || 0))}</div><div className="mt-0.5 flex justify-end gap-1 text-[11px] td-soft">{totalQty} {totalQty === 1 ? "entry" : "entries"}</div></div></div>
      <div className="mb-3 flex flex-wrap gap-2">{Number(p.discount_amount || 0) > 0 && <SmallChip>Discount -{formatMoney(Number(p.discount_amount))}</SmallChip>}{Number(p.wallet_amount_used || 0) > 0 && <SmallChip>Wallet -{formatMoney(Number(p.wallet_amount_used))}</SmallChip>}{Number(p.refunded_amount || 0) > 0 && <SmallChip>Refunded {formatMoney(Number(p.refunded_amount))}</SmallChip>}</div>
      <div className="border-t td-border pt-3"><div className="mb-2 text-[11px] font-bold uppercase tracking-wider td-soft">{p.is_multiline ? "Competitions in this order" : "Competition"}</div>{p.is_multiline ? <ul className="space-y-2">{allLines.map((l: any, i) => { const c = compsById[l.competition_id]; return <li key={i} className="flex items-center justify-between gap-3 text-sm"><div className="min-w-0 td-text">{c?.title ?? l.title ?? "Competition"}<div className="text-[11px] td-soft">{l.quantity ?? 0} entries</div></div>{c ? <Link href={`/competitions/${c.slug}`} className="shrink-0 text-[11px] text-primary hover:text-[color:var(--td-text)]">View</Link> : null}</li>; })}</ul> : <div className="flex items-center justify-between gap-3"><div className="min-w-0 text-sm td-text">{singleComp?.title ?? "Competition"}<div className="text-[11px] td-soft">{totalQty} entries</div></div>{singleComp ? <Link href={`/competitions/${singleComp.slug}`} className="shrink-0 text-[11px] text-primary hover:text-[color:var(--td-text)]">View competition</Link> : null}</div>}</div>
    </Panel>
  );
}

function SmallChip({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex rounded-md border td-border bg-[color:var(--td-surface-muted)] px-2 py-1 text-[11px] td-muted">{children}</span>;
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
      <Panel variant="glass" tone="gold" className="mb-5 p-6"><div className="eyebrow">Available credit</div><div className="font-mono-num font-display mt-1 text-4xl font-extrabold td-text">{formatMoney(balance ?? 0)}</div><div className="mt-4 grid grid-cols-2 gap-4 text-sm"><div><div className="text-[11px] font-bold uppercase tracking-wider td-soft">Credit added</div><div className="font-mono-num font-bold td-text">{formatMoney(lifetimeEarned)}</div></div><div><div className="text-[11px] font-bold uppercase tracking-wider td-soft">Credit spent</div><div className="font-mono-num font-bold td-text">{formatMoney(lifetimeSpent)}</div></div></div>{settings?.is_earn_enabled && Number(settings.earn_percentage) > 0 ? <div className="mt-4 inline-flex items-center gap-2 rounded-md bg-[color:var(--td-surface-hover)] px-3 py-1.5 text-xs td-text"><Sparkles className="h-3 w-3 text-gold" />Earn {Number(settings.earn_percentage)}% of every paid entry as wallet credit</div> : null}</Panel>
      <div className="mb-2 flex items-end justify-between"><h2 className="text-lg font-semibold td-text">Recent activity</h2>{compact ? <Link href="/account/transactions" className="text-xs text-primary hover:text-[color:var(--td-text)]">View all transactions</Link> : null}</div>
      {txns.length === 0 ? <p className="rounded-lg border td-border bg-[color:var(--td-surface)] p-4 text-sm td-muted">No wallet activity yet. Refunds and admin-issued credit will appear here.</p> : <div className="space-y-2">{txns.map((t) => <WalletTxnRow key={t.id} txn={t} />)}</div>}
    </div>
  );
}

function WalletTxnRow({ txn: t }: { txn: Txn }) {
  const meta = KIND_META[t.kind] ?? { label: t.kind, icon: ArrowUpCircle, tone: "td-soft" };
  const Icon = meta.icon;
  return <Panel variant="glass" className="p-3 md:p-4"><div className="flex items-start gap-3"><div className={`mt-0.5 grid h-9 w-9 place-items-center rounded-lg bg-[color:var(--td-surface-muted)] ${meta.tone}`}><Icon className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="text-sm font-semibold td-text">{meta.label}</div><div className="mt-0.5 text-[11px] td-soft">{new Date(t.created_at).toLocaleString()}</div>{t.note ? <div className="mt-1 text-xs td-soft">{t.note}</div> : null}{t.expires_at ? <div className="mt-1 text-[11px] text-warning">Expires {fmtDate(t.expires_at)}</div> : null}</div><div className="shrink-0 text-right"><div className={`font-mono-num font-bold ${Number(t.delta) < 0 ? "text-warning" : "text-success"}`}>{Number(t.delta) < 0 ? "-" : "+"}{formatMoney(Math.abs(Number(t.delta)))}</div><div className="font-mono-num text-[11px] td-faint">Bal {formatMoney(Number(t.balance_after))}</div></div></div></Panel>;
}

const EMPTY_PROFILE: ProfileForm = {
  full_name: "",
  phone: "",
  date_of_birth: "",
  address_line_1: "",
  address_line_2: "",
  town_city: "",
  county: "",
  postcode: "",
  country: "United Kingdom",
  marketing_consent: false,
};

export function AccountProfilePage() {
  const { supabase, user } = useSupabaseUser();
  const [form, setForm] = useState<ProfileForm>(EMPTY_PROFILE);
  const [original, setOriginal] = useState<ProfileForm>(EMPTY_PROFILE);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dobLocked, setDobLocked] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [verification, setVerification] = useState({ status: "unverified", verified_at: null as string | null, rejection_reason: null as string | null, required_reason: null as string | null });

  const reload = useCallback(async () => {
    if (!supabase || !user) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("email,full_name,phone,date_of_birth,address_line_1,address_line_2,town_city,county,postcode,country,marketing_consent,dob_locked_at,verification_status,verification_verified_at,verification_rejection_reason,verification_required_reason")
      .eq("id", user.id)
      .maybeSingle();
    if (error) {
      setMessage("Could not load your profile");
      return;
    }
    if (data) {
      setEmail(data.email || user.email || "");
      const next: ProfileForm = {
        full_name: data.full_name || "",
        phone: data.phone || "",
        date_of_birth: data.date_of_birth || "",
        address_line_1: data.address_line_1 || "",
        address_line_2: data.address_line_2 || "",
        town_city: data.town_city || "",
        county: data.county || "",
        postcode: data.postcode || "",
        country: data.country || "United Kingdom",
        marketing_consent: !!data.marketing_consent,
      };
      setForm(next);
      setOriginal(next);
      setDobLocked(Boolean(data.dob_locked_at) || Boolean(data.date_of_birth));
      setVerification({
        status: data.verification_status ?? "unverified",
        verified_at: data.verification_verified_at ?? null,
        rejection_reason: data.verification_rejection_reason ?? null,
        required_reason: data.verification_required_reason ?? null,
      });
    } else {
      setEmail(user.email || "");
    }
  }, [supabase, user]);

  useEffect(() => {
    if (!supabase || !user) return;
    let cancelled = false;
    (async () => {
      await reload();
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [reload, supabase, user]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !user) return;
    setMessage(null);
    if (!form.full_name.trim()) return setMessage("Please enter your full name");
    if (form.address_line_1.trim() && !form.postcode.trim()) return setMessage("Please enter a postcode for your address");
    if (form.phone.trim() && form.phone.replace(/\D/g, "").length < 7) return setMessage("Please enter a valid phone number");
    if (form.date_of_birth && isUnder18(form.date_of_birth)) return setMessage("You must be 18 or over");
    if (dobLocked && form.date_of_birth !== original.date_of_birth) return setMessage("Date of birth cannot be changed once set. Contact support.");
    if (verification.status === "verified") {
      const fields: (keyof ProfileForm)[] = ["full_name", "address_line_1", "address_line_2", "town_city", "county", "postcode", "country"];
      const willReset = fields.some((k) => (form[k] || "") !== (original[k] || ""));
      if (willReset && !window.confirm("Changing your name or address will remove your verified status until your documents are reviewed again. Continue?")) return;
    }
    setSaving(true);
    const payload = { full_name: form.full_name.trim(), phone: form.phone.trim() || null, date_of_birth: form.date_of_birth || null, address_line_1: form.address_line_1.trim() || null, address_line_2: form.address_line_2.trim() || null, town_city: form.town_city.trim() || null, county: form.county.trim() || null, postcode: form.postcode.trim() || null, country: form.country.trim() || "United Kingdom", marketing_consent: form.marketing_consent };
    const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);
    setSaving(false);
    if (error) return setMessage(error.message || "Could not save your profile");
    setMessage("Profile updated");
    await reload();
  }

  const update = (k: keyof ProfileForm, v: any) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <div className="space-y-6">
      <PageTitle icon={<UserCog className="h-5 w-5 text-primary" />} title="Profile details" body="Keep your details up to date so we can verify your account and contact you if you win." />
      {loading ? <p className="td-soft">Loading...</p> : <>
        <AccountVerificationPanel status={verification.status} verifiedAt={verification.verified_at} rejectionReason={verification.rejection_reason} requiredReason={verification.required_reason} onChanged={reload} />
        <form onSubmit={save} className="space-y-5">
          <Panel variant="glass" className="p-5 md:p-6"><div className="eyebrow mb-3">Personal details</div><div className="grid gap-4 sm:grid-cols-2"><Field label="Full name"><Input value={form.full_name} onChange={(e) => update("full_name", e.target.value)} required /></Field><Field label="Login email" hint="Email is read-only here. Use Login & security to request a change."><Input value={email} readOnly disabled /></Field><Field label="Date of birth" hint={dobLocked ? "Date of birth cannot be changed after it has been saved. Contact support if this is incorrect." : "You must be 18 or over to enter. This can only be set once."}><Input type="date" value={form.date_of_birth} onChange={(e) => update("date_of_birth", e.target.value)} readOnly={dobLocked} disabled={dobLocked} /></Field></div></Panel>
          <Panel variant="glass" className="account-panel border-primary/20 p-5 md:p-6"><div className="eyebrow mb-3">Contact and delivery details</div><p className="mb-4 max-w-2xl text-sm leading-relaxed td-soft">Add your phone number and address when you are ready. These details help speed up verification and prize claims.</p><div className="grid gap-4 sm:grid-cols-2"><Field label="Phone" hint="Optional until prize claim or account verification."><Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="07..." /></Field><div className="hidden sm:block" />{(["address_line_1", "address_line_2", "town_city", "county", "postcode", "country"] as const).map((k) => <Field key={k} label={k === "town_city" ? "Town / city" : k.replaceAll("_", " ")}><Input value={form[k] || ""} onChange={(e) => update(k, e.target.value)} /></Field>)}</div></Panel>
          <Panel variant="glass" className="p-5 md:p-6"><div className="eyebrow mb-3">Marketing preferences</div><label className="flex cursor-pointer items-start gap-3"><input type="checkbox" checked={form.marketing_consent} onChange={(e) => update("marketing_consent", e.target.checked)} className="mt-0.5 h-4 w-4 accent-primary" /><span className="text-sm td-muted">Email me occasional updates about new competitions, winners and free entry routes. You can opt out at any time.</span></label></Panel>
          {message ? <div className="rounded-lg border td-border bg-[color:var(--td-surface-muted)] px-3 py-2 text-sm td-muted">{message}</div> : null}
          <Button type="submit" disabled={saving} className="bg-primary font-bold uppercase tracking-wider hover:bg-primary/90">{saving ? "Saving..." : "Save changes"}</Button>
        </form>
      </>}
    </div>
  );
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
  return <div className="space-y-6"><PageTitle icon={<ShieldCheck className="h-5 w-5 text-primary" />} title="Login & security" body="Manage how you sign in to TopDraw. For your safety, password changes take effect immediately." /><Panel variant="glass" className="p-5 md:p-6"><div className="eyebrow mb-3">Account</div><dl className="grid gap-3 text-sm sm:grid-cols-2"><Info label="Login email" value={user?.email || "-"} /><Info label="Account created" value={createdAt ? fmtDate(createdAt) : "-"} /></dl><p className="mt-3 text-xs td-faint">Need to change your login email? Contact support.</p></Panel><Panel variant="glass" className="p-5 md:p-6"><div className="eyebrow mb-3">Change password</div><form onSubmit={updatePassword} className="max-w-md space-y-4"><Field label="New password"><Input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} minLength={8} required /></Field><Field label="Confirm new password"><Input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} minLength={8} required /></Field>{message ? <div className="text-sm td-muted">{message}</div> : null}<Button type="submit" disabled={saving} className="bg-primary font-bold uppercase tracking-wider hover:bg-primary/90">{saving ? "Updating..." : "Update password"}</Button></form></Panel><Panel variant="glass" className="p-5 md:p-6"><div className="eyebrow mb-2">Sign out</div><p className="mb-3 text-sm td-muted">Sign out of TopDraw on this device.</p><Button onClick={logout} variant="outline"><LogOut className="h-4 w-4" /> Sign out</Button></Panel></div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border td-border bg-[color:var(--td-surface-soft)] p-3"><dt className="text-[11px] font-bold uppercase tracking-wider td-faint">{label}</dt><dd className="mt-0.5 break-all td-text">{value}</dd></div>;
}

type VerificationDoc = { id: string; document_type: "proof_of_id" | "proof_of_address"; status: string; uploaded_at: string; original_filename: string | null };
const ALLOWED_MIMES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_BYTES = 10 * 1024 * 1024;

function extOf(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{1,5}$/.test(fromName)) return fromName;
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "application/pdf") return "pdf";
  return "bin";
}

function AccountVerificationPanel({ status, verifiedAt, rejectionReason, requiredReason, onChanged }: { status: string; verifiedAt: string | null; rejectionReason: string | null; requiredReason: string | null; onChanged?: () => void }) {
  const { supabase, user } = useSupabaseUser();
  const [docs, setDocs] = useState<VerificationDoc[]>([]);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [addrFile, setAddrFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadDocs = useCallback(async () => {
    if (!supabase || !user) return;
    const { data } = await supabase.from("account_verification_documents").select("id,document_type,status,uploaded_at,original_filename").eq("user_id", user.id).order("uploaded_at", { ascending: false });
    setDocs((data as VerificationDoc[]) ?? []);
  }, [supabase, user]);

  useEffect(() => { loadDocs(); }, [loadDocs, status]);

  const validate = (file: File | null, label: string) => {
    if (!file) { setMessage(`Please choose a ${label} file`); return false; }
    if (!ALLOWED_MIMES.includes(file.type)) { setMessage(`${label}: only JPG, PNG or PDF allowed`); return false; }
    if (file.size > MAX_BYTES) { setMessage(`${label}: must be 10MB or smaller`); return false; }
    return true;
  };

  const upload = async (file: File, kind: "proof_of_id" | "proof_of_address") => {
    if (!supabase || !user) return;
    const path = `${user.id}/${kind}/${crypto.randomUUID()}.${extOf(file)}`;
    const { error: upErr } = await supabase.storage.from("account-verification").upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) throw upErr;
    const { error: insErr } = await supabase.from("account_verification_documents").insert({ user_id: user.id, document_type: kind, storage_path: path, original_filename: file.name, mime_type: file.type, file_size_bytes: file.size, status: "uploaded" });
    if (insErr) throw insErr;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !user) return;
    setMessage(null);
    if (!validate(idFile, "proof of ID") || !validate(addrFile, "proof of address")) return;
    setBusy(true);
    try {
      await upload(idFile!, "proof_of_id");
      await upload(addrFile!, "proof_of_address");
      const { error } = await supabase.rpc("submit_account_verification");
      if (error) throw error;
      setMessage("Documents submitted for review");
      setIdFile(null);
      setAddrFile(null);
      await loadDocs();
      onChanged?.();
    } catch (error) {
      setMessage(friendlyError(error) || "Could not submit verification");
    } finally {
      setBusy(false);
    }
  };

  if (status === "verified") {
    return <Panel variant="glass" tone="primary" className="p-5"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 text-info" /><div className="flex-1"><div className="flex items-center gap-2"><div className="font-semibold td-text">Account verified</div><VerifiedBadge size="sm" /></div>{verifiedAt ? <div className="mt-1 text-xs td-soft">Verified on {fmtDate(verifiedAt)}</div> : null}<p className="mt-2 text-sm td-muted">Your identity and address have been confirmed. No further action is needed.</p></div></div></Panel>;
  }

  if (status === "pending") {
    const uploaded = docs.filter((d) => d.status === "uploaded");
    return <Panel variant="glass" className="p-5"><div className="flex items-start gap-3"><Loader2 className="mt-0.5 h-5 w-5 animate-spin text-info" /><div className="flex-1"><div className="font-semibold td-text">Verification under review</div><p className="mt-1 text-sm td-muted">An admin will review your documents shortly. We&apos;ll email you when it&apos;s done.</p>{uploaded.length > 0 ? <ul className="mt-3 space-y-1 text-sm td-muted">{uploaded.map((d) => <li key={d.id} className="flex items-center gap-2"><FileCheck2 className="h-4 w-4 text-info" />{d.document_type === "proof_of_id" ? "Proof of ID" : "Proof of address"}<span className="text-xs td-faint">· uploaded {fmtDate(d.uploaded_at)}</span></li>)}</ul> : null}</div></div></Panel>;
  }

  const isRejected = status === "rejected";
  return (
    <div className={`account-panel ${isRejected ? "" : "account-panel-blue"} relative overflow-hidden p-5 md:p-6`}>
      <div className="account-verification-glow pointer-events-none absolute inset-x-0 -top-20 h-40" />
      <div className="relative flex items-start gap-3">
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${isRejected ? "border-destructive/40 bg-destructive/15 text-destructive" : "border-primary/40 bg-primary/15 text-primary"}`}>{isRejected ? <ShieldAlert className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}</div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-bold tracking-tight td-text md:text-xl">{isRejected ? "Verification rejected" : "Prize claim verification"}</h3>
          {!isRejected ? <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary"><InfoIcon className="h-3 w-3" /> Verification is not required right now</div> : null}
          {isRejected && rejectionReason ? <div className="mt-2 text-sm text-destructive">Reason: {rejectionReason}</div> : null}
          {!isRejected && requiredReason ? <div className="mt-2 text-sm td-muted">{requiredReason}</div> : null}
          <div className="mt-3 space-y-2 text-sm leading-relaxed td-muted"><p>{isRejected ? "Re-upload clear copies of your photo ID and a recent proof of address. JPG, PNG or PDF, up to 10MB each." : "We only ask for verification documents if you win a prize or if we need to review your account. You do not need to upload these now."}</p>{!isRejected ? <p>If you win, we may ask for photo ID and proof of address before releasing the prize.</p> : null}</div>
          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">{([{ id: "id", label: "Proof of ID", file: idFile, set: setIdFile }, { id: "addr", label: "Proof of address", file: addrFile, set: setAddrFile }] as const).map((slot) => <div key={slot.id} className="rounded-xl border td-border bg-[color:var(--td-surface-soft)] p-3.5 transition hover:border-primary/40 focus-within:border-primary/60 focus-within:shadow-[0_0_0_3px_hsl(var(--primary)/0.18)]"><label className="text-[11px] font-bold uppercase tracking-wider td-soft">{slot.label}</label><input type="file" accept="image/jpeg,image/png,application/pdf" onChange={(e) => slot.set(e.target.files?.[0] ?? null)} className="mt-2 block w-full text-sm td-muted file:mr-3 file:rounded-md file:border-0 file:bg-primary/20 file:px-3 file:py-1.5 file:font-semibold file:text-[color:var(--td-text)] hover:file:bg-primary/30" />{slot.file ? <p className="mt-1.5 truncate text-[11px] td-soft">{slot.file.name}</p> : null}</div>)}</div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs td-soft">{idFile && addrFile ? "Documents are stored securely and only reviewed if verification is needed." : "Choose both files to submit for review."}</p><Button type="submit" disabled={busy || !idFile || !addrFile} className={`font-bold uppercase tracking-wider transition ${idFile && addrFile ? "btn-primary-glow text-white" : "cursor-not-allowed border td-border bg-[color:var(--td-surface-muted)] td-muted hover:bg-[color:var(--td-surface-muted)]"}`}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}{busy ? "Uploading..." : "Submit documents for review"}</Button></div>
            {message ? <div className="rounded-lg border td-border bg-[color:var(--td-surface-muted)] px-3 py-2 text-sm td-muted">{message}</div> : null}
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return <div className="space-y-1.5"><label className="text-xs font-bold uppercase tracking-wider td-soft">{label}</label>{children}{hint ? <p className="text-[11px] td-faint">{hint}</p> : null}</div>;
}

const CLAIM_ERR: Record<string, string> = {
  not_authenticated: "You need to be signed in.",
  not_authorized: "You can't claim this prize.",
  claim_already_submitted: "This claim has already been submitted.",
  full_name_required: "Full name is required.",
  phone_required: "Phone number is required.",
  address_line_1_required: "Address line 1 is required.",
  town_city_required: "Town/city is required.",
  postcode_required: "Postcode is required.",
  country_required: "Country is required.",
  invalid_prize_choice: "Invalid prize choice.",
  cash_alternative_not_available: "Cash alternative is not available for this prize.",
  winner_not_found: "Winner record not found.",
};

function ClaimPrizeDialog({ open, onOpenChange, winnerId, prizeTitle, cashAlternative, onSubmitted }: { open: boolean; onOpenChange: (open: boolean) => void; winnerId: string; prizeTitle: string; cashAlternative: number | null; onSubmitted: () => void }) {
  const { supabase, user } = useSupabaseUser();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({ full_name: "", phone: "", address_line_1: "", address_line_2: "", town_city: "", county: "", postcode: "", country: "United Kingdom" });
  const [choice, setChoice] = useState<"prize" | "cash_alternative">("prize");
  const hasCash = typeof cashAlternative === "number" && cashAlternative > 0;

  useEffect(() => {
    if (!open || !supabase || !user) return;
    setLoading(true);
    setMessage(null);
    supabase.from("profiles").select("full_name,phone,address_line_1,address_line_2,town_city,county,postcode,country").eq("id", user.id).maybeSingle().then(({ data }: any) => {
      if (data) {
        setForm((current) => ({
          full_name: data.full_name || current.full_name,
          phone: data.phone || current.phone,
          address_line_1: data.address_line_1 || current.address_line_1,
          address_line_2: data.address_line_2 || current.address_line_2,
          town_city: data.town_city || current.town_city,
          county: data.county || current.county,
          postcode: data.postcode || current.postcode,
          country: data.country || current.country,
        }));
      }
      setLoading(false);
    });
  }, [open, supabase, user]);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setSubmitting(true);
    setMessage(null);
    const { error } = await supabase.rpc("submit_prize_claim", {
      p_winner_id: winnerId,
      p_claim_full_name: form.full_name,
      p_claim_phone: form.phone,
      p_claim_address_line_1: form.address_line_1,
      p_claim_address_line_2: form.address_line_2,
      p_claim_town_city: form.town_city,
      p_claim_county: form.county,
      p_claim_postcode: form.postcode,
      p_claim_country: form.country,
      p_prize_choice: hasCash ? choice : "prize",
    });
    setSubmitting(false);
    if (error) {
      const code = (error.message || "").trim();
      setMessage(CLAIM_ERR[code] || friendlyError(error) || "Could not submit claim");
      return;
    }
    setMessage("Claim submitted");
    onSubmitted();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto border td-border bg-[color:var(--td-panel-raised-bg)] td-text shadow-[var(--shadow-deep)]">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-bold tracking-tight td-text">Claim your prize</DialogTitle>
          <DialogDescription className="td-muted">Confirm your delivery details for <span className="font-semibold td-text">{prizeTitle}</span>. We&apos;ll review and arrange delivery.</DialogDescription>
        </DialogHeader>
        {loading ? <p className="py-6 text-sm td-soft">Loading your details...</p> : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {hasCash ? <div className="space-y-2 rounded-xl border border-primary/30 bg-primary/10 p-3"><div className="text-[11px] font-bold uppercase tracking-wider text-primary">Choose your prize</div><label className="flex cursor-pointer items-start gap-2 text-sm td-text"><input type="radio" name="choice" checked={choice === "prize"} onChange={() => setChoice("prize")} className="mt-1" /><span>Receive the prize</span></label><label className="flex cursor-pointer items-start gap-2 text-sm td-text"><input type="radio" name="choice" checked={choice === "cash_alternative"} onChange={() => setChoice("cash_alternative")} className="mt-1" /><span>Take the cash alternative (£{Number(cashAlternative).toLocaleString()})</span></label></div> : null}
            <div className="grid gap-3 sm:grid-cols-2">{([{ k: "full_name", label: "Full name", full: false, max: 120, req: true }, { k: "phone", label: "Phone", full: false, max: 40, req: true }, { k: "address_line_1", label: "Address line 1", full: true, max: 200, req: true }, { k: "address_line_2", label: "Address line 2", full: true, max: 200, req: false }, { k: "town_city", label: "Town/city", full: false, max: 100, req: true }, { k: "county", label: "County", full: false, max: 100, req: false }, { k: "postcode", label: "Postcode", full: false, max: 20, req: true }, { k: "country", label: "Country", full: false, max: 80, req: true }] as const).map((field) => <div key={field.k} className={field.full ? "sm:col-span-2" : ""}><label className="text-[11px] font-bold uppercase tracking-wider td-soft">{field.label}</label><input className="account-input mt-1.5" value={form[field.k]} onChange={(e) => set(field.k, e.target.value)} required={field.req} maxLength={field.max} /></div>)}</div>
            {message ? <div className="rounded-lg border td-border bg-[color:var(--td-surface-muted)] px-3 py-2 text-sm td-muted">{message}</div> : null}
            <DialogFooter className="gap-2 pt-2">
              <button type="button" className="account-secondary-button" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</button>
              <Button type="submit" disabled={submitting} className="btn-primary-glow font-bold uppercase tracking-wider td-text">{submitting ? "Submitting..." : "Submit claim"}</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function AccountWinsPage() {
  const { supabase, user } = useSupabaseUser();
  const [rows, setRows] = useState<WinnerRow[] | null>(null);
  const [claimFor, setClaimFor] = useState<WinnerRow | null>(null);
  const select = "id,prize_title,winning_ticket_number,draw_date,proof_url,is_published,competition_id,display_name,display_location,image_url,entry_id,claim_status,claim_submitted_at,claim_verified_at,dispatched_at,delivered_at,prize_choice,delivery_courier,delivery_tracking_url,competition:competitions(title,slug,main_image_url,cash_alternative)";
  const load = useCallback(async () => {
    if (!supabase || !user) return;
    const { data: own } = await supabase.from("winners").select(select).eq("user_id", user.id).order("draw_date", { ascending: false });
    const map = new Map<string, WinnerRow>();
    for (const w of (own || []) as any[]) map.set(w.id, { ...w, competition: Array.isArray(w.competition) ? w.competition[0] : w.competition });
    const { data: entries } = await supabase.from("entries").select("id").eq("user_id", user.id).eq("is_winner", true);
    const entryIds = (entries || []).map((e: any) => e.id);
    if (entryIds.length) {
      const { data: extra } = await supabase.from("winners").select(select).in("entry_id", entryIds);
      for (const w of (extra || []) as any[]) if (!map.has(w.id)) map.set(w.id, { ...w, competition: Array.isArray(w.competition) ? w.competition[0] : w.competition });
    }
    setRows(Array.from(map.values()).sort((a, b) => new Date(b.draw_date).getTime() - new Date(a.draw_date).getTime()));
  }, [supabase, user]);
  useEffect(() => { load(); }, [load]);
  return <div><PageTitle title="My wins" />{rows === null ? <p className="td-soft">Loading...</p> : rows.length === 0 ? <EmptyState title="No wins yet" body="When you win, your prize and winning ticket will appear here. Good luck!" action={<Button asChild><Link href="/competitions">Browse competitions</Link></Button>} /> : <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{rows.map((w) => { const canClaim = w.claim_status === "unclaimed" || w.claim_status === "claim_started"; return <li key={w.id} className="flex flex-col overflow-hidden rounded-xl border td-border bg-[color:var(--td-surface)]"><SafePrizeImage url={w.competition?.main_image_url ?? w.image_url ?? null} alt={w.prize_title || "Prize"} aspect="aspect-square" width={560} height={560} /><div className="flex flex-1 flex-col p-4"><div className="flex items-center justify-between gap-2"><StatusBadge status={w.is_published ? "published" : "under_review"} /><span className="font-mono text-xs td-text">#{w.winning_ticket_number}</span></div><div className="mt-2 font-semibold td-text">{w.competition?.title || w.prize_title}</div><div className="mt-1 text-xs td-soft">Drawn {fmtDate(w.draw_date)}</div><div className="mt-3 flex flex-wrap items-center gap-2"><StatusBadge status={w.claim_status === "verified" ? "claim_verified" : w.claim_status || "unclaimed"} />{w.prize_choice ? <span className="rounded border td-border bg-[color:var(--td-surface-muted)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider td-muted">{w.prize_choice === "cash_alternative" ? "Cash alternative" : "Prize"}</span> : null}</div>{(w.claim_submitted_at || w.claim_verified_at || w.dispatched_at || w.delivered_at) ? <ul className="mt-3 space-y-0.5 text-xs td-soft">{w.claim_submitted_at ? <li>Claim submitted {fmtDate(w.claim_submitted_at)}</li> : null}{w.claim_verified_at ? <li>Verified {fmtDate(w.claim_verified_at)}</li> : null}{w.dispatched_at ? <li>Dispatched {fmtDate(w.dispatched_at)}{w.delivery_courier ? ` · ${w.delivery_courier}` : ""}</li> : null}{w.delivered_at ? <li>Delivered {fmtDate(w.delivered_at)}</li> : null}</ul> : null}{w.delivery_tracking_url ? <a href={w.delivery_tracking_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-primary">Track delivery</a> : null}{w.is_published && w.proof_url ? <a href={w.proof_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-primary">Draw proof</a> : null}<div className="mt-auto pt-3">{canClaim ? <Button size="sm" className="w-full" onClick={() => setClaimFor(w)}>Claim prize</Button> : w.claim_status === "claim_submitted" ? <p className="text-xs italic td-soft">We&apos;ve received your claim and will be in touch before arranging delivery.</p> : null}</div></div></li>; })}</ul>}{claimFor ? <ClaimPrizeDialog open={!!claimFor} onOpenChange={(open) => !open && setClaimFor(null)} winnerId={claimFor.id} prizeTitle={claimFor.competition?.title || claimFor.prize_title || "your prize"} cashAlternative={claimFor.competition?.cash_alternative ?? null} onSubmitted={load} /> : null}</div>;
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
  return <div><PageTitle icon={<LifeBuoy className="h-5 w-5 text-primary" />} title="Responsible play" body="TopDraw is for UK residents aged 18 or over. If you need a break from entering competitions, you can use self-exclusion to stop yourself from entering for a selected period." /><Panel variant="glass" tone={active ? "warning" : "default"} className="mb-6 p-5"><div className="flex gap-3"><ShieldAlert className={`mt-0.5 h-5 w-5 ${active ? "text-warning" : "td-faint"}`} /><div><div className="eyebrow mb-1">Status</div>{loading ? <p className="text-sm td-soft">Loading...</p> : active ? <p className="td-text">{active.ends_at ? <>You are self-excluded until <span className="font-semibold">{new Date(active.ends_at).toLocaleString()}</span>.</> : "You are self-excluded indefinitely."}</p> : <p className="td-muted">You do not currently have an active self-exclusion.</p>}{active ? <p className="mt-2 text-xs td-soft">You cannot enter competitions during this period. This cannot be shortened or removed from your account.</p> : null}</div></div></Panel>{!active && !loading ? <Panel variant="glass" className="mb-6 p-5"><h2 className="mb-1 text-lg font-semibold td-text">Start a self-exclusion</h2><p className="mb-4 text-sm td-soft">Choose how long you want to be excluded from entering.</p><div className="mb-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{options.map((o) => <button key={o.value} type="button" onClick={() => setDuration(o.value)} className={`rounded-lg border p-3 text-left transition ${duration === o.value ? "border-primary/60 bg-primary/15 shadow-glow-soft" : "td-border bg-[color:var(--td-surface-soft)] hover:bg-[color:var(--td-surface-muted)]"}`}><div className="text-sm font-semibold td-text">{o.label}</div><div className="mt-0.5 text-[11px] td-soft">{o.sub}</div></button>)}</div><label className="mb-1 block text-xs font-bold uppercase tracking-wider td-soft">Reason (optional)</label><textarea value={reason} onChange={(e) => setReason(e.target.value.slice(0, 500))} rows={3} className="mb-4 w-full rounded-md border td-border bg-[color:var(--td-surface-muted)] p-3 td-text" /><label className="mb-4 flex cursor-pointer items-start gap-2"><input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5 h-4 w-4 accent-primary" /><span className="text-sm td-muted">I understand I will not be able to enter competitions during this period.</span></label><Button disabled={!duration || !confirmed || submitting} onClick={submit} className="bg-primary font-bold uppercase tracking-wider hover:bg-primary/90">{submitting ? "Starting..." : "Start self-exclusion"}</Button></Panel> : null}{message ? <div className="mb-4 rounded-lg border td-border bg-[color:var(--td-surface-muted)] p-3 text-sm td-muted">{message}</div> : null}<Panel variant="outline" className="p-5"><h3 className="mb-1 font-semibold td-text">Need support?</h3><p className="text-sm td-muted">If you feel you need support with controlling your play, consider speaking to a trusted person or contacting a support organisation. You can also read our <Link href="/responsible-play" className="text-primary hover:underline">responsible play guidance</Link>.</p></Panel></div>;
}

export function AccountTransactionsPage() {
  const { supabase, user } = useSupabaseUser();
  const [wallet, setWallet] = useState<Txn[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { if (!supabase || !user) return; (async () => { const [{ data: w }, { data: p }] = await Promise.all([supabase.from("wallet_transactions").select("id,delta,balance_after,kind,note,created_at,expires_at,reference_type,reference_id").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100), supabase.from("payments").select("id,created_at,amount,status,refund_status,refunded_amount,wallet_amount_used,discount_amount,is_multiline").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100)]); setWallet(w ?? []); setPayments(p ?? []); setLoading(false); })(); }, [supabase, user]);
  return <div><PageTitle title="Transactions" body="Track wallet credit, refunds, adjustments and payment activity on your TopDraw account." />{loading ? <p className="td-soft">Loading...</p> : <div className="space-y-2">{wallet.map((t) => <WalletTxnRow key={t.id} txn={t} />)}{payments.map((p) => <Panel key={p.id} variant="glass" className="p-3 md:p-4"><div className="flex items-start gap-3"><div className="mt-0.5 grid h-9 w-9 place-items-center rounded-lg bg-[color:var(--td-surface-muted)] text-primary"><ShoppingBag className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-[11px] font-bold uppercase tracking-wider td-soft">Order</span><span className="font-mono-num text-sm td-text">#{shortId(p.id)}</span><StatusBadge status={paymentStatus(p).status} /></div><div className="mt-0.5 text-[11px] td-soft">{new Date(p.created_at).toLocaleString()}</div></div><div className="shrink-0 text-right"><div className="font-mono-num font-bold td-text">{formatMoney(Number(p.amount || 0))}</div><Link href="/account/orders" className="text-[11px] text-primary hover:text-[color:var(--td-text)]">View order</Link></div></div></Panel>)}</div>}</div>;
}
