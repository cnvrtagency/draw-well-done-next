"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  BadgeCheck,
  Mail,
  RefreshCw,
  ShieldCheck,
  Ticket,
  XCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompetitionCard } from "@/components/CompetitionCard";
import { Panel } from "@/components/Panel";
import { useAuth } from "@/hooks/useAuth";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { requestKlaviyoSubscribe } from "@/lib/klaviyoSubscribe";
import { formatMoney } from "@/lib/format";
import type { Competition } from "@/types/db";

type PaymentRow = {
  id: string;
  status: string;
  is_multiline: boolean | null;
  amount: number;
  quantity: number | null;
  competition_id: string | null;
  wallet_amount_used: number | null;
  payment_failure_reason: string | null;
  created_at: string;
  updated_at: string;
  subtotal_amount: number | null;
  discount_amount: number | null;
  discount_percentage: number | null;
  competition: { id: string; title: string; slug: string; draw_at: string | null; main_image_url: string | null } | null;
};

type LineRow = {
  payment_id: string;
  competition_id: string;
  quantity: number;
  line_total: number | null;
  allocated: boolean | null;
  competition: { id: string; title: string; slug: string; draw_at: string | null } | null;
};

type EntryRow = {
  payment_id: string | null;
  competition_id: string | null;
  ticket_number: number;
  status: string;
  competition: { id: string; title: string; slug: string } | null;
};

type GroupedComp = {
  competition_id: string;
  title: string;
  slug: string | null;
  expected: number;
  tickets: number[];
};

const TERMINAL_BAD = new Set(["allocation_failed", "failed", "cancelled"]);
const POLL_BUDGET_MS = 60_000;
const POLL_INTERVAL_MS = 1000;

function unwrapOne<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

function Confetti() {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {Array.from({ length: 22 }).map((_, i) => (
        <span
          key={i}
          className="absolute top-[-20px] h-2.5 w-1.5 animate-[confetti-fall_2.8s_ease-in_forwards] rounded-sm bg-primary"
          style={{
            left: `${(i * 37) % 100}%`,
            animationDelay: `${(i % 8) * 110}ms`,
            transform: `rotate(${i * 23}deg)`,
          }}
        />
      ))}
    </div>
  );
}

function StatTile({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-xl border td-border bg-[color:var(--td-surface-soft)] p-4 shadow-[inset_0_1px_0_hsl(0_0%_100%/0.07)]">
      <div className="mb-2 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.16em] td-soft">
        {icon ? <span className="text-primary">{icon}</span> : null}
        {label}
      </div>
      <div className="font-mono-num text-xl font-black td-text">{value}</div>
      {hint ? <div className="mt-1 text-xs td-soft">{hint}</div> : null}
    </div>
  );
}

export function CheckoutSuccessClient() {
  const params = useSearchParams();
  const paymentId = params.get("payment_id");
  const supabase = createSupabaseBrowserClient();
  const { user } = useAuth();
  const [payment, setPayment] = useState<PaymentRow | null>(null);
  const [lines, setLines] = useState<LineRow[] | null>(null);
  const [entries, setEntries] = useState<EntryRow[] | null>(null);
  const [tries, setTries] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [recs, setRecs] = useState<Competition[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const startedAtRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!supabase || !paymentId || !user) return;
    let cancelled = false;
    (async () => {
      const errs: string[] = [];
      const { data: p, error: pErr } = await supabase
        .from("payments")
        .select(
          "id,status,is_multiline,amount,quantity,competition_id,wallet_amount_used,payment_failure_reason,created_at,updated_at,subtotal_amount,discount_amount,discount_percentage,competition:competitions!payments_competition_id_fkey(id,title,slug,draw_at,main_image_url)",
        )
        .eq("id", paymentId)
        .maybeSingle();
      if (cancelled) return;
      if (pErr) errs.push(`payment: ${pErr.message}`);
      const norm = p ? ({ ...(p as any), competition: unwrapOne((p as any).competition) } as PaymentRow) : null;
      setPayment(norm);

      if (norm?.is_multiline) {
        const { data: ls, error: lErr } = await supabase
          .from("payment_lines")
          .select("payment_id,competition_id,quantity,line_total,allocated,competition:competitions!payment_lines_competition_id_fkey(id,title,slug,draw_at)")
          .eq("payment_id", paymentId);
        if (!cancelled) {
          if (lErr) errs.push(`order lines: ${lErr.message}`);
          setLines(((ls ?? []) as any[]).map((l) => ({ ...l, competition: unwrapOne(l.competition) })) as LineRow[]);
        }
      } else if (!cancelled) {
        setLines([]);
      }

      if (norm) {
        const { data: e, error: eErr } = await supabase
          .from("entries")
          .select("payment_id,competition_id,ticket_number,status,competition:competitions!entries_competition_id_fkey(id,title,slug)")
          .eq("payment_id", paymentId)
          .order("ticket_number");
        if (!cancelled) {
          if (eErr) errs.push(`entries: ${eErr.message}`);
          setEntries(((e ?? []) as any[]).map((x) => ({ ...x, competition: unwrapOne(x.competition) })) as EntryRow[]);
        }
      }
      if (!cancelled) setLoadError(errs.length ? errs.join(" • ") : null);
    })();
    return () => {
      cancelled = true;
    };
  }, [paymentId, supabase, tries, user]);

  useEffect(() => {
    if (!paymentId || !payment) return;
    if (Date.now() - startedAtRef.current > POLL_BUDGET_MS) {
      setTimedOut(true);
      return;
    }
    if (TERMINAL_BAD.has(payment.status)) return;
    const allocated = (entries?.length ?? 0) > 0;
    if (payment.status === "succeeded" && allocated) {
      const expected = payment.is_multiline
        ? (lines ?? []).reduce((s, l) => s + (l.quantity || 0), 0)
        : (payment.quantity ?? 0);
      if (expected === 0 || (entries?.length ?? 0) >= expected) return;
    }
    const t = window.setTimeout(() => setTries((n) => n + 1), POLL_INTERVAL_MS);
    return () => window.clearTimeout(t);
  }, [entries, lines, payment, paymentId, tries]);

  useEffect(() => {
    if (!supabase) return;
    (async () => {
      const { data } = await supabase
        .from("competitions")
        .select("*")
        .eq("status", "live")
        .is("archived_at", null)
        .order("closes_at", { ascending: true })
        .limit(8);
      const exclude = new Set<string>();
      if (payment?.competition_id) exclude.add(payment.competition_id);
      lines?.forEach((l) => exclude.add(l.competition_id));
      setRecs(((data ?? []) as Competition[]).filter((c) => !exclude.has(c.id)).slice(0, 4));
    })();
  }, [lines, payment?.competition_id, supabase]);

  const isMultiline = !!payment?.is_multiline;
  const totalEntries = isMultiline
    ? (lines ?? []).reduce((s, l) => s + (l.quantity || 0), 0)
    : payment?.quantity ?? 0;

  const grouped = useMemo<GroupedComp[]>(() => {
    const map = new Map<string, GroupedComp>();
    if (isMultiline) {
      for (const l of lines ?? []) {
        map.set(l.competition_id, {
          competition_id: l.competition_id,
          title: l.competition?.title ?? "Competition",
          slug: l.competition?.slug ?? null,
          expected: l.quantity || 0,
          tickets: [],
        });
      }
    } else if (payment?.competition_id) {
      map.set(payment.competition_id, {
        competition_id: payment.competition_id,
        title: payment.competition?.title ?? "Competition",
        slug: payment.competition?.slug ?? null,
        expected: payment.quantity ?? 0,
        tickets: [],
      });
    }
    for (const e of entries ?? []) {
      const key = e.competition_id ?? "_";
      let g = map.get(key);
      if (!g) {
        g = {
          competition_id: key,
          title: e.competition?.title ?? "Competition",
          slug: e.competition?.slug ?? null,
          expected: 0,
          tickets: [],
        };
        map.set(key, g);
      }
      g.tickets.push(e.ticket_number);
    }
    return Array.from(map.values());
  }, [entries, isMultiline, lines, payment]);

  const allocatedCount = entries?.length ?? 0;
  const fullyAllocated = allocatedCount > 0 && (totalEntries === 0 || allocatedCount >= totalEntries);
  const status = payment?.status ?? "pending";
  const showHappy = status === "succeeded" && fullyAllocated;
  const klaviyoFiredRef = useRef(false);

  useEffect(() => {
    if (klaviyoFiredRef.current || !paymentId || status !== "succeeded") return;
    const guardKey = `topdraw_kl_fired_${paymentId}`;
    try {
      if (sessionStorage.getItem(guardKey)) {
        klaviyoFiredRef.current = true;
        return;
      }
    } catch {}

    let choice: { opt_in: boolean; email: string; competition_id: string | null; competition_title: string | null } | null = null;
    try {
      const raw = sessionStorage.getItem("topdraw_marketing_opt_in");
      if (raw) choice = JSON.parse(raw);
    } catch {}

    const email = (choice?.email || user?.email || "").trim().toLowerCase();
    if (!email) return;
    const firstGroup = grouped[0];
    const competition_id = choice?.competition_id ?? firstGroup?.competition_id ?? payment?.competition_id ?? null;
    const competition_title = choice?.competition_title ?? firstGroup?.title ?? payment?.competition?.title ?? null;
    const optIn = choice?.opt_in !== false;

    klaviyoFiredRef.current = true;
    try {
      sessionStorage.setItem(guardKey, "1");
    } catch {}
    requestKlaviyoSubscribe({
      email,
      source: "checkout",
      consent_source: optIn ? "checkout_soft_opt_in" : "checkout_opt_out",
      consent_status: optIn ? "granted" : "declined",
      consent_type: optIn ? "soft_opt_in" : "opt_out",
      competition_id,
      competition_title,
      user_id: user?.id ?? null,
      properties: { topdraw_customer: true },
    });
    try {
      sessionStorage.removeItem("topdraw_marketing_opt_in");
    } catch {}
  }, [grouped, payment, paymentId, status, user]);

  function refreshNow() {
    setRefreshing(true);
    startedAtRef.current = Date.now();
    setTimedOut(false);
    setTries((n) => n + 1);
    window.setTimeout(() => setRefreshing(false), 600);
  }

  return (
    <main className="container relative mx-auto py-8 md:py-12">
      {showHappy ? <Confetti /> : null}
      <div className="td-auth-page-glow pointer-events-none absolute inset-x-0 top-0 -z-0 h-[420px] opacity-90" />

      <Panel variant="raised" as="section" className="td-marketing-panel relative overflow-hidden p-6 text-center md:p-10">
        <div className="relative">
          <HeaderBlock status={status} fullyAllocated={fullyAllocated} />

          {!isMultiline && payment?.competition ? (
            <p className="mt-5 text-base">
              <Link href={`/competitions/${payment.competition.slug}`} className="font-semibold text-primary underline-offset-4 hover:underline">
                {payment.competition.title}
              </Link>
            </p>
          ) : null}

          <div className="mx-auto mt-6 grid max-w-2xl gap-3 text-left sm:grid-cols-3">
            <StatTile label="Total entries" value={totalEntries || "-"} icon={<Ticket className="h-4 w-4" />} />
            <StatTile
              label="Amount paid"
              value={payment ? formatMoney(payment.amount) : "-"}
              hint={
                payment?.wallet_amount_used && Number(payment.wallet_amount_used) > 0
                  ? `Wallet credit ${formatMoney(Number(payment.wallet_amount_used))}`
                  : payment?.discount_amount && Number(payment.discount_amount) > 0
                    ? `Saved ${formatMoney(Number(payment.discount_amount))}`
                    : undefined
              }
            />
            <StatTile
              label={isMultiline ? "Competitions" : "Draw date"}
              value={
                isMultiline
                  ? (lines?.length ?? 0) || "-"
                  : payment?.competition?.draw_at
                    ? new Date(payment.competition.draw_at).toLocaleDateString()
                    : "TBC"
              }
            />
          </div>

          <div className="mx-auto mt-6 max-w-2xl text-left">
            <StatusPanel
              paymentId={paymentId}
              status={status}
              fullyAllocated={fullyAllocated}
              allocatedCount={allocatedCount}
              totalEntries={totalEntries}
              failureReason={payment?.payment_failure_reason ?? null}
              grouped={grouped}
              refreshing={refreshing}
              onRefresh={refreshNow}
              loadError={loadError}
              timedOut={timedOut}
              isMultiline={isMultiline}
              linesLoaded={lines !== null}
              linesCount={lines?.length ?? 0}
            />
          </div>

          <p className="mx-auto mt-5 max-w-xl text-xs td-soft">
            Winners are reviewed before publication. You can always find your ticket numbers in your account.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-primary font-extrabold uppercase tracking-wider shadow-glow-soft hover:bg-primary/90">
              <Link href="/account/entries">My Entries</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="td-border bg-transparent td-text hover:bg-[color:var(--td-surface-hover)] hover:text-[color:var(--td-text)]">
              <Link href="/competitions">Browse more competitions</Link>
            </Button>
          </div>
        </div>
      </Panel>

      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: <Ticket className="h-5 w-5" />, t: "Tickets saved", b: "Find your tickets in your account anytime." },
          { icon: <Mail className="h-5 w-5" />, t: "Free postal entry", b: "A no-purchase entry route is always available." },
          { icon: <ShieldCheck className="h-5 w-5" />, t: "Reviewed winners", b: "Winners are published after a verification step." },
          { icon: <BadgeCheck className="h-5 w-5" />, t: "18+ only", b: "UK prize competitions, played responsibly." },
        ].map((r) => (
          <Panel key={r.t} variant="glass" className="p-4">
            <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-md bg-[color:var(--td-surface-muted)] text-primary">{r.icon}</div>
            <div className="text-sm font-semibold td-text">{r.t}</div>
            <div className="mt-1 text-xs td-muted">{r.b}</div>
          </Panel>
        ))}
      </section>

      {recs.length > 0 ? (
        <section className="mt-10">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <div className="eyebrow mb-2">More live competitions</div>
              <h2 className="font-display text-2xl font-bold td-text md:text-3xl">Fancy another shot?</h2>
              <p className="mt-1 text-sm td-muted">Your entries are confirmed. Here are a few more competitions ending soon.</p>
            </div>
            <Link href="/competitions" className="hidden text-xs font-bold uppercase tracking-wider text-primary hover:text-[color:var(--td-text)] sm:inline">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {recs.map((c) => (
              <CompetitionCard key={c.id} c={c} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

function HeaderBlock({ status, fullyAllocated }: { status: string; fullyAllocated: boolean }) {
  if (status === "succeeded" && fullyAllocated) {
    return (
      <>
        <div className="mx-auto mb-3 inline-flex h-16 w-16 items-center justify-center rounded-full bg-success/20 text-success ring-4 ring-success/15 animate-glow-pulse">
          <BadgeCheck className="h-9 w-9" />
        </div>
        <div className="eyebrow mb-1">Entries confirmed</div>
        <h1 className="font-display text-4xl font-bold tracking-tight td-text md:text-6xl">You&apos;re in.</h1>
        <p className="mt-3 text-lg td-muted">Good luck, your tickets have been allocated.</p>
      </>
    );
  }
  if (status === "allocation_failed") {
    return (
      <FailureHeader eyebrow="Allocation needs review" title="Payment received" body="We could not automatically allocate your ticket numbers." />
    );
  }
  if (status === "failed") {
    return <FailureHeader eyebrow="Payment failed" title="We couldn't take payment" body="No tickets were allocated. You have not been charged." />;
  }
  if (status === "cancelled") {
    return <FailureHeader eyebrow="Checkout cancelled" title="No entries placed" body="You cancelled before payment was completed." muted />;
  }
  const finalising = status === "pending";
  return (
    <>
      <div className="mx-auto mb-3 inline-flex h-16 w-16 items-center justify-center rounded-full bg-info/20 text-info ring-4 ring-info/15">
        <Loader2 className="h-9 w-9 animate-spin" />
      </div>
      <div className="eyebrow mb-1">{finalising ? "Finalising payment" : "Allocating tickets"}</div>
      <h1 className="font-display text-3xl font-bold tracking-tight td-text md:text-5xl">
        {finalising ? "Almost there…" : "Assigning your numbers…"}
      </h1>
      <p className="mt-3 text-base td-muted">
        {finalising
          ? "Your payment is being confirmed. This usually only takes a few seconds."
          : "Your payment is confirmed. We're assigning your ticket numbers now."}
      </p>
    </>
  );
}

function FailureHeader({ eyebrow, title, body, muted }: { eyebrow: string; title: string; body: string; muted?: boolean }) {
  return (
    <>
      <div className={`mx-auto mb-3 inline-flex h-16 w-16 items-center justify-center rounded-full ring-4 ${muted ? "bg-[color:var(--td-surface-hover)] td-muted ring-[color:var(--td-border-muted)]" : "bg-destructive/20 text-destructive ring-destructive/15"}`}>
        {muted ? <XCircle className="h-9 w-9" /> : <AlertTriangle className="h-9 w-9" />}
      </div>
      <div className={`eyebrow mb-1 ${muted ? "td-soft" : "text-destructive"}`}>{eyebrow}</div>
      <h1 className="font-display text-3xl font-bold tracking-tight td-text md:text-5xl">{title}</h1>
      <p className="mt-3 text-base td-muted">{body}</p>
    </>
  );
}

function TicketPills({ tickets, max = 200 }: { tickets: number[]; max?: number }) {
  const sorted = [...tickets].sort((a, b) => a - b);
  const shown = sorted.slice(0, max);
  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((n) => (
        <span key={n} className="font-mono-num rounded-md border td-border bg-[color:var(--td-surface-muted)] px-2 py-1 text-xs font-bold td-text">
          #{String(n).padStart(5, "0")}
        </span>
      ))}
      {sorted.length > max ? <span className="font-mono-num px-2 py-1 text-xs td-soft">+{sorted.length - max} more</span> : null}
    </div>
  );
}

function StatusPanel(props: {
  paymentId: string | null;
  status: string;
  fullyAllocated: boolean;
  allocatedCount: number;
  totalEntries: number;
  failureReason: string | null;
  grouped: GroupedComp[];
  refreshing: boolean;
  onRefresh: () => void;
  loadError: string | null;
  timedOut: boolean;
  isMultiline: boolean;
  linesLoaded: boolean;
  linesCount: number;
}) {
  const { paymentId, status, fullyAllocated, allocatedCount, totalEntries, failureReason, grouped, refreshing, onRefresh, loadError, timedOut, isMultiline, linesLoaded, linesCount } = props;

  if (!paymentId) return <p className="text-sm td-muted">Payment confirmed. View your entries from your account.</p>;

  if (loadError) {
    return (
      <Panel variant="glass" tone="warning" className="space-y-2 p-4">
        <div className="eyebrow text-destructive">Couldn&apos;t load your ticket numbers</div>
        <p className="text-sm td-muted">We hit an error reading your order. Your payment reference is <span className="font-mono td-text">{paymentId}</span>.</p>
        <p className="break-all font-mono text-xs td-soft">{loadError}</p>
        <RefreshButton refreshing={refreshing} onRefresh={onRefresh} />
      </Panel>
    );
  }

  if (status === "allocation_failed") {
    return (
      <Panel variant="glass" tone="warning" className="space-y-2 p-4">
        <div className="eyebrow text-destructive">Payment received, allocation needs review</div>
        <p className="text-sm td-muted">Your payment was received, but we could not automatically allocate your ticket numbers. Please contact support with reference <span className="font-mono td-text">{paymentId}</span>.</p>
        {failureReason ? <p className="text-xs td-soft">Reason: <span className="font-mono">{failureReason}</span></p> : null}
      </Panel>
    );
  }

  if (status === "failed") {
    return <SimpleStatus title="Payment failed" body="No tickets were allocated and you have not been charged." failureReason={failureReason} />;
  }

  if (status === "cancelled") {
    return <SimpleStatus title="Checkout cancelled" body="No tickets were placed. You can return to your basket and try again." />;
  }

  if (status === "pending") {
    return (
      <Panel variant="glass" tone="info" className="flex items-center justify-between gap-3 p-4">
        <div className="text-sm td-muted">
          <div className="font-semibold td-text">Finalising payment…</div>
          Your payment is being confirmed. This usually only takes a few seconds.
        </div>
        <RefreshButton refreshing={refreshing} onRefresh={onRefresh} />
      </Panel>
    );
  }

  if (isMultiline && linesLoaded && linesCount === 0) {
    return (
      <Panel variant="glass" tone="warning" className="space-y-2 p-4">
        <div className="eyebrow text-destructive">Order lines unavailable</div>
        <p className="text-sm td-muted">Your payment succeeded but we couldn&apos;t load the items in your order. Your reference is <span className="font-mono td-text">{paymentId}</span>. Please contact support if your tickets don&apos;t appear in your account shortly.</p>
        <RefreshButton refreshing={refreshing} onRefresh={onRefresh} />
      </Panel>
    );
  }

  if (!fullyAllocated && timedOut) {
    return (
      <Panel variant="glass" tone="warning" className="space-y-3 p-4">
        <div className="eyebrow text-warning">Taking longer than expected</div>
        <p className="text-sm td-muted">Your payment succeeded, but ticket allocation is taking longer than usual. Your reference is <span className="font-mono td-text">{paymentId}</span>. Tap refresh in a moment, or check <Link href="/account/entries" className="text-primary hover:underline">My Entries</Link>. If nothing appears within a few minutes, please contact support.</p>
        {totalEntries > 0 ? <p className="text-xs td-soft">{allocatedCount} of {totalEntries} tickets allocated so far.</p> : null}
        <RefreshButton refreshing={refreshing} onRefresh={onRefresh} />
        <PartialGroups grouped={grouped} />
      </Panel>
    );
  }

  if (!fullyAllocated) {
    return (
      <Panel variant="glass" tone="info" className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm td-muted">
            <div className="font-semibold td-text">Allocating your tickets…</div>
            Your payment is confirmed. We&apos;re assigning your ticket numbers now{totalEntries > 0 ? <> ({allocatedCount} of {totalEntries} so far)</> : null}.
          </div>
          <RefreshButton refreshing={refreshing} onRefresh={onRefresh} />
        </div>
        <PartialGroups grouped={grouped} />
      </Panel>
    );
  }

  return (
    <Panel variant="glass" tone="success" className="space-y-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="eyebrow text-success">Your ticket numbers</div>
        <Button size="sm" variant="ghost" onClick={onRefresh} disabled={refreshing} className="h-7 text-xs td-soft">
          <RefreshCw className={`mr-1 h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>
      <div className="space-y-3">
        {grouped.map((g) => <GroupBlock key={g.competition_id} g={g} />)}
      </div>
    </Panel>
  );
}

function SimpleStatus({ title, body, failureReason }: { title: string; body: string; failureReason?: string | null }) {
  return (
    <Panel variant="glass" tone="warning" className="space-y-2 p-4">
      <div className="eyebrow text-destructive">{title}</div>
      <p className="text-sm td-muted">{body}</p>
      {failureReason ? <p className="text-xs td-soft">Reason: <span className="font-mono">{failureReason}</span></p> : null}
    </Panel>
  );
}

function RefreshButton({ refreshing, onRefresh }: { refreshing: boolean; onRefresh: () => void }) {
  return (
    <Button size="sm" variant="outline" onClick={onRefresh} disabled={refreshing} className="td-border bg-transparent td-text hover:bg-[color:var(--td-surface-hover)] hover:text-[color:var(--td-text)]">
      <RefreshCw className={`mr-1 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh now
    </Button>
  );
}

function PartialGroups({ grouped }: { grouped: GroupedComp[] }) {
  const groups = grouped.filter((g) => g.tickets.length > 0);
  if (groups.length === 0) return null;
  return (
    <div className="space-y-3">
      {groups.map((g) => <GroupBlock key={g.competition_id} g={g} />)}
    </div>
  );
}

function GroupBlock({ g }: { g: GroupedComp }) {
  return (
    <div className="rounded-lg border td-border bg-[color:var(--td-surface-soft)] p-3">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <div className="text-sm font-semibold td-text">
          {g.slug ? <Link href={`/competitions/${g.slug}`} className="text-primary hover:underline">{g.title}</Link> : g.title}
        </div>
        <div className="text-xs td-soft">
          {g.tickets.length}
          {g.expected > 0 && g.tickets.length < g.expected ? ` / ${g.expected}` : ""} {g.tickets.length === 1 ? "entry" : "entries"}
        </div>
      </div>
      {g.tickets.length > 0 ? <TicketPills tickets={g.tickets} /> : <div className="text-xs td-soft">Tickets being assigned…</div>}
    </div>
  );
}
