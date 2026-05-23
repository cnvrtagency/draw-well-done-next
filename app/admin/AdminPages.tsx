"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Award, BookOpen, CreditCard, FileText, Gavel, Image as ImageIcon, Library, LifeBuoy, Mail, Megaphone, Search, Send, Star, Tag, Trophy, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { StatTile } from "@/components/ui/StatTile";
import { formatMoney } from "@/lib/format";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { AdminPageHeader, AdminPanel, AdminTable, AdminTD, AdminTH, AdminTR, IncompleteNotice } from "@/components/admin/AdminKit";

type Row = Record<string, any>;

function fmtDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "-";
}

function fmtDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "-";
}

function shortId(id?: string | null) {
  return id ? id.slice(0, 8).toUpperCase() : "-";
}

function useRows(table: string, select: string, order = "created_at", ascending = false, limit = 100) {
  const supabase = createSupabaseBrowserClient();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    let query = supabase.from(table as any).select(select).limit(limit);
    if (order) query = query.order(order, { ascending });
    const { data, error: nextError } = await query;
    setRows((data as Row[]) ?? []);
    setError(nextError?.message ?? null);
    setLoading(false);
  }, [ascending, limit, order, select, supabase, table]);

  useEffect(() => { load(); }, [load]);
  return { rows, loading, error, reload: load, supabase };
}

function LoadingOrError({ loading, error }: { loading: boolean; error: string | null }) {
  if (loading) return <p className="text-sm text-white/60">Loading...</p>;
  if (error) return <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">{error}</div>;
  return null;
}

function EmptyRows({ rows, label }: { rows: Row[]; label: string }) {
  return rows.length === 0 ? <p className="rounded-xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/60">No {label} found.</p> : null;
}

export function AdminRoute({ path }: { path?: string[] }) {
  const key = (path ?? []).join("/");
  if (!key) return <AdminDashboardPage />;
  if (key === "competitions") return <CompetitionsPage />;
  if (key === "competitions/new") return <CompetitionFormShell mode="new" />;
  if (key.startsWith("competitions/")) return <CompetitionFormShell mode="edit" id={path?.[1]} />;
  if (key === "hero-banners") return <HeroBannersPage />;
  if (key === "customers" || key === "users") return <CustomersPage />;
  if (key === "entries") return <EntriesPage />;
  if (key === "orders") return <PaymentsPage title="Orders" />;
  if (key === "payments") return <PaymentsPage title="Payments" />;
  if (key === "draws") return <DrawsPage />;
  if (key === "winners") return <WinnersPage />;
  if (key === "reviews") return <ReviewsPage />;
  if (key === "discount-codes") return <DiscountCodesPage />;
  if (key === "wallet-settings") return <WalletSettingsPage />;
  if (key === "postal-entries") return <PostalEntriesPage />;
  if (key === "emails") return <EmailsPage />;
  if (key === "faqs") return <FaqsPage />;
  if (key === "guides") return <GuidesPage />;
  if (key === "guides/new") return <GuideFormShell mode="new" />;
  if (key.startsWith("guides/")) return <GuideFormShell mode="edit" id={path?.[1]} />;
  if (key === "content-library" || key === "content") return <ContentLibraryPage />;
  if (key === "seo-centre" || key === "seo") return <SeoCentrePage />;
  if (key === "dynamic-content") return <DynamicContentPage />;
  if (key === "page-content") return <PageContentPage />;
  if (key === "notifications") return <NotificationsPage />;
  if (key === "profit-calculator") return <IncompleteAdminPage title="Profit Calculator" body="The Vite profit calculator is advisory-only and has not been ported into Next yet." />;
  return <IncompleteAdminPage title="Admin" body={`No Next.js admin route is mapped for /admin/${key}.`} />;
}

function AdminDashboardPage() {
  const supabase = createSupabaseBrowserClient();
  const [stats, setStats] = useState({ live: 0, entries: 0, revenue: 0, postal: 0, awaitingDraw: 0, awaitingPublish: 0, activeDraw: 0 });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    async function load() {
      const [liveComps, entries, revenue, postal, awaitingDraw, awaitingPublish] = await Promise.all([
        supabase.from("competitions").select("id").eq("status", "live"),
        supabase.from("entries").select("id", { count: "exact", head: true }),
        supabase.from("payments").select("amount").eq("status", "succeeded"),
        supabase.from("postal_entries").select("id", { count: "exact", head: true }).eq("status", "received"),
        supabase.from("competitions").select("id", { count: "exact", head: true }).in("status", ["closed", "sold_out"]),
        supabase.from("winners").select("id", { count: "exact", head: true }).eq("is_published", false),
      ]);
      const firstError = liveComps.error || entries.error || revenue.error || postal.error || awaitingDraw.error || awaitingPublish.error;
      if (firstError) setError(firstError.message);
      const liveIds = ((liveComps.data as Row[]) ?? []).map((r) => r.id);
      let activeDraw = 0;
      if (liveIds.length) {
        const { count } = await supabase.from("entries").select("id", { count: "exact", head: true }).eq("status", "valid").in("competition_id", liveIds);
        activeDraw = count || 0;
      }
      const rev = ((revenue.data as Row[]) ?? []).reduce((sum, r) => sum + Number(r.amount || 0), 0);
      if (!cancelled) setStats({ live: liveIds.length, entries: entries.count || 0, revenue: rev, postal: postal.count || 0, awaitingDraw: awaitingDraw.count || 0, awaitingPublish: awaitingPublish.count || 0, activeDraw });
    }
    load();
    const onFocus = () => load();
    const onVis = () => { if (document.visibilityState === "visible") load(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [supabase]);

  return (
    <div>
      <AdminPageHeader eyebrow="Operations" title="Dashboard" subtitle="Operational overview, key counts and launch readiness signals copied from the Vite dashboard." />
      <div className="mb-6 flex flex-wrap gap-2">{["competitions", "entries", "payments", "postal-entries", "draws", "winners"].map((x) => <Button key={x} asChild size="sm" variant="outline"><Link href={`/admin/${x}`}>{x.replace("-", " ")}</Link></Button>)}</div>
      {error ? <div className="mb-6 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">{error}</div> : null}
      <AdminPanel variant="outline" tone="warning" className="mb-6 p-0" title="Pre-launch warnings">
        <ul className="list-inside list-disc space-y-1 text-sm text-white/85">
          <li>Legal pages are still draft, review with a solicitor before launch.</li>
          <li>Stripe is in test mode, switch to live keys for production.</li>
          <li>Dev payment bypass must be disabled before production.</li>
          <li>Email notifications need manual review before relying on production sends.</li>
        </ul>
      </AdminPanel>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile label="Live competitions" value={stats.live} />
        <StatTile label="Active draw entries" value={stats.activeDraw} />
        <StatTile label="Closed, ready to draw" value={stats.awaitingDraw} />
        <StatTile label="Drawn, awaiting publish" value={stats.awaitingPublish} />
        <StatTile label="Postal awaiting" value={stats.postal} />
        <StatTile label="Revenue" value={formatMoney(stats.revenue)} />
        <StatTile label="Total entries" value={stats.entries} />
      </div>
    </div>
  );
}

function CompetitionsPage() {
  const { rows, loading, error } = useRows("competitions", "id,title,slug,status,ticket_price,max_entries,current_entries,manual_reserved_entries,opens_at,closes_at,draw_at,created_at,archived_at", "created_at", false, 200);
  const [q, setQ] = useState("");
  const filtered = useMemo(() => rows.filter((r) => !q.trim() || `${r.title} ${r.slug} ${r.status}`.toLowerCase().includes(q.toLowerCase())), [q, rows]);
  return (
    <div>
      <AdminPageHeader eyebrow="Competitions" title="Competitions" subtitle="Read-only Next port of the Vite competition list. Creation, editing and lifecycle mutations remain incomplete here." actions={<Button asChild><Link href="/admin/competitions/new">New competition</Link></Button>} />
      <IncompleteNotice>Competition create/edit, lifecycle status actions, reconcile counts, duplicate/archive/delete, image variant regeneration and discount tier editing are not wired in Next yet. Existing Vite admin RPC/function calls were audited but not reimplemented here.</IncompleteNotice>
      <div className="my-4 max-w-xl"><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search competitions" /></div>
      <LoadingOrError loading={loading} error={error} />
      <EmptyRows rows={filtered} label="competitions" />
      {filtered.length ? <AdminTable minWidth={1100}><thead className="bg-white/5 text-xs uppercase tracking-wider text-white/60"><tr><AdminTH>Competition</AdminTH><AdminTH>Status</AdminTH><AdminTH align="right">Price</AdminTH><AdminTH align="right">Entries</AdminTH><AdminTH>Closes</AdminTH><AdminTH>Draw</AdminTH><AdminTH align="right">Actions</AdminTH></tr></thead><tbody>{filtered.map((c) => <AdminTR key={c.id}><AdminTD><div className="font-semibold text-white">{c.title}</div><div className="text-xs text-white/45">{c.slug}</div>{c.archived_at ? <div className="text-xs text-warning">Archived {fmtDate(c.archived_at)}</div> : null}</AdminTD><AdminTD><StatusBadge status={c.status || "draft"} /></AdminTD><AdminTD align="right">{formatMoney(Number(c.ticket_price || 0))}</AdminTD><AdminTD align="right">{Number(c.current_entries || 0)} / {Number(c.max_entries || 0)}{Number(c.manual_reserved_entries || 0) ? <div className="text-xs text-white/45">Reserved {c.manual_reserved_entries}</div> : null}</AdminTD><AdminTD>{fmtDate(c.closes_at)}</AdminTD><AdminTD>{fmtDate(c.draw_at)}</AdminTD><AdminTD align="right"><Button asChild size="sm" variant="outline"><Link href={`/admin/competitions/${c.id}`}>Edit</Link></Button></AdminTD></AdminTR>)}</tbody></AdminTable> : null}
    </div>
  );
}

function CompetitionFormShell({ mode, id }: { mode: "new" | "edit"; id?: string }) {
  const { rows, loading, error } = useRows("competitions", "*", "created_at", false, 1);
  const current = mode === "edit" ? rows.find((r) => r.id === id) : null;
  return (
    <div>
      <AdminPageHeader eyebrow="Competitions" title={mode === "new" ? "New competition" : "Edit competition"} subtitle="The Vite form includes pricing, dates, image uploads, generated variants, discount tiers and dynamic content editors." />
      <IncompleteNotice>This mutation-heavy form is not fully ported in Next yet. No save, upload or regenerate controls are shown here to avoid fake admin success states.</IncompleteNotice>
      <LoadingOrError loading={mode === "edit" && loading} error={error} />
      {mode === "edit" ? <AdminPanel title="Requested competition"><div className="space-y-2 text-sm text-white/75"><div>ID: <span className="font-mono text-white">{id}</span></div><div>{current ? current.title : "The full record is loaded by the Vite edit form; this Next route is a parity shell."}</div></div></AdminPanel> : null}
    </div>
  );
}

function HeroBannersPage() {
  const { rows, loading, error } = useRows("hero_banners", "*", "display_order", true, 100);
  return <SimpleListPage eyebrow="Content" title="Hero banners" subtitle="Vite supports list/filter/create/edit, scheduling, CTA fields, trust chips, uploads and preview. Next currently exposes a safe read-only list." loading={loading} error={error} rows={rows} icon={<ImageIcon className="h-5 w-5" />} columns={["title", "page_key", "is_active", "starts_at", "ends_at", "updated_at"]} incomplete="Create/edit, active toggles, schedule controls, image upload and preview are not wired in Next yet." />;
}

function CustomersPage() {
  const { rows, loading, error } = useRows("profiles", "id,email,full_name,phone,postcode,verification_status,created_at,updated_at", "created_at", false, 100);
  return <SimpleListPage eyebrow="CRM" title="Customers" subtitle="Customer list/detail is read-only in this Next pass." loading={loading} error={error} rows={rows} icon={<Users className="h-5 w-5" />} columns={["email", "full_name", "phone", "postcode", "verification_status", "created_at"]} incomplete="Customer detail drawer, wallet grant/adjust actions and verification review mutations are not ported in Next yet." />;
}

function EntriesPage() {
  const { rows, loading, error } = useRows("entries", "id,ticket_number,entry_type,status,is_winner,created_at,user_id,competition_id,payment_id,archived_at", "created_at", false, 200);
  return <SimpleListPage eyebrow="Operations" title="Entries" subtitle="Read-only entries view. Vite void/archive/delete/refund functions are intentionally not duplicated yet." loading={loading} error={error} rows={rows} icon={<Users className="h-5 w-5" />} columns={["ticket_number", "entry_type", "status", "is_winner", "competition_id", "user_id", "created_at"]} incomplete="Void, refund, archive, unarchive and delete actions call existing Edge Functions in Vite and are not wired in Next yet." />;
}

function PaymentsPage({ title }: { title: string }) {
  const { rows, loading, error } = useRows("payments", "id,user_id,competition_id,amount,quantity,status,refund_status,refunded_amount,created_at,is_multiline,discount_amount,wallet_amount_used", "created_at", false, 200);
  return <SimpleListPage eyebrow="Operations" title={title} subtitle="Read-only payment/order list using the same payments table as Vite." loading={loading} error={error} rows={rows} icon={<CreditCard className="h-5 w-5" />} columns={["id", "status", "amount", "refund_status", "refunded_amount", "user_id", "created_at"]} format={{ id: shortId, amount: (v) => formatMoney(Number(v || 0)), refunded_amount: (v) => formatMoney(Number(v || 0)) }} incomplete="Cancel/refund flows call existing Vite Edge Functions and are not wired in Next yet. No payment or refund logic was changed." />;
}

function DrawsPage() {
  const { rows, loading, error } = useRows("competitions", "id,title,slug,current_entries,status,closes_at,draw_at", "created_at", false, 100);
  const drawRows = rows.filter((r) => ["closed", "sold_out", "drawn"].includes(r.status));
  return <SimpleListPage eyebrow="Draws" title="Draws" subtitle="Closed/sold-out/drawn competitions for draw review. Execution is not ported in Next." loading={loading} error={error} rows={drawRows} icon={<Gavel className="h-5 w-5" />} columns={["title", "status", "current_entries", "closes_at", "draw_at"]} incomplete="Run draw and record-proof flow remains in Vite. Next does not call or change draw logic in this pass." />;
}

function WinnersPage() {
  const { rows, loading, error } = useRows("winners", "id,display_name,display_location,prize_title,winning_ticket_number,draw_date,is_published,claim_status,competition_id,created_at", "draw_date", false, 100);
  return <SimpleListPage eyebrow="Draws" title="Winners" subtitle="Read-only winner publishing and claim status review." loading={loading} error={error} rows={rows} icon={<Award className="h-5 w-5" />} columns={["display_name", "prize_title", "winning_ticket_number", "is_published", "claim_status", "draw_date"]} incomplete="Manual winner creation, publish toggles, proof upload and claim status editing remain in Vite." />;
}

function ReviewsPage() {
  const { rows, loading, error } = useRows("reviews", "id,reviewer_name,rating,review_text,display_order,is_active,review_date,location,created_at,updated_at", "display_order", true, 100);
  return <SimpleListPage eyebrow="Content" title="Reviews" subtitle="Read-only reviews list." loading={loading} error={error} rows={rows} icon={<Star className="h-5 w-5" />} columns={["reviewer_name", "rating", "location", "is_active", "display_order", "review_date"]} incomplete="Review create/edit/delete is not wired in Next yet." />;
}

function DiscountCodesPage() {
  return <IncompleteAdminPage title="Discount codes" icon={<Tag className="h-5 w-5" />} body="Vite manages discount codes through the existing admin-discount-codes Edge Function. This Next route is present but intentionally does not fake list/create/update/delete actions." />;
}

function WalletSettingsPage() {
  const { rows, loading, error } = useRows("wallet_settings", "*", "id", true, 1);
  return <SimpleListPage eyebrow="Wallet" title="Wallet settings" subtitle="Read-only wallet settings." loading={loading} error={error} rows={rows} icon={<Wallet className="h-5 w-5" />} columns={["id", "is_earn_enabled", "earn_percentage", "updated_at"]} incomplete="Wallet setting mutations and customer wallet grant/adjust Edge Functions are not wired in Next yet." />;
}

function PostalEntriesPage() {
  const { rows, loading, error } = useRows("postal_entries", "id,competition_id,full_name,email,status,entry_id,created_at,processed_at,rejection_reason", "created_at", false, 200);
  return <SimpleListPage eyebrow="Operations" title="Postal entries" subtitle="Read-only postal entry processing queue." loading={loading} error={error} rows={rows} icon={<Mail className="h-5 w-5" />} columns={["full_name", "email", "status", "competition_id", "entry_id", "created_at"]} incomplete="Manual postal create, accept/process and reject actions remain in Vite." />;
}

function EmailsPage() {
  const { rows, loading, error } = useRows("email_templates", "id,template_key,subject,is_active,updated_at", "template_key", true, 100);
  return <SimpleListPage eyebrow="Comms" title="Emails" subtitle="Read-only email templates when the table is available." loading={loading} error={error} rows={rows} icon={<Send className="h-5 w-5" />} columns={["template_key", "subject", "is_active", "updated_at"]} incomplete="The Vite email editor, preview diagnostics, branding settings and send/test flows are not ported in Next yet. Klaviyo/Resend logic was not changed." />;
}

function FaqsPage() {
  const { rows, loading, error } = useRows("faqs", "id,category,question,sort_order,is_published,archived_at,updated_at", "sort_order", true, 100);
  return <SimpleListPage eyebrow="Content" title="FAQs" subtitle="Read-only FAQ list." loading={loading} error={error} rows={rows} icon={<LifeBuoy className="h-5 w-5" />} columns={["category", "question", "is_published", "sort_order", "updated_at"]} incomplete="FAQ create/edit/archive/delete remains in Vite." />;
}

function GuidesPage() {
  const { rows, loading, error } = useRows("guides", "id,title,slug,category,status,is_featured,updated_at,published_at", "updated_at", false, 100);
  return <SimpleListPage eyebrow="Content" title="Guides" subtitle="Read-only guides list." loading={loading} error={error} rows={rows} icon={<BookOpen className="h-5 w-5" />} columns={["title", "slug", "category", "status", "is_featured", "updated_at"]} actions={<Button asChild><Link href="/admin/guides/new">New guide</Link></Button>} incomplete="Guide create/edit/delete and featured image upload remain in Vite." />;
}

function GuideFormShell({ mode, id }: { mode: "new" | "edit"; id?: string }) {
  return <IncompleteAdminPage title={mode === "new" ? "New guide" : "Edit guide"} icon={<BookOpen className="h-5 w-5" />} body={`Guide form route is present (${id ?? "new"}) but the Vite editor and upload flow are not ported in Next yet.`} />;
}

function ContentLibraryPage() {
  return <IncompleteAdminPage title="Content library" icon={<Library className="h-5 w-5" />} body="Vite browses and uploads files in the competition-images bucket. This Next route is present, but storage list/upload/delete is not wired yet to avoid fake media operations." />;
}

function SeoCentrePage() {
  const { rows, loading, error } = useRows("competitions", "id,title,slug,status,short_description,updated_at", "updated_at", false, 100);
  return <SimpleListPage eyebrow="SEO" title="SEO Centre" subtitle="Read-only competition SEO source review." loading={loading} error={error} rows={rows} icon={<Search className="h-5 w-5" />} columns={["title", "slug", "status", "short_description", "updated_at"]} incomplete="Vite SEO centre editing/review tools are not ported in Next yet." />;
}

function DynamicContentPage() {
  return <IncompleteAdminPage title="Dynamic content" icon={<Megaphone className="h-5 w-5" />} body="Dynamic content section editor is not ported into Next yet." />;
}

function PageContentPage() {
  return <IncompleteAdminPage title="Page content" icon={<FileText className="h-5 w-5" />} body="Page content editor is not ported into Next yet." />;
}

function NotificationsPage() {
  return <IncompleteAdminPage title="Notifications" body="Launch notification admin is not part of the requested required route set and is not ported yet." />;
}

function IncompleteAdminPage({ title, body, icon }: { title: string; body: string; icon?: React.ReactNode }) {
  return (
    <div>
      <AdminPageHeader eyebrow="Admin" title={title} icon={icon} subtitle="Route shell is present so navigation is complete, but this operational flow is not fully ported." />
      <IncompleteNotice>{body}</IncompleteNotice>
    </div>
  );
}

function SimpleListPage({ eyebrow, title, subtitle, loading, error, rows, columns, icon, incomplete, format, actions }: { eyebrow: string; title: string; subtitle: string; loading: boolean; error: string | null; rows: Row[]; columns: string[]; icon?: React.ReactNode; incomplete?: string; format?: Record<string, (value: any, row: Row) => React.ReactNode>; actions?: React.ReactNode }) {
  return (
    <div>
      <AdminPageHeader eyebrow={eyebrow} title={title} subtitle={subtitle} icon={icon} actions={actions} />
      {incomplete ? <IncompleteNotice>{incomplete}</IncompleteNotice> : null}
      <div className="mt-5">
        <LoadingOrError loading={loading} error={error} />
        {!loading && !error ? <EmptyRows rows={rows} label={title.toLowerCase()} /> : null}
        {rows.length ? (
          <AdminTable>
            <thead className="bg-white/5 text-xs uppercase tracking-wider text-white/60"><tr>{columns.map((c) => <AdminTH key={c}>{c.replaceAll("_", " ")}</AdminTH>)}</tr></thead>
            <tbody>{rows.map((row) => <AdminTR key={row.id ?? JSON.stringify(row)}>{columns.map((c) => <AdminTD key={c}>{renderCell(c, row[c], row, format?.[c])}</AdminTD>)}</AdminTR>)}</tbody>
          </AdminTable>
        ) : null}
      </div>
    </div>
  );
}

function renderCell(column: string, value: any, row: Row, formatter?: (value: any, row: Row) => React.ReactNode) {
  if (formatter) return formatter(value, row);
  if (column === "id") return <span className="font-mono text-xs">{shortId(value)}</span>;
  if (column.includes("status") && typeof value === "string") return <StatusBadge status={value} />;
  if (column.startsWith("is_") || typeof value === "boolean") return value ? "Yes" : "No";
  if (column.endsWith("_at") || column.endsWith("_date")) return fmtDateTime(value);
  if (column.endsWith("_id")) return <span className="font-mono text-xs text-white/70">{shortId(value)}</span>;
  if (typeof value === "number") return <span className="font-mono-num">{value}</span>;
  return value ? String(value) : "-";
}
