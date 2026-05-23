"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Archive, ArchiveRestore, Award, BookOpen, ChevronRight, Copy, CreditCard, Download, ExternalLink, FileText, Gavel, Gift, Image as ImageIcon, Library, LifeBuoy, Loader2, Mail, Megaphone, Minus, Pencil, Plus, RefreshCw, RotateCcw, Search, Send, ShieldCheck, SlidersHorizontal, Star, Tag, Ticket, Trash2, Upload, Users, Wallet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { StatTile } from "@/components/ui/StatTile";
import { formatMoney } from "@/lib/format";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { isLikelyHttpsImage } from "@/lib/image";
import { regenerateCompetitionImageVariants, type CompetitionImageVariantSet } from "@/lib/competitionImages";
import { AdminPageHeader, AdminPanel, AdminTable, AdminTD, AdminTH, AdminTR, IncompleteNotice } from "@/components/admin/AdminKit";
import { AdminImageUploader } from "@/components/admin/AdminImageUploader";

type Row = Record<string, any>;

const EMPTY_GUIDE: Row = { title: "", slug: "", excerpt: "", category: "Getting Started", tags: [], featured_image_url: "", body_markdown: "", seo_title: "", seo_description: "", is_featured: false, status: "draft", published_at: null };

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
  if (key === "competitions/new") return <CompetitionFormPage mode="new" />;
  if (key.startsWith("competitions/")) return <CompetitionFormPage mode="edit" id={path?.[1]} />;
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
      <AdminPageHeader eyebrow="Competitions" title="Competitions" subtitle="Next now supports real create/edit, status changes and image upload/regeneration for competitions. Lifecycle RPC actions remain guarded in Vite." actions={<Button asChild><Link href="/admin/competitions/new">New competition</Link></Button>} />
      <IncompleteNotice>Duplicate, reconcile counts, archive/delete RPC actions, discount tier editing and dynamic content editing are not wired in Next yet. Those Vite admin RPC/function calls were audited but not reimplemented here.</IncompleteNotice>
      <div className="my-4 max-w-xl"><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search competitions" /></div>
      <LoadingOrError loading={loading} error={error} />
      <EmptyRows rows={filtered} label="competitions" />
      {filtered.length ? <AdminTable minWidth={1100}><thead className="bg-white/5 text-xs uppercase tracking-wider text-white/60"><tr><AdminTH>Competition</AdminTH><AdminTH>Status</AdminTH><AdminTH align="right">Price</AdminTH><AdminTH align="right">Entries</AdminTH><AdminTH>Closes</AdminTH><AdminTH>Draw</AdminTH><AdminTH align="right">Actions</AdminTH></tr></thead><tbody>{filtered.map((c) => <AdminTR key={c.id}><AdminTD><div className="font-semibold text-white">{c.title}</div><div className="text-xs text-white/45">{c.slug}</div>{c.archived_at ? <div className="text-xs text-warning">Archived {fmtDate(c.archived_at)}</div> : null}</AdminTD><AdminTD><StatusBadge status={c.status || "draft"} /></AdminTD><AdminTD align="right">{formatMoney(Number(c.ticket_price || 0))}</AdminTD><AdminTD align="right">{Number(c.current_entries || 0)} / {Number(c.max_entries || 0)}{Number(c.manual_reserved_entries || 0) ? <div className="text-xs text-white/45">Reserved {c.manual_reserved_entries}</div> : null}</AdminTD><AdminTD>{fmtDate(c.closes_at)}</AdminTD><AdminTD>{fmtDate(c.draw_at)}</AdminTD><AdminTD align="right"><Button asChild size="sm" variant="outline"><Link href={`/admin/competitions/${c.id}`}>Edit</Link></Button></AdminTD></AdminTR>)}</tbody></AdminTable> : null}
    </div>
  );
}

const competitionEmpty: Row = {
  title: "",
  slug: "",
  short_description: "",
  description: "",
  category: "",
  prize_value: 0,
  ticket_price: 0,
  cash_alternative: 0,
  max_entries: 1,
  current_entries: 0,
  manual_reserved_entries: 0,
  per_user_entry_limit: 0,
  status: "draft",
  main_image_url: "",
  gallery_image_urls: [],
  image_original_url: "",
  image_card_url: "",
  image_detail_url: "",
  image_thumb_url: "",
  opens_at: "",
  closes_at: "",
  draw_at: "",
  draw_method: "auto",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function nullIfEmpty(value: unknown) {
  return value === "" || value === undefined ? null : value;
}

function FieldLabel({ label, help }: { label: string; help?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">{label}</span>
      {help ? <span className="mt-1 block text-xs text-white/45">{help}</span> : null}
    </label>
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`min-h-28 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-primary/60 ${props.className || ""}`} />;
}

function CompetitionFormPage({ mode, id }: { mode: "new" | "edit"; id?: string }) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [form, setForm] = useState<Row>(competitionEmpty);
  const [originalReserved, setOriginalReserved] = useState(0);
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase || mode !== "edit" || !id) return;
    setLoading(true);
    setError(null);
    const { data, error: nextError } = await supabase.from("competitions").select("*").eq("id", id).maybeSingle();
    if (nextError) setError(nextError.message);
    if (data) {
      const row = data as Row;
      setForm({ ...competitionEmpty, ...row, gallery_image_urls: Array.isArray(row.gallery_image_urls) ? row.gallery_image_urls : [] });
      setOriginalReserved(Number(row.manual_reserved_entries || 0));
    }
    setLoading(false);
  }, [id, mode, supabase]);

  useEffect(() => { load(); }, [load]);

  function setField(key: string, value: unknown) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setTitle(value: string) {
    setForm((prev) => ({ ...prev, title: value, slug: prev.slug ? prev.slug : slugify(value) }));
  }

  function applyVariants(variants: CompetitionImageVariantSet) {
    setForm((prev) => ({
      ...prev,
      main_image_url: variants.image_detail_url || variants.image_card_url || variants.image_original_url,
      image_original_url: variants.image_original_url,
      image_card_url: variants.image_card_url,
      image_detail_url: variants.image_detail_url,
      image_thumb_url: variants.image_thumb_url,
    }));
  }

  async function regenerateVariants() {
    const source = form.image_original_url || form.main_image_url;
    if (!source) {
      setError("Add or upload a source image before regenerating variants.");
      return;
    }
    setImageBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const variants = await regenerateCompetitionImageVariants(source, { competitionId: id, slug: form.slug, sourceName: form.title });
      applyVariants(variants);
      if (mode === "edit" && id && supabase) {
        const { error: nextError } = await supabase
          .from("competitions")
          .update({
            main_image_url: variants.image_detail_url || variants.image_card_url || variants.image_original_url,
            ...variants,
          })
          .eq("id", id);
        if (nextError) throw nextError;
      }
      setSuccess("Image variants regenerated.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Image variant regeneration failed.");
    } finally {
      setImageBusy(false);
    }
  }

  const checks = useMemo(() => {
    const manual = Number(form.manual_reserved_entries || 0);
    const current = Number(form.current_entries || 0);
    const max = Number(form.max_entries || 0);
    return [
      { label: "Title and slug", ok: !!form.title && !!form.slug },
      { label: "Short description", ok: !!form.short_description },
      { label: "Full description", ok: !!form.description },
      { label: "Ticket price not negative", ok: Number(form.ticket_price || 0) >= 0 },
      { label: "Prize value greater than zero", ok: Number(form.prize_value || 0) > 0 },
      { label: "Maximum entries greater than zero", ok: max > 0 },
      { label: "Reserved entries fit capacity", ok: manual + current <= max },
      { label: "Closing date set", ok: !!form.closes_at },
      { label: "Draw date set", ok: !!form.draw_at },
      { label: "HTTPS main image", ok: isLikelyHttpsImage(form.main_image_url) },
    ];
  }, [form]);
  const readyToPublish = checks.every((c) => c.ok);

  async function save() {
    if (!supabase || saving) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    const manual = Number(form.manual_reserved_entries || 0);
    const current = Number(form.current_entries || 0);
    const max = Number(form.max_entries || 0);
    try {
      if (manual + current > max) {
        throw new Error("Manual reserved entries plus current entries cannot exceed maximum entries.");
      }
      let reservedReason: string | null = null;
      if (mode === "edit" && manual !== originalReserved) {
        reservedReason = window.prompt("Reason for changing manual reserved entries")?.trim() || null;
        if (!reservedReason) throw new Error("A reason is required before changing manual reserved entries.");
        if (!window.confirm(`Update reserved entries from ${originalReserved} to ${manual}?`)) {
          throw new Error("Reserved entry change cancelled.");
        }
      }
      const gallery = Array.isArray(form.gallery_image_urls) ? form.gallery_image_urls.map((x: unknown) => String(x).trim()).filter(Boolean) : [];
      const payload: Row = {
        title: String(form.title || "").trim(),
        slug: String(form.slug || "").trim(),
        short_description: nullIfEmpty(form.short_description),
        description: nullIfEmpty(form.description),
        category: nullIfEmpty(form.category),
        prize_value: Number(form.prize_value || 0),
        ticket_price: Number(form.ticket_price || 0),
        cash_alternative: Number(form.cash_alternative || 0),
        max_entries: max,
        manual_reserved_entries: manual,
        per_user_entry_limit: Number(form.per_user_entry_limit || 0),
        status: form.status || "draft",
        main_image_url: nullIfEmpty(form.main_image_url),
        gallery_image_urls: gallery,
        image_original_url: nullIfEmpty(form.image_original_url),
        image_card_url: nullIfEmpty(form.image_card_url),
        image_detail_url: nullIfEmpty(form.image_detail_url),
        image_thumb_url: nullIfEmpty(form.image_thumb_url),
        opens_at: nullIfEmpty(form.opens_at),
        closes_at: nullIfEmpty(form.closes_at),
        draw_at: nullIfEmpty(form.draw_at),
        draw_method: nullIfEmpty(form.draw_method),
      };
      const result = mode === "edit" && id
        ? await supabase.from("competitions").update(payload).eq("id", id).select("id").single()
        : await supabase.from("competitions").insert(payload).select("id").single();
      if (result.error) throw result.error;
      const savedId = (result.data as Row).id as string;
      if (mode === "edit" && manual !== originalReserved && reservedReason) {
        const { data: userData } = await supabase.auth.getUser();
        const { error: logError } = await supabase.from("competition_adjustments_log").insert({
          competition_id: savedId,
          admin_user_id: userData.user?.id,
          adjustment_type: "manual_reserved_entries",
          old_value: originalReserved,
          new_value: manual,
          reason: reservedReason,
        });
        if (logError) throw logError;
      }
      setOriginalReserved(manual);
      setSuccess(mode === "edit" ? "Competition updated." : "Competition created.");
      if (mode === "new") router.push(`/admin/competitions/${savedId}`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Competition save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(status: string) {
    if (!supabase || !id || saving) return;
    if (status === "closed" && !window.confirm("Close this competition?")) return;
    if (status === "archived" && !window.confirm("Archive this competition?")) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    const { error: nextError } = await supabase.from("competitions").update({ status }).eq("id", id);
    if (nextError) setError(nextError.message);
    else {
      setField("status", status);
      setSuccess(`Competition status updated to ${status}.`);
    }
    setSaving(false);
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Competitions"
        title={mode === "new" ? "New competition" : "Edit competition"}
        subtitle="Vite-compatible competition create/edit, status and image variant workflow using existing Supabase tables and storage policies."
        actions={<Button asChild variant="outline"><Link href="/admin/competitions">Back to competitions</Link></Button>}
      />
      <IncompleteNotice>Discount tier editing and dynamic content sections are still managed in the Vite admin. This form does not fake those editors.</IncompleteNotice>
      <LoadingOrError loading={loading} error={null} />
      {error ? <div className="mb-4 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">{error}</div> : null}
      {success ? <div className="mb-4 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-primary">{success}</div> : null}
      {!loading ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <AdminPanel title="Core details">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2"><FieldLabel label="Title" /><Input value={form.title || ""} onChange={(e) => setTitle(e.target.value)} /></div>
                <div className="space-y-2"><FieldLabel label="Slug" /><Input value={form.slug || ""} onChange={(e) => setField("slug", slugify(e.target.value))} /></div>
                <div className="space-y-2"><FieldLabel label="Category" /><Input value={form.category || ""} onChange={(e) => setField("category", e.target.value)} /></div>
                <div className="space-y-2 md:col-span-2"><FieldLabel label="Short description" /><Textarea rows={3} value={form.short_description || ""} onChange={(e) => setField("short_description", e.target.value)} /></div>
                <div className="space-y-2 md:col-span-2"><FieldLabel label="Description" /><Textarea rows={6} value={form.description || ""} onChange={(e) => setField("description", e.target.value)} /></div>
              </div>
            </AdminPanel>

            <AdminPanel title="Pricing and capacity">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2"><FieldLabel label="Ticket price" /><Input type="number" step="0.01" min="0" value={form.ticket_price ?? 0} onChange={(e) => setField("ticket_price", e.target.value)} /></div>
                <div className="space-y-2"><FieldLabel label="Prize value" /><Input type="number" step="0.01" min="0" value={form.prize_value ?? 0} onChange={(e) => setField("prize_value", e.target.value)} /></div>
                <div className="space-y-2"><FieldLabel label="Cash alternative" /><Input type="number" step="0.01" min="0" value={form.cash_alternative ?? 0} onChange={(e) => setField("cash_alternative", e.target.value)} /></div>
                <div className="space-y-2"><FieldLabel label="Max entries" /><Input type="number" min="1" value={form.max_entries ?? 1} onChange={(e) => setField("max_entries", e.target.value)} /></div>
                <div className="space-y-2"><FieldLabel label="Current entries" help="Displayed for validation; Vite does not edit ticket allocation here." /><Input type="number" value={form.current_entries ?? 0} disabled /></div>
                <div className="space-y-2"><FieldLabel label="Manual reserved entries" /><Input type="number" min="0" value={form.manual_reserved_entries ?? 0} onChange={(e) => setField("manual_reserved_entries", e.target.value)} /></div>
                <div className="space-y-2"><FieldLabel label="Per-user entry limit" /><Input type="number" min="0" value={form.per_user_entry_limit ?? 0} onChange={(e) => setField("per_user_entry_limit", e.target.value)} /></div>
              </div>
            </AdminPanel>

            <AdminPanel title="Dates and status">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2"><FieldLabel label="Opens at" /><Input type="datetime-local" value={form.opens_at ? String(form.opens_at).slice(0, 16) : ""} onChange={(e) => setField("opens_at", e.target.value)} /></div>
                <div className="space-y-2"><FieldLabel label="Closes at" /><Input type="datetime-local" value={form.closes_at ? String(form.closes_at).slice(0, 16) : ""} onChange={(e) => setField("closes_at", e.target.value)} /></div>
                <div className="space-y-2"><FieldLabel label="Draw at" /><Input type="datetime-local" value={form.draw_at ? String(form.draw_at).slice(0, 16) : ""} onChange={(e) => setField("draw_at", e.target.value)} /></div>
                <div className="space-y-2">
                  <FieldLabel label="Status" />
                  <select className="h-10 w-full rounded-md border border-white/10 bg-[#111827] px-3 text-sm text-white" value={form.status || "draft"} onChange={(e) => setField("status", e.target.value)}>
                    {["draft", "live", "sold_out", "closed", "drawn", "archived"].map((status) => <option key={status} value={status}>{status.replace("_", " ")}</option>)}
                  </select>
                </div>
              </div>
              {mode === "edit" ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => updateStatus("draft")} disabled={saving}>Draft</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => updateStatus("live")} disabled={saving || !readyToPublish}>Publish live</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => updateStatus("sold_out")} disabled={saving}>Mark sold out</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => updateStatus("closed")} disabled={saving}>Close</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => updateStatus("archived")} disabled={saving}>Archive</Button>
                </div>
              ) : null}
            </AdminPanel>

            <AdminPanel title="Images">
              <div className="grid gap-5 lg:grid-cols-2">
                <div className="space-y-3">
                  <FieldLabel label="Main image URL" help="Manual URL entry clears generated variants, matching Vite." />
                  <Input value={form.main_image_url || ""} onChange={(e) => setForm((prev) => ({ ...prev, main_image_url: e.target.value, image_original_url: "", image_card_url: "", image_detail_url: "", image_thumb_url: "" }))} />
                  <AdminImageUploader
                    multiple={false}
                    compact
                    competitionImage={{ competitionId: id, slug: form.slug, onGenerated: applyVariants }}
                    onUploaded={() => undefined}
                    onSuccess={setSuccess}
                    onError={setError}
                    hint="Upload main image and generate original/card/detail/thumb variants."
                  />
                  <Button type="button" variant="outline" size="sm" onClick={regenerateVariants} disabled={imageBusy || !form.main_image_url}>
                    {imageBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Regenerate variants
                  </Button>
                </div>
                <div className="space-y-3">
                  {form.main_image_url ? <img src={form.main_image_url} alt="" className="aspect-video w-full rounded-lg border border-white/10 object-cover" /> : <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-white/15 text-sm text-white/45">No main image</div>}
                  <div className="grid gap-2 text-xs text-white/55">
                    {["image_original_url", "image_card_url", "image_detail_url", "image_thumb_url"].map((key) => <div key={key} className="truncate"><span className="text-white/35">{key}: </span>{form[key] || "-"}</div>)}
                  </div>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                <FieldLabel label="Gallery image URLs" />
                <Textarea rows={4} value={(form.gallery_image_urls || []).join("\n")} onChange={(e) => setField("gallery_image_urls", e.target.value.split("\n"))} />
                <AdminImageUploader
                  folder={`competitions/${form.slug || id || "general"}/gallery`}
                  onUploaded={(files) => setField("gallery_image_urls", [...(Array.isArray(form.gallery_image_urls) ? form.gallery_image_urls : []), ...files.map((file) => file.url)])}
                  onSuccess={setSuccess}
                  onError={setError}
                  compact
                  hint="Upload gallery images to the competition-images bucket."
                />
              </div>
            </AdminPanel>
          </div>

          <aside className="space-y-5">
            <AdminPanel title="Publish readiness">
              <div className="space-y-2">{checks.map((check) => <div key={check.label} className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.03] px-3 py-2 text-sm"><span className="text-white/75">{check.label}</span><StatusBadge status={check.ok ? "ready" : "missing"} /></div>)}</div>
              <Button type="button" className="mt-4 w-full" onClick={save} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {mode === "new" ? "Create competition" : "Save changes"}
              </Button>
              {!readyToPublish ? <p className="mt-3 text-xs text-warning">Vite blocks publishing until all required fields pass health checks.</p> : null}
            </AdminPanel>
            <AdminPanel title="Operational notes">
              <ul className="list-inside list-disc space-y-1 text-sm text-white/65">
                <li>No ticket allocation, pricing rule or draw logic is changed by this form.</li>
                <li>Storage uploads use the browser Supabase client and existing RLS policies.</li>
                <li>Reserved entry changes require a reason and write `competition_adjustments_log`.</li>
              </ul>
            </AdminPanel>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

type HeroDraft = {
  page_key: string;
  internal_name: string;
  is_active: boolean;
  sort_order: number;
  starts_at: string | null;
  ends_at: string | null;
  eyebrow: string;
  headline_before_accent: string;
  headline_accent: string;
  headline_after_accent: string;
  body: string;
  promo_badge_text: string;
  promo_badge_variant: string;
  cash_alternative_text: string;
  primary_cta_label: string;
  primary_cta_url: string;
  secondary_cta_label: string;
  secondary_cta_url: string;
  trust_chips: string;
  desktop_image_url: string;
  mobile_image_url: string;
  image_alt: string;
  image_position_desktop: string;
  image_position_mobile: string;
  overlay_strength: string;
};

const HERO_PAGES = [
  { key: "homepage", label: "Homepage" },
  { key: "competitions", label: "Competitions page" },
  { key: "bundle_builder", label: "Bundle Builder page" },
  { key: "winners", label: "Winners page" },
  { key: "help_centre", label: "Help Centre page" },
];

const emptyHeroDraft: HeroDraft = {
  page_key: "homepage",
  internal_name: "",
  is_active: false,
  sort_order: 0,
  starts_at: null,
  ends_at: null,
  eyebrow: "FEATURED COMPETITION",
  headline_before_accent: "WIN THE",
  headline_accent: "PLAYSTATION 5 SLIM",
  headline_after_accent: "FOR JUST £1.99",
  body: "",
  promo_badge_text: "ONLY 500 TICKETS",
  promo_badge_variant: "blue",
  cash_alternative_text: "",
  primary_cta_label: "ENTER NOW",
  primary_cta_url: "/competitions",
  secondary_cta_label: "VIEW ALL COMPETITIONS",
  secondary_cta_url: "/competitions",
  trust_chips: "18+ UK ONLY\nFREE POSTAL ENTRY\nWINNERS PUBLISHED",
  desktop_image_url: "/media/playstation-comp.jpg",
  mobile_image_url: "",
  image_alt: "PlayStation 5 Slim bundle",
  image_position_desktop: "right",
  image_position_mobile: "center",
  overlay_strength: "medium",
};

function isoToLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function localToIso(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function parseTrustChips(value: string) {
  return value.split(/\r?\n/).map((chip) => chip.trim()).filter(Boolean);
}

function heroDraftFromRow(row: Row): HeroDraft {
  return {
    ...emptyHeroDraft,
    page_key: row.page_key || "homepage",
    internal_name: row.internal_name || "",
    is_active: !!row.is_active,
    sort_order: Number(row.sort_order || 0),
    starts_at: row.starts_at || null,
    ends_at: row.ends_at || null,
    eyebrow: row.eyebrow || "",
    headline_before_accent: row.headline_before_accent || "",
    headline_accent: row.headline_accent || "",
    headline_after_accent: row.headline_after_accent || "",
    body: row.body || "",
    promo_badge_text: row.promo_badge_text || "",
    promo_badge_variant: row.promo_badge_variant || "blue",
    cash_alternative_text: row.cash_alternative_text || "",
    primary_cta_label: row.primary_cta_label || "",
    primary_cta_url: row.primary_cta_url || "",
    secondary_cta_label: row.secondary_cta_label || "",
    secondary_cta_url: row.secondary_cta_url || "",
    trust_chips: Array.isArray(row.trust_chips) ? row.trust_chips.join("\n") : "",
    desktop_image_url: row.desktop_image_url || "",
    mobile_image_url: row.mobile_image_url || "",
    image_alt: row.image_alt || "",
    image_position_desktop: row.image_position_desktop || "center",
    image_position_mobile: row.image_position_mobile || "center",
    overlay_strength: row.overlay_strength || "medium",
  };
}

function heroPageLabel(key: string) {
  return HERO_PAGES.find((page) => page.key === key)?.label ?? key;
}

function HeroPreview({ draft }: { draft: HeroDraft }) {
  const chips = parseTrustChips(draft.trust_chips);
  const image = draft.desktop_image_url || "/media/playstation-comp.jpg";
  return (
    <div className="overflow-hidden rounded-2xl border border-primary/20 bg-[hsl(222_42%_5%)] shadow-[0_28px_80px_-52px_hsl(var(--primary)/0.75)]">
      <div className="relative min-h-[280px] p-5 sm:p-7">
        <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover object-[72%_center]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,hsl(222_48%_3%/0.97)_0%,hsl(222_42%_5%/0.88)_43%,hsl(222_35%_8%/0.24)_100%)]" />
        <div className="relative max-w-md">
          <div className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.24em] text-white/85">{draft.eyebrow || "FEATURED COMPETITION"}</div>
          <h3 className="font-display text-3xl font-bold uppercase leading-[1.06] text-white">
            {draft.headline_before_accent} <span className="grad-text shimmer">{draft.headline_accent}</span> {draft.headline_after_accent}
          </h3>
          {draft.body ? <p className="mt-3 max-w-sm text-sm font-medium leading-relaxed text-white/78">{draft.body}</p> : null}
          {draft.promo_badge_text ? <div className="mt-4 inline-flex rounded-full border border-primary/55 bg-primary/15 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-white">{draft.promo_badge_text}</div> : null}
          {draft.cash_alternative_text ? <div className="mt-3 inline-flex rounded-full border border-white/12 bg-white/[0.07] px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white/82">{draft.cash_alternative_text}</div> : null}
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <span className="btn-primary-glow inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-[11px] font-extrabold uppercase tracking-wider">{draft.primary_cta_label || "ENTER NOW"} <Ticket className="h-3.5 w-3.5" /></span>
            <span className="btn-ghost-rim inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-[11px] font-extrabold uppercase tracking-wider">{draft.secondary_cta_label || "VIEW ALL"} <ChevronRight className="h-3.5 w-3.5" /></span>
          </div>
          {chips.length ? <div className="mt-4 flex flex-wrap gap-1.5">{chips.map((chip) => <span key={chip} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.055] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white/75"><ShieldCheck className="h-3 w-3 text-primary" />{chip}</span>)}</div> : null}
        </div>
      </div>
    </div>
  );
}

function HeroBannersPage() {
  const supabase = createSupabaseBrowserClient();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pageFilter, setPageFilter] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<HeroDraft>(emptyHeroDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    const { data, error: nextError } = await supabase
      .from("hero_banners")
      .select("*")
      .order("page_key", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("updated_at", { ascending: false });
    setRows((data as Row[]) ?? []);
    setError(nextError?.message ?? null);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { reload(); }, [reload]);

  const counts = useMemo(() => {
    const next: Record<string, number> = { all: rows.length };
    for (const page of HERO_PAGES) next[page.key] = 0;
    for (const row of rows) next[row.page_key] = (next[row.page_key] || 0) + 1;
    return next;
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (pageFilter !== "all" && row.page_key !== pageFilter) return false;
      if (q && !`${row.internal_name || ""} ${row.headline_accent || ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [pageFilter, rows, search]);

  function openCreate() {
    setDraft({ ...emptyHeroDraft, page_key: pageFilter === "all" ? "homepage" : pageFilter });
    setCreating(true);
    setOpenId("__new__");
    setError(null);
    setSuccess(null);
  }

  function openEdit(row: Row) {
    setDraft(heroDraftFromRow(row));
    setCreating(false);
    setOpenId(row.id);
    setError(null);
    setSuccess(null);
  }

  function close() {
    setOpenId(null);
    setCreating(false);
  }

  async function save() {
    if (!supabase || saving) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        page_key: draft.page_key,
        internal_name: draft.internal_name.trim(),
        is_active: draft.is_active,
        sort_order: Number(draft.sort_order) || 0,
        starts_at: draft.starts_at,
        ends_at: draft.ends_at,
        eyebrow: nullIfEmpty(draft.eyebrow),
        headline_before_accent: nullIfEmpty(draft.headline_before_accent),
        headline_accent: nullIfEmpty(draft.headline_accent),
        headline_after_accent: nullIfEmpty(draft.headline_after_accent),
        body: nullIfEmpty(draft.body),
        promo_badge_text: nullIfEmpty(draft.promo_badge_text),
        promo_badge_variant: draft.promo_badge_variant || "blue",
        cash_alternative_text: nullIfEmpty(draft.cash_alternative_text),
        primary_cta_label: nullIfEmpty(draft.primary_cta_label),
        primary_cta_url: nullIfEmpty(draft.primary_cta_url),
        secondary_cta_label: nullIfEmpty(draft.secondary_cta_label),
        secondary_cta_url: nullIfEmpty(draft.secondary_cta_url),
        trust_chips: parseTrustChips(draft.trust_chips),
        desktop_image_url: nullIfEmpty(draft.desktop_image_url),
        mobile_image_url: nullIfEmpty(draft.mobile_image_url),
        image_alt: nullIfEmpty(draft.image_alt),
        image_position_desktop: draft.image_position_desktop || "center",
        image_position_mobile: draft.image_position_mobile || "center",
        overlay_strength: draft.overlay_strength || "medium",
      };
      if (!payload.internal_name) throw new Error("Internal name is required.");
      const result = creating
        ? await supabase.from("hero_banners").insert(payload).select("id").single()
        : await supabase.from("hero_banners").update(payload).eq("id", openId).select("id").single();
      if (result.error) throw result.error;
      const savedId = (result.data as Row).id;
      if (payload.is_active && savedId) {
        const { error: deactivateError } = await supabase.from("hero_banners").update({ is_active: false }).eq("page_key", payload.page_key).neq("id", savedId);
        if (deactivateError) throw deactivateError;
      }
      setSuccess(creating ? "Hero banner created." : "Hero banner updated.");
      close();
      await reload();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Hero banner save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function destroy() {
    if (!supabase || creating || !openId) return;
    if (!window.confirm(`Delete "${draft.internal_name || "this hero banner"}"? This cannot be undone.`)) return;
    setSaving(true);
    setError(null);
    try {
      const { error: nextError } = await supabase.from("hero_banners").delete().eq("id", openId);
      if (nextError) throw nextError;
      setSuccess("Hero banner deleted.");
      close();
      await reload();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Hero banner delete failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <AdminPageHeader eyebrow="Homepage and page heroes" title="Hero banners" subtitle="Manage premium page hero banners using the same hero_banners table and competition-images storage bucket as Vite." icon={<ImageIcon className="h-5 w-5" />} actions={<Button onClick={openCreate}><Plus className="h-4 w-4" /> New banner</Button>} />
      {error ? <div className="mb-4 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">{error}</div> : null}
      {success ? <div className="mb-4 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-primary">{success}</div> : null}

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <AdminPanel>
            <div className="flex flex-col gap-3">
              <div className="max-w-md"><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search internal name or headline" /></div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant={pageFilter === "all" ? "default" : "outline"} onClick={() => setPageFilter("all")}>All {counts.all}</Button>
                {HERO_PAGES.map((page) => <Button key={page.key} size="sm" variant={pageFilter === page.key ? "default" : "outline"} onClick={() => setPageFilter(page.key)}>{page.label} {counts[page.key] || 0}</Button>)}
              </div>
            </div>
          </AdminPanel>
          <LoadingOrError loading={loading} error={null} />
          {!loading && filtered.length === 0 ? <EmptyRows rows={filtered} label="hero banners" /> : null}
          {filtered.length ? (
            <AdminTable minWidth={980}>
              <thead className="bg-white/5 text-xs uppercase tracking-wider text-white/60"><tr><AdminTH>Preview</AdminTH><AdminTH>Banner</AdminTH><AdminTH>Location</AdminTH><AdminTH>Sort</AdminTH><AdminTH>Status</AdminTH><AdminTH align="right">Actions</AdminTH></tr></thead>
              <tbody>{filtered.map((row) => <AdminTR key={row.id}><AdminTD>{row.desktop_image_url ? <img src={row.desktop_image_url} alt="" className="h-12 w-20 rounded-lg object-cover" /> : <div className="h-12 w-20 rounded-lg border border-white/10 bg-white/5" />}</AdminTD><AdminTD><div className="font-semibold text-white">{row.internal_name}</div><div className="text-xs text-white/50">{[row.headline_before_accent, row.headline_accent, row.headline_after_accent].filter(Boolean).join(" ")}</div></AdminTD><AdminTD>{heroPageLabel(row.page_key)}</AdminTD><AdminTD>{row.sort_order ?? 0}</AdminTD><AdminTD><StatusBadge status={row.is_active ? "published" : "draft"} /></AdminTD><AdminTD align="right"><Button size="sm" variant="outline" onClick={() => openEdit(row)}>Edit</Button></AdminTD></AdminTR>)}</tbody>
            </AdminTable>
          ) : null}
        </div>
        <AdminPanel title="Image guidance" className="h-fit">
          <div className="space-y-4 text-sm text-white/70">
            <p>Upload clean product imagery only. Do not bake prices, countdowns, badges or CTA text into the image.</p>
            <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4"><p className="font-bold text-white">Desktop</p><p>Recommended: 2400 x 1200px</p><p>Minimum: 1920 x 960px</p><p>Aspect ratio: 2:1 landscape.</p></div>
            <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4"><p className="font-bold text-white">Mobile</p><p>Recommended: 1200 x 1600px</p><p>Minimum: 900 x 1200px</p><p>Aspect ratio: 3:4 or 4:5 portrait.</p></div>
          </div>
        </AdminPanel>
      </div>

      <Dialog open={openId !== null} onOpenChange={(open) => !open && close()}>
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto border-white/10 bg-[hsl(222_45%_5%)] text-white">
          <DialogHeader><DialogTitle>{creating ? "New hero banner" : "Edit hero banner"}</DialogTitle></DialogHeader>
          <div className="space-y-5">
            <HeroPreview draft={draft} />
            <AdminPanel title="Settings">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><FieldLabel label="Internal name" /><Input value={draft.internal_name} onChange={(e) => setDraft({ ...draft, internal_name: e.target.value })} /></div>
                <div className="space-y-2"><FieldLabel label="Page/location" /><select className="h-10 w-full rounded-md border border-white/10 bg-[#111827] px-3 text-sm text-white" value={draft.page_key} onChange={(e) => setDraft({ ...draft, page_key: e.target.value })}>{HERO_PAGES.map((page) => <option key={page.key} value={page.key}>{page.label}</option>)}</select></div>
                <div className="space-y-2"><FieldLabel label="Sort order" /><Input type="number" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} /></div>
                <label className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3"><input type="checkbox" checked={draft.is_active} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} /><span><span className="block text-sm font-bold text-white">Active banner</span><span className="text-xs text-white/55">Saving as active deactivates other banners for this location.</span></span></label>
                <div className="space-y-2"><FieldLabel label="Starts at" /><Input type="datetime-local" value={isoToLocal(draft.starts_at)} onChange={(e) => setDraft({ ...draft, starts_at: localToIso(e.target.value) })} /></div>
                <div className="space-y-2"><FieldLabel label="Ends at" /><Input type="datetime-local" value={isoToLocal(draft.ends_at)} onChange={(e) => setDraft({ ...draft, ends_at: localToIso(e.target.value) })} /></div>
              </div>
            </AdminPanel>
            <AdminPanel title="Copy">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2"><FieldLabel label="Eyebrow text" /><Input value={draft.eyebrow} onChange={(e) => setDraft({ ...draft, eyebrow: e.target.value })} /></div>
                <div className="space-y-2"><FieldLabel label="Headline before accent" /><Input value={draft.headline_before_accent} onChange={(e) => setDraft({ ...draft, headline_before_accent: e.target.value })} /></div>
                <div className="space-y-2"><FieldLabel label="Headline accent" /><Input value={draft.headline_accent} onChange={(e) => setDraft({ ...draft, headline_accent: e.target.value })} /></div>
                <div className="space-y-2 md:col-span-2"><FieldLabel label="Headline after accent" /><Input value={draft.headline_after_accent} onChange={(e) => setDraft({ ...draft, headline_after_accent: e.target.value })} /></div>
                <div className="space-y-2 md:col-span-2"><FieldLabel label="Body/subtext" /><Textarea value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} /></div>
                <div className="space-y-2"><FieldLabel label="Promo badge text" /><Input value={draft.promo_badge_text} onChange={(e) => setDraft({ ...draft, promo_badge_text: e.target.value })} /></div>
                <div className="space-y-2"><FieldLabel label="Promo badge style" /><select className="h-10 w-full rounded-md border border-white/10 bg-[#111827] px-3 text-sm text-white" value={draft.promo_badge_variant} onChange={(e) => setDraft({ ...draft, promo_badge_variant: e.target.value })}><option value="blue">Blue</option><option value="gold">Gold</option><option value="dark">Dark</option></select></div>
                <div className="space-y-2 md:col-span-2"><FieldLabel label="Cash alternative text" /><Input value={draft.cash_alternative_text} onChange={(e) => setDraft({ ...draft, cash_alternative_text: e.target.value })} /></div>
                <div className="space-y-2"><FieldLabel label="Primary CTA label" /><Input value={draft.primary_cta_label} onChange={(e) => setDraft({ ...draft, primary_cta_label: e.target.value })} /></div>
                <div className="space-y-2"><FieldLabel label="Primary CTA URL" /><Input value={draft.primary_cta_url} onChange={(e) => setDraft({ ...draft, primary_cta_url: e.target.value })} /></div>
                <div className="space-y-2"><FieldLabel label="Secondary CTA label" /><Input value={draft.secondary_cta_label} onChange={(e) => setDraft({ ...draft, secondary_cta_label: e.target.value })} /></div>
                <div className="space-y-2"><FieldLabel label="Secondary CTA URL" /><Input value={draft.secondary_cta_url} onChange={(e) => setDraft({ ...draft, secondary_cta_url: e.target.value })} /></div>
                <div className="space-y-2 md:col-span-2"><FieldLabel label="Trust chips" help="One chip per line. Stored as a JSON array." /><Textarea value={draft.trust_chips} onChange={(e) => setDraft({ ...draft, trust_chips: e.target.value })} /></div>
              </div>
            </AdminPanel>
            <AdminPanel title="Images">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><FieldLabel label="Desktop image URL" /><Input value={draft.desktop_image_url} onChange={(e) => setDraft({ ...draft, desktop_image_url: e.target.value })} /><AdminImageUploader folder={`hero-banners/${draft.page_key}/desktop`} multiple={false} compact onUploaded={(files) => setDraft({ ...draft, desktop_image_url: files[0]?.url ?? draft.desktop_image_url })} onSuccess={setSuccess} onError={setError} hint="Recommended 2400 x 1200px - no baked-in text" /></div>
                <div className="space-y-2"><FieldLabel label="Mobile image URL" /><Input value={draft.mobile_image_url} onChange={(e) => setDraft({ ...draft, mobile_image_url: e.target.value })} /><AdminImageUploader folder={`hero-banners/${draft.page_key}/mobile`} multiple={false} compact onUploaded={(files) => setDraft({ ...draft, mobile_image_url: files[0]?.url ?? draft.mobile_image_url })} onSuccess={setSuccess} onError={setError} hint="Recommended 1200 x 1600px - optional" /></div>
                <div className="space-y-2 md:col-span-2"><FieldLabel label="Image alt text" /><Input value={draft.image_alt} onChange={(e) => setDraft({ ...draft, image_alt: e.target.value })} /></div>
                <div className="space-y-2"><FieldLabel label="Desktop image position" /><select className="h-10 w-full rounded-md border border-white/10 bg-[#111827] px-3 text-sm text-white" value={draft.image_position_desktop} onChange={(e) => setDraft({ ...draft, image_position_desktop: e.target.value })}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></div>
                <div className="space-y-2"><FieldLabel label="Mobile image position" /><select className="h-10 w-full rounded-md border border-white/10 bg-[#111827] px-3 text-sm text-white" value={draft.image_position_mobile} onChange={(e) => setDraft({ ...draft, image_position_mobile: e.target.value })}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></div>
                <div className="space-y-2"><FieldLabel label="Overlay strength" /><select className="h-10 w-full rounded-md border border-white/10 bg-[#111827] px-3 text-sm text-white" value={draft.overlay_strength} onChange={(e) => setDraft({ ...draft, overlay_strength: e.target.value })}><option value="light">Light</option><option value="medium">Medium</option><option value="strong">Strong</option></select></div>
              </div>
            </AdminPanel>
          </div>
          <DialogFooter className="sticky bottom-0 -mx-6 -mb-6 mt-4 border-t border-white/10 bg-[hsl(222_45%_5%/0.95)] p-4">
            {!creating ? <Button type="button" variant="outline" className="border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/15 hover:text-destructive" disabled={saving} onClick={destroy}><Trash2 className="h-4 w-4" /> Delete banner</Button> : null}
            <Button type="button" variant="outline" onClick={close}>Cancel</Button>
            <Button type="button" disabled={saving} onClick={save}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save banner</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CustomersPage() {
  const supabase = createSupabaseBrowserClient();
  const [rows, setRows] = useState<Row[]>([]);
  const [wallets, setWallets] = useState<Record<string, Row>>({});
  const [selected, setSelected] = useState<Row | null>(null);
  const [detail, setDetail] = useState<{ payments: Row[]; entries: Row[]; txns: Row[]; winners: Row[] } | null>(null);
  const [grantFor, setGrantFor] = useState<Row | null>(null);
  const [adjustFor, setAdjustFor] = useState<Row | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [expiry, setExpiry] = useState("");
  const [adjustType, setAdjustType] = useState<"add" | "remove">("add");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    let query = supabase.from("profiles").select("id,email,full_name,phone,date_of_birth,address_line_1,address_line_2,town_city,county,postcode,country,marketing_consent,verification_status,created_at,updated_at").order("created_at", { ascending: false }).limit(200);
    if (q.trim()) {
      const term = q.trim();
      query = query.or(`email.ilike.%${term}%,full_name.ilike.%${term}%,phone.ilike.%${term}%,postcode.ilike.%${term}%`);
    }
    const { data, error: nextError } = await query;
    const list = (data as Row[]) ?? [];
    setRows(list);
    if (nextError) setError(nextError.message);
    const ids = list.map((row) => row.id);
    if (ids.length) {
      const { data: walletRows } = await supabase.from("wallets").select("user_id,balance,lifetime_earned,lifetime_spent").in("user_id", ids);
      const map: Record<string, Row> = {};
      for (const wallet of ((walletRows as Row[]) ?? [])) map[wallet.user_id] = wallet;
      setWallets(map);
    }
    setLoading(false);
  }, [q, supabase]);

  useEffect(() => { load(); }, [load]);

  async function openCustomer(row: Row) {
    if (!supabase) return;
    setSelected(row);
    setDetail(null);
    const [payments, entries, txns, winners] = await Promise.all([
      supabase.from("payments").select("id,amount,status,refund_status,refunded_amount,created_at,is_multiline").eq("user_id", row.id).order("created_at", { ascending: false }).limit(25),
      supabase.from("entries").select("id,ticket_number,status,entry_type,created_at,competition_id,archived_at,is_winner").eq("user_id", row.id).order("created_at", { ascending: false }).limit(25),
      supabase.from("wallet_transactions").select("id,delta,balance_after,kind,note,created_at,created_by,reference_type").eq("user_id", row.id).order("created_at", { ascending: false }).limit(25),
      supabase.from("winners").select("id,competition_id,prize_title,is_published,draw_date").eq("user_id", row.id).order("draw_date", { ascending: false }).limit(10),
    ]);
    setDetail({ payments: (payments.data as Row[]) ?? [], entries: (entries.data as Row[]) ?? [], txns: (txns.data as Row[]) ?? [], winners: (winners.data as Row[]) ?? [] });
  }

  async function invokeCustomerFunction(name: string, body: Row) {
    if (!supabase) throw new Error("Supabase client is not configured.");
    const { data, error: nextError } = await supabase.functions.invoke(name, { body });
    if (nextError) throw new Error(nextError.message);
    if ((data as Row)?.error) throw new Error(String((data as Row).error));
  }

  async function grantCredit() {
    if (!grantFor) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) return setError("Amount required.");
    if (!reason.trim()) return setError("Reason required.");
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await invokeCustomerFunction("admin-grant-credit", { user_id: grantFor.id, amount: amt, reason: reason.trim(), expires_at: expiry || null });
      setSuccess(`Granted ${formatMoney(amt)} to ${grantFor.email}.`);
      setGrantFor(null); setAmount(""); setReason(""); setExpiry("");
      await load();
      if (selected?.id === grantFor.id) await openCustomer(grantFor);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Grant credit failed.");
    } finally {
      setBusy(false);
    }
  }

  async function adjustWallet() {
    if (!adjustFor) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) return setError("Amount required.");
    if (!reason.trim()) return setError("Reason required.");
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await invokeCustomerFunction("admin-adjust-wallet", { user_id: adjustFor.id, amount: amt, adjustment_type: adjustType, reason: reason.trim() });
      setSuccess(`${adjustType === "add" ? "Added" : "Removed"} ${formatMoney(amt)} ${adjustType === "add" ? "to" : "from"} ${adjustFor.email}.`);
      setAdjustFor(null); setAmount(""); setReason(""); setAdjustType("add");
      await load();
      if (selected?.id === adjustFor.id) await openCustomer(adjustFor);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Wallet adjustment failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <AdminPageHeader eyebrow="People" title="Customers" subtitle="Search, inspect and manage customers, including wallet grant/adjust actions through existing Edge Functions." icon={<Users className="h-5 w-5" />} />
      {error ? <div className="mb-4 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">{error}</div> : null}
      {success ? <div className="mb-4 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-primary">{success}</div> : null}
      <div className="mb-4 flex gap-2"><Input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} placeholder="Search email, name, phone, postcode" className="max-w-xl" /><Button onClick={load}>Search</Button></div>
      <LoadingOrError loading={loading} error={null} />
      {rows.length ? <AdminTable minWidth={1000}><thead className="bg-white/5 text-xs uppercase tracking-wider text-white/60"><tr><AdminTH>Customer</AdminTH><AdminTH>Contact</AdminTH><AdminTH>Verification</AdminTH><AdminTH align="right">Wallet</AdminTH><AdminTH>Joined</AdminTH><AdminTH align="right">Actions</AdminTH></tr></thead><tbody>{rows.map((row) => <AdminTR key={row.id}><AdminTD><div className="font-semibold text-white">{row.full_name || "Unnamed"}</div><div className="text-xs text-white/50">{row.email || "-"}</div></AdminTD><AdminTD>{row.phone || "-"}<div className="text-xs text-white/50">{row.postcode || ""}</div></AdminTD><AdminTD><StatusBadge status={row.verification_status || "pending"} /></AdminTD><AdminTD align="right">{formatMoney(Number(wallets[row.id]?.balance || 0))}</AdminTD><AdminTD>{fmtDate(row.created_at)}</AdminTD><AdminTD align="right"><div className="flex justify-end gap-2"><Button size="sm" onClick={() => openCustomer(row)}>View</Button><Button size="sm" variant="outline" onClick={() => { setGrantFor(row); setAmount(""); setReason(""); }}>Credit</Button></div></AdminTD></AdminTR>)}</tbody></AdminTable> : !loading ? <EmptyRows rows={rows} label="customers" /> : null}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto border-white/10 bg-[hsl(222_45%_5%)] text-white">
          {selected ? <><DialogHeader><DialogTitle>{selected.full_name || selected.email || "Customer"}</DialogTitle></DialogHeader><div className="space-y-5"><AdminPanel title="Profile"><div className="grid gap-2 text-sm md:grid-cols-2"><div>Email: {selected.email || "-"}</div><div>Phone: {selected.phone || "-"}</div><div>DOB: {selected.date_of_birth ? fmtDate(selected.date_of_birth) : "-"}</div><div>Postcode: {selected.postcode || "-"}</div><div className="md:col-span-2">Address: {[selected.address_line_1, selected.address_line_2, selected.town_city, selected.county, selected.postcode, selected.country].filter(Boolean).join(", ") || "-"}</div></div></AdminPanel><AdminPanel title="Wallet" actions={<><Button size="sm" onClick={() => { setGrantFor(selected); setAmount(""); setReason(""); }}>Grant credit</Button><Button size="sm" variant="outline" onClick={() => { setAdjustFor(selected); setAmount(""); setReason(""); }}>Adjust balance</Button></>}><div className="grid gap-2 text-sm md:grid-cols-3"><div>Balance: <strong>{formatMoney(Number(wallets[selected.id]?.balance || 0))}</strong></div><div>Earned: {formatMoney(Number(wallets[selected.id]?.lifetime_earned || 0))}</div><div>Spent: {formatMoney(Number(wallets[selected.id]?.lifetime_spent || 0))}</div></div></AdminPanel><AdminPanel title="Recent entries">{detail?.entries?.length ? <ul className="space-y-1 text-sm">{detail.entries.map((entry) => <li key={entry.id} className="flex justify-between rounded bg-white/[0.03] px-3 py-2"><span>#{entry.ticket_number} {entry.entry_type}</span><StatusBadge status={entry.status} /></li>)}</ul> : <p className="text-sm text-white/55">No entries.</p>}</AdminPanel><AdminPanel title="Recent payments">{detail?.payments?.length ? <ul className="space-y-1 text-sm">{detail.payments.map((payment) => <li key={payment.id} className="flex justify-between rounded bg-white/[0.03] px-3 py-2"><span>{shortId(payment.id)} · {payment.status}</span><span>{formatMoney(Number(payment.amount || 0))}</span></li>)}</ul> : <p className="text-sm text-white/55">No payments.</p>}</AdminPanel><AdminPanel title="Wallet activity">{detail?.txns?.length ? <ul className="space-y-1 text-sm">{detail.txns.map((txn) => <li key={txn.id} className="flex justify-between rounded bg-white/[0.03] px-3 py-2"><span>{txn.kind}{txn.note ? ` · ${txn.note}` : ""}</span><span>{Number(txn.delta) < 0 ? "-" : "+"}{formatMoney(Math.abs(Number(txn.delta || 0)))}</span></li>)}</ul> : <p className="text-sm text-white/55">No wallet activity.</p>}</AdminPanel></div></> : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!grantFor} onOpenChange={(open) => !open && setGrantFor(null)}>
        <DialogContent className="border-white/10 bg-[hsl(222_45%_5%)] text-white"><DialogHeader><DialogTitle>Grant wallet credit</DialogTitle></DialogHeader><div className="space-y-3"><p className="text-sm text-white/70">Granting to <strong>{grantFor?.email}</strong></p><Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" /><Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" /><Input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} /></div><DialogFooter><Button variant="outline" onClick={() => setGrantFor(null)}>Cancel</Button><Button onClick={grantCredit} disabled={busy}>Grant credit</Button></DialogFooter></DialogContent>
      </Dialog>
      <Dialog open={!!adjustFor} onOpenChange={(open) => !open && setAdjustFor(null)}>
        <DialogContent className="border-white/10 bg-[hsl(222_45%_5%)] text-white"><DialogHeader><DialogTitle>Adjust wallet balance</DialogTitle></DialogHeader><div className="space-y-3"><p className="text-sm text-white/70">Adjusting <strong>{adjustFor?.email}</strong></p><div className="flex gap-2"><Button variant={adjustType === "add" ? "default" : "outline"} onClick={() => setAdjustType("add")}><Plus className="h-4 w-4" /> Add</Button><Button variant={adjustType === "remove" ? "default" : "outline"} onClick={() => setAdjustType("remove")}><Minus className="h-4 w-4" /> Remove</Button></div><Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" /><Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" /></div><DialogFooter><Button variant="outline" onClick={() => setAdjustFor(null)}>Cancel</Button><Button onClick={adjustWallet} disabled={busy}>Save adjustment</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
}

function EntriesPage() {
  const supabase = createSupabaseBrowserClient();
  const [rows, setRows] = useState<Row[]>([]);
  const [competitions, setCompetitions] = useState<Record<string, Row>>({});
  const [profiles, setProfiles] = useState<Record<string, Row>>({});
  const [actionTarget, setActionTarget] = useState<{ row: Row; action: "void" | "archive" | "unarchive" | "delete" } | null>(null);
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [refundMode, setRefundMode] = useState<"void" | "wallet" | "manual">("void");
  const [refundAmount, setRefundAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error: nextError } = await supabase.from("entries").select("id,ticket_number,entry_type,status,is_winner,created_at,user_id,competition_id,payment_id,voided_at,void_reason,archived_at,archive_reason").order("created_at", { ascending: false }).limit(200);
    const list = (data as Row[]) ?? [];
    setRows(list);
    if (nextError) setError(nextError.message);
    const compIds = Array.from(new Set(list.map((row) => row.competition_id).filter(Boolean)));
    const userIds = Array.from(new Set(list.map((row) => row.user_id).filter(Boolean)));
    if (compIds.length) {
      const { data: comps } = await supabase.from("competitions").select("id,title,slug,status").in("id", compIds);
      const map: Record<string, Row> = {};
      for (const comp of ((comps as Row[]) ?? [])) map[comp.id] = comp;
      setCompetitions(map);
    }
    if (userIds.length) {
      const { data: profs } = await supabase.from("profiles").select("id,email,full_name").in("id", userIds);
      const map: Record<string, Row> = {};
      for (const profile of ((profs as Row[]) ?? [])) map[profile.id] = profile;
      setProfiles(map);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  async function invokeEntryFunction(name: string, body: Row) {
    if (!supabase) throw new Error("Supabase client is not configured.");
    const { data, error: nextError } = await supabase.functions.invoke(name, { body });
    if (nextError) throw new Error(nextError.message);
    if ((data as Row)?.error) throw new Error(String((data as Row).error));
    return data as Row;
  }

  async function submitEntryAction() {
    if (!actionTarget || busy) return;
    if (actionTarget.action !== "unarchive" && !reason.trim()) {
      setError("Reason is required.");
      return;
    }
    if (actionTarget.action === "delete" && confirmText !== "DELETE ENTRY") {
      setError("Type DELETE ENTRY to confirm.");
      return;
    }
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      if (actionTarget.action === "void") {
        const needsAmount = refundMode === "wallet" || refundMode === "manual";
        if (needsAmount && (!Number(refundAmount) || Number(refundAmount) <= 0)) throw new Error("Refund amount must be positive.");
        const fn = refundMode === "void" ? "admin-void-entry" : "admin-void-entry-with-refund";
        const body = refundMode === "void" ? { entry_id: actionTarget.row.id, reason: reason.trim() } : { entry_id: actionTarget.row.id, reason: reason.trim(), mode: refundMode, amount: Number(refundAmount) };
        await invokeEntryFunction(fn, body);
        setSuccess(`Entry #${actionTarget.row.ticket_number} voided.`);
      } else if (actionTarget.action === "archive") {
        await invokeEntryFunction("admin-archive-entry", { entry_id: actionTarget.row.id, action: "archive", reason: reason.trim() });
        setSuccess(`Entry #${actionTarget.row.ticket_number} archived.`);
      } else if (actionTarget.action === "unarchive") {
        await invokeEntryFunction("admin-archive-entry", { entry_id: actionTarget.row.id, action: "unarchive" });
        setSuccess(`Entry #${actionTarget.row.ticket_number} unarchived.`);
      } else {
        await invokeEntryFunction("admin-delete-entry", { entry_id: actionTarget.row.id, reason: reason.trim(), confirm: "DELETE ENTRY" });
        setSuccess(`Entry #${actionTarget.row.ticket_number} deleted.`);
      }
      setActionTarget(null); setReason(""); setConfirmText(""); setRefundMode("void"); setRefundAmount("");
      await load();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Entry action failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <AdminPageHeader eyebrow="Operations" title="Entries" subtitle="Manage entries through the same Vite Edge Functions for void/refund/archive/delete." icon={<Users className="h-5 w-5" />} />
      {error ? <div className="mb-4 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">{error}</div> : null}
      {success ? <div className="mb-4 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-primary">{success}</div> : null}
      <LoadingOrError loading={loading} error={null} />
      {rows.length ? <AdminTable minWidth={1200}><thead className="bg-white/5 text-xs uppercase tracking-wider text-white/60"><tr><AdminTH>Ticket</AdminTH><AdminTH>Competition</AdminTH><AdminTH>Customer</AdminTH><AdminTH>Type</AdminTH><AdminTH>Status</AdminTH><AdminTH>Created</AdminTH><AdminTH align="right">Actions</AdminTH></tr></thead><tbody>{rows.map((row) => <AdminTR key={row.id}><AdminTD className="font-mono font-bold">#{row.ticket_number}</AdminTD><AdminTD>{row.competition_id ? competitions[row.competition_id]?.title || shortId(row.competition_id) : "-"}</AdminTD><AdminTD>{row.user_id ? profiles[row.user_id]?.email || shortId(row.user_id) : "-"}</AdminTD><AdminTD>{row.entry_type}</AdminTD><AdminTD><div className="flex flex-wrap gap-1"><StatusBadge status={row.status} />{row.archived_at ? <StatusBadge status="archived" /> : null}{row.is_winner ? <StatusBadge status="published" /> : null}</div></AdminTD><AdminTD>{fmtDateTime(row.created_at)}</AdminTD><AdminTD align="right"><div className="flex justify-end gap-1">{row.status === "valid" && !row.archived_at ? <Button size="sm" variant="outline" onClick={() => setActionTarget({ row, action: "void" })}>Void</Button> : null}{row.archived_at ? <Button size="sm" variant="outline" onClick={() => setActionTarget({ row, action: "unarchive" })}><ArchiveRestore className="h-3.5 w-3.5" /></Button> : <Button size="sm" variant="outline" onClick={() => setActionTarget({ row, action: "archive" })}><Archive className="h-3.5 w-3.5" /></Button>}<Button size="sm" variant="outline" className="text-destructive" onClick={() => setActionTarget({ row, action: "delete" })}><Trash2 className="h-3.5 w-3.5" /></Button></div></AdminTD></AdminTR>)}</tbody></AdminTable> : !loading ? <EmptyRows rows={rows} label="entries" /> : null}

      <Dialog open={!!actionTarget} onOpenChange={(open) => !open && setActionTarget(null)}>
        <DialogContent className="border-white/10 bg-[hsl(222_45%_5%)] text-white">
          <DialogHeader><DialogTitle>{actionTarget ? `${actionTarget.action} entry #${actionTarget.row.ticket_number}` : "Entry action"}</DialogTitle></DialogHeader>
          {actionTarget ? <div className="space-y-3">{actionTarget.action === "void" ? <div className="space-y-2"><FieldLabel label="Void mode" /><select className="h-10 w-full rounded-md border border-white/10 bg-[#111827] px-3 text-sm text-white" value={refundMode} onChange={(e) => setRefundMode(e.target.value as any)}><option value="void">Void only</option><option value="wallet">Void and refund to wallet</option><option value="manual">Void and record manual refund</option></select>{refundMode !== "void" ? <Input type="number" step="0.01" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} placeholder="Refund amount" /> : null}</div> : null}{actionTarget.action !== "unarchive" ? <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" /> : null}{actionTarget.action === "delete" ? <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="Type DELETE ENTRY" /> : null}</div> : null}
          <DialogFooter><Button variant="outline" onClick={() => setActionTarget(null)}>Cancel</Button><Button onClick={submitEntryAction} disabled={busy}>{busy ? "Working..." : "Confirm"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PaymentsPage({ title }: { title: string }) {
  const supabase = createSupabaseBrowserClient();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [refundOpen, setRefundOpen] = useState<Row | null>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundDest, setRefundDest] = useState<"wallet" | "original">("wallet");
  const [refundVoid, setRefundVoid] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    const { data, error: nextError } = await supabase.from("payments").select("id,user_id,competition_id,amount,quantity,status,refund_status,refunded_amount,refund_destination,created_at,is_multiline,subtotal_amount,discount_amount,wallet_amount_used,pricing_snapshot").order("created_at", { ascending: false }).limit(200);
    setRows((data as Row[]) ?? []);
    setError(nextError?.message ?? null);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  async function cancelPayment(id: string) {
    if (!supabase || busy) return;
    if (!window.confirm("Cancel this pending payment? No tickets will be issued.")) return;
    setBusy(id);
    setError(null);
    setSuccess(null);
    const { error: nextError } = await supabase.functions.invoke("admin-cancel-payment", { body: { payment_id: id } });
    setBusy(null);
    if (nextError) setError(nextError.message || "Payment cancel function failed.");
    else {
      setSuccess("Payment cancelled.");
      await load();
    }
  }

  function openRefund(row: Row) {
    setRefundOpen(row);
    setRefundAmount((Number(row.amount || 0) - Number(row.refunded_amount || 0)).toFixed(2));
    setRefundReason("");
    setRefundDest("wallet");
    setRefundVoid(true);
  }

  async function submitRefund() {
    if (!supabase || !refundOpen || busy) return;
    const amount = Number(refundAmount);
    if (!amount || amount <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    if (!refundReason.trim()) {
      setError("Reason is required.");
      return;
    }
    setBusy(refundOpen.id);
    setError(null);
    setSuccess(null);
    const { data, error: nextError } = await supabase.functions.invoke("admin-refund-payment", {
      body: { payment_id: refundOpen.id, amount, reason: refundReason.trim(), destination: refundDest, void_entries: refundVoid },
    });
    setBusy(null);
    if (nextError) {
      setError(nextError.message || "Refund function failed.");
      return;
    }
    if ((data as Row)?.error) {
      setError(String((data as Row).error));
      return;
    }
    setSuccess(`Refund processed (${refundDest === "wallet" ? "to wallet" : "to original payment"}).`);
    setRefundOpen(null);
    await load();
  }

  return (
    <div>
      <AdminPageHeader eyebrow="Finance" title={title} subtitle="Cancel pending checkouts and refund succeeded payments through the same Vite Edge Functions." icon={<CreditCard className="h-5 w-5" />} />
      {error ? <div className="mb-4 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">{error}</div> : null}
      {success ? <div className="mb-4 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-primary">{success}</div> : null}
      <LoadingOrError loading={loading} error={null} />
      {rows.length ? (
        <AdminTable minWidth={1080}>
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-white/60"><tr><AdminTH>ID</AdminTH><AdminTH>Status</AdminTH><AdminTH>User</AdminTH><AdminTH align="right">Amount</AdminTH><AdminTH align="right">Refunded</AdminTH><AdminTH>Wallet</AdminTH><AdminTH>Date</AdminTH><AdminTH align="right">Actions</AdminTH></tr></thead>
          <tbody>{rows.map((row) => {
            const remaining = Number(row.amount || 0) - Number(row.refunded_amount || 0);
            return <AdminTR key={row.id}><AdminTD><span className="font-mono text-xs">{shortId(row.id)}</span></AdminTD><AdminTD><StatusBadge status={row.status || "pending"} />{row.refund_status && row.refund_status !== "none" ? <div className="mt-1"><StatusBadge status={row.refund_status === "full" ? "refunded" : row.refund_status} /></div> : null}</AdminTD><AdminTD><span className="font-mono text-xs">{shortId(row.user_id)}</span></AdminTD><AdminTD align="right">{formatMoney(Number(row.amount || 0))}</AdminTD><AdminTD align="right">{Number(row.refunded_amount || 0) > 0 ? formatMoney(Number(row.refunded_amount || 0)) : "-"}</AdminTD><AdminTD>{Number(row.wallet_amount_used || 0) > 0 ? formatMoney(Number(row.wallet_amount_used || 0)) : "-"}</AdminTD><AdminTD>{fmtDateTime(row.created_at)}</AdminTD><AdminTD align="right"><div className="flex justify-end gap-2">{row.status === "pending" ? <Button size="sm" variant="outline" disabled={busy === row.id} onClick={() => cancelPayment(row.id)}><X className="h-4 w-4" /> Cancel</Button> : null}{row.status === "succeeded" && row.refund_status !== "full" && remaining > 0 ? <Button size="sm" variant="outline" disabled={busy === row.id} onClick={() => openRefund(row)}><RotateCcw className="h-4 w-4" /> Refund</Button> : null}</div></AdminTD></AdminTR>;
          })}</tbody>
        </AdminTable>
      ) : !loading ? <EmptyRows rows={rows} label={title.toLowerCase()} /> : null}

      <Dialog open={!!refundOpen} onOpenChange={(open) => !open && setRefundOpen(null)}>
        <DialogContent className="border-white/10 bg-[hsl(222_45%_5%)] text-white">
          <DialogHeader><DialogTitle>Refund payment</DialogTitle></DialogHeader>
          {refundOpen ? <div className="space-y-3 text-sm"><div>Original amount: <span className="font-mono font-bold">{formatMoney(Number(refundOpen.amount || 0))}</span></div><div className="space-y-1"><FieldLabel label="Amount" /><Input type="number" step="0.01" min="0" max={refundOpen.amount} value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} /></div><div className="space-y-2"><FieldLabel label="Refund destination" /><label className="mr-4 inline-flex items-center gap-2"><input type="radio" checked={refundDest === "wallet"} onChange={() => setRefundDest("wallet")} /> Wallet credit</label><label className="inline-flex items-center gap-2"><input type="radio" checked={refundDest === "original"} onChange={() => setRefundDest("original")} /> Original payment method</label>{refundDest === "original" ? <p className="text-xs text-white/50">Vite notes this marks the payment refunded in DB; provider refund handling remains in the existing function/provider flow.</p> : null}</div><div className="space-y-1"><FieldLabel label="Reason" /><Input value={refundReason} onChange={(e) => setRefundReason(e.target.value)} /></div><label className="inline-flex items-center gap-2"><input type="checkbox" checked={refundVoid} onChange={(e) => setRefundVoid(e.target.checked)} /> Also void linked entries</label></div> : null}
          <DialogFooter><Button variant="outline" onClick={() => setRefundOpen(null)}>Cancel</Button><Button onClick={submitRefund} disabled={!!busy}>Process refund</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DrawsPage() {
  const supabase = createSupabaseBrowserClient();
  const [rows, setRows] = useState<Row[]>([]);
  const [validCounts, setValidCounts] = useState<Record<string, number>>({});
  const [selectedId, setSelectedId] = useState("");
  const [proof, setProof] = useState("");
  const [result, setResult] = useState<Row | null>(null);
  const [downloadJson, setDownloadJson] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState("draw-record.json");
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    const { data, error: nextError } = await supabase.from("competitions").select("id,title,slug,current_entries,status,closes_at,draw_at").in("status", ["closed", "sold_out", "live"]).order("closes_at");
    const list = (data as Row[]) ?? [];
    setRows(list);
    if (nextError) setError(nextError.message);
    const ids = list.map((row) => row.id).filter(Boolean);
    if (ids.length) {
      const { data: entries, error: entryError } = await supabase.from("entries").select("competition_id").in("competition_id", ids).eq("status", "valid").is("archived_at", null);
      if (entryError) setError(entryError.message);
      const counts: Record<string, number> = {};
      for (const entry of ((entries as Row[]) ?? [])) counts[entry.competition_id] = (counts[entry.competition_id] ?? 0) + 1;
      setValidCounts(counts);
    } else {
      setValidCounts({});
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setResult(null); setDownloadJson(null); setProof(""); }, [selectedId]);

  const selected = rows.find((row) => row.id === selectedId);
  const ready = !!selected && ["closed", "sold_out"].includes(selected.status);
  const validForSelected = selected ? validCounts[selected.id] ?? 0 : 0;

  async function runDraw() {
    if (!supabase || !selected || !ready || running) return;
    if (validForSelected === 0) {
      setError("No valid entries in pool, cannot draw.");
      return;
    }
    if (!window.confirm(`Run the server-side draw for "${selected.title}"? This writes the draw and unpublished winner records.`)) return;
    setRunning(true);
    setError(null);
    setSuccess(null);
    try {
      const { data, error: nextError } = await supabase.rpc("perform_competition_draw", {
        p_competition_id: selected.id,
        p_draw_method: "Server-side cryptographic draw",
        p_draw_proof_url: proof || null,
      });
      if (nextError) throw nextError;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) throw new Error("Draw returned no result.");
      const wrapped = JSON.stringify({ record: row.proof_json, record_sha256: row.proof_sha256 }, null, 2);
      const slug = (selected.slug || selected.id).toString().replace(/[^a-z0-9-]/gi, "-");
      setResult(row as Row);
      setDownloadJson(wrapped);
      setDownloadFilename(`draw-record-${slug}-${String(row.drawn_at).replace(/[:.]/g, "-")}.json`);
      setSuccess("Draw recorded server-side. Review and publish the winner from Winners.");
      await load();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Draw failed.");
    } finally {
      setRunning(false);
    }
  }

  function downloadProof() {
    if (!downloadJson) return;
    const blob = new Blob([downloadJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadFilename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div>
      <AdminPageHeader eyebrow="Operations" title="Draws" subtitle="Run the same server-side perform_competition_draw RPC used by Vite. No client-side draw algorithm is implemented." icon={<Gavel className="h-5 w-5" />} />
      {error ? <div className="mb-4 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">{error}</div> : null}
      {success ? <div className="mb-4 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-primary">{success}</div> : null}
      <AdminTable minWidth={900}>
        <thead className="bg-white/5 text-xs uppercase tracking-wider text-white/60"><tr><AdminTH>Competition</AdminTH><AdminTH>Status</AdminTH><AdminTH>Entries</AdminTH><AdminTH>Closes</AdminTH><AdminTH>Ready</AdminTH></tr></thead>
        <tbody>
          {rows.map((row) => {
            const valid = validCounts[row.id] ?? 0;
            const drift = valid !== Number(row.current_entries || 0);
            const isReady = ["closed", "sold_out"].includes(row.status);
            return <AdminTR key={row.id}><AdminTD><button type="button" className="text-left font-semibold text-white hover:text-primary" onClick={() => setSelectedId(row.id)}>{row.title}</button></AdminTD><AdminTD><StatusBadge status={row.status} /></AdminTD><AdminTD><div className="font-mono-num">{valid} valid</div>{drift ? <div className="text-xs text-warning">Counter drift: current_entries={row.current_entries ?? 0}</div> : null}</AdminTD><AdminTD>{fmtDate(row.closes_at)}</AdminTD><AdminTD>{isReady ? <span className="text-sm font-bold text-success">Ready</span> : <span className="text-sm text-white/50">Close first</span>}</AdminTD></AdminTR>;
          })}
          {!loading && rows.length === 0 ? <tr><td colSpan={5} className="p-5 text-center text-sm text-white/55">No competitions to draw.</td></tr> : null}
        </tbody>
      </AdminTable>
      <AdminPanel title="Run draw" className="mt-5 max-w-2xl">
        {!selected ? <p className="text-sm text-white/60">Select a competition above.</p> : (
          <div className="space-y-4">
            <div className="text-sm text-white/70">Drawing for <strong className="text-white">{selected.title}</strong> with {validForSelected} valid entries.</div>
            {!ready ? <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">This competition is still live. Close it before drawing a winner.</div> : null}
            <div className="space-y-2"><FieldLabel label="Draw proof URL" help="Optional, link to stored proof JSON or spin recording. Saved alongside the draw." /><Input value={proof} onChange={(e) => setProof(e.target.value)} placeholder="https://..." /></div>
            <Button onClick={runDraw} disabled={running || !ready || validForSelected === 0}>{running ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Run draw</Button>
            {result ? <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-white/80"><div className="font-bold text-primary">Draw recorded</div><div>Winning ticket: <span className="font-mono">#{result.winning_ticket_number}</span></div><div>Eligible entries: {result.eligible_count}</div><div className="break-all text-xs">SHA-256: {result.proof_sha256}</div><Button type="button" size="sm" variant="outline" className="mt-3" onClick={downloadProof}><Download className="h-4 w-4" /> Download proof JSON</Button></div> : null}
          </div>
        )}
      </AdminPanel>
    </div>
  );
}

function WinnersPage() {
  const supabase = createSupabaseBrowserClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [drawByComp, setDrawByComp] = useState<Record<string, Row>>({});
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    const { data, error: nextError } = await supabase.from("winners").select("*,competition:competitions(title)").order("draw_date", { ascending: false });
    const list = (data as Row[]) ?? [];
    setRows(list);
    if (nextError) setError(nextError.message);
    const compIds = Array.from(new Set(list.map((winner) => winner.competition_id).filter(Boolean)));
    if (compIds.length) {
      const { data: draws, error: drawError } = await supabase.from("draws").select("id,competition_id,winning_ticket_number,proof_json,proof_sha256,draw_proof_url,drawn_at").in("competition_id", compIds).order("drawn_at", { ascending: false });
      if (drawError) setError(drawError.message);
      const map: Record<string, Row> = {};
      for (const draw of ((draws as Row[]) ?? [])) if (!map[draw.competition_id]) map[draw.competition_id] = draw;
      setDrawByComp(map);
    } else {
      setDrawByComp({});
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const selected = rows.find((row) => row.id === selectedId) || null;
  const selectedDraw = selected ? drawByComp[selected.competition_id] : null;
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((winner) => {
      const claim = winner.claim_status || "unclaimed";
      if (filter === "published" && !winner.is_published) return false;
      if (filter === "unpublished" && winner.is_published) return false;
      if (filter === "awaiting" && !["unclaimed", "claim_started"].includes(claim)) return false;
      if (["claim_submitted", "verified", "dispatched", "delivered"].includes(filter) && claim !== filter) return false;
      if (q && !`${winner.competition?.title || ""} ${winner.display_name || ""} ${winner.winning_ticket_number || ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [filter, rows, search]);

  async function updateWinner(id: string, patch: Row, message = "Saved.") {
    if (!supabase) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    const { error: nextError } = await supabase.from("winners").update(patch).eq("id", id);
    setBusy(false);
    if (nextError) setError(nextError.message);
    else {
      setSuccess(message);
      await load();
    }
  }

  function downloadProof(draw: Row | null) {
    if (!draw?.proof_json) {
      setError("Proof JSON not found.");
      return;
    }
    const blob = new Blob([JSON.stringify({ record: draw.proof_json, record_sha256: draw.proof_sha256 }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `topdraw-proof-${draw.id}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function uploadProof(file: File) {
    if (!supabase || !selected) return;
    if (!(file.type === "application/json" || /\.json$/i.test(file.name))) {
      setError("Upload a .json file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Proof file too large (max 2 MB).");
      return;
    }
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const path = `${selected.competition_id}/${selected.id}-proof.json`;
      const { error: uploadError } = await supabase.storage.from("draw-proofs").upload(path, file, { contentType: "application/json", upsert: true });
      if (uploadError) throw uploadError;
      const { error: winnerError } = await supabase.from("winners").update({ proof_url: path }).eq("id", selected.id);
      if (winnerError) throw winnerError;
      if (selectedDraw && !selectedDraw.draw_proof_url) {
        const { error: drawError } = await supabase.from("draws").update({ draw_proof_url: path }).eq("id", selectedDraw.id);
        if (drawError) throw drawError;
      }
      setSuccess("Proof attached.");
      await load();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Proof upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function openProof(pathOrUrl: string) {
    if (!supabase) return;
    if (/^https?:\/\//i.test(pathOrUrl)) {
      window.open(pathOrUrl, "_blank", "noopener");
      return;
    }
    const { data, error: nextError } = await supabase.storage.from("draw-proofs").createSignedUrl(pathOrUrl, 60);
    if (nextError || !data?.signedUrl) setError(nextError?.message || "Could not open proof file.");
    else window.open(data.signedUrl, "_blank", "noopener");
  }

  async function copyHash(hash: string) {
    try {
      await navigator.clipboard.writeText(hash);
      setSuccess("SHA-256 copied.");
    } catch {
      setError("Copy failed.");
    }
  }

  return (
    <div>
      <AdminPageHeader eyebrow="Operations" title="Winners" subtitle="Manage winner display, publication, proof files and prize claim state with the same winners/draws fields as Vite." icon={<Award className="h-5 w-5" />} />
      {error ? <div className="mb-4 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">{error}</div> : null}
      {success ? <div className="mb-4 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-primary">{success}</div> : null}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="max-w-md flex-1"><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search prize, winner or ticket #" /></div>
        <div className="flex flex-wrap gap-2">{["all", "published", "unpublished", "awaiting", "claim_submitted", "verified", "dispatched", "delivered"].map((key) => <Button key={key} size="sm" variant={filter === key ? "default" : "outline"} onClick={() => setFilter(key)}>{key.replace("_", " ")}</Button>)}</div>
      </div>
      <LoadingOrError loading={loading} error={null} />
      {filtered.length ? (
        <AdminTable minWidth={1100}>
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-white/60"><tr><AdminTH>Prize</AdminTH><AdminTH>Winner</AdminTH><AdminTH>Ticket</AdminTH><AdminTH>Draw date</AdminTH><AdminTH>Status</AdminTH><AdminTH align="right">Actions</AdminTH></tr></thead>
          <tbody>{filtered.map((winner) => {
            const draw = drawByComp[winner.competition_id];
            const ticket = winner.winning_ticket_number ?? draw?.winning_ticket_number;
            return <AdminTR key={winner.id}><AdminTD><div className="font-semibold text-white">{winner.competition?.title || "-"}</div><div className="text-xs text-white/55">{winner.prize_title || "-"}</div></AdminTD><AdminTD>{winner.display_name || "-"}{winner.display_location ? <div className="text-xs text-white/55">{winner.display_location}</div> : null}</AdminTD><AdminTD className="font-mono">{ticket != null ? `#${ticket}` : "-"}</AdminTD><AdminTD>{fmtDate(winner.draw_date)}</AdminTD><AdminTD><div className="flex flex-wrap gap-1"><StatusBadge status={winner.is_published ? "published" : "draft"} /><StatusBadge status={winner.claim_status || "unclaimed"} />{winner.proof_url || draw?.draw_proof_url || draw?.proof_json ? <StatusBadge status="verified" /> : null}</div></AdminTD><AdminTD align="right"><Button size="sm" variant="outline" onClick={() => setSelectedId(winner.id)}>Manage</Button></AdminTD></AdminTR>;
          })}</tbody>
        </AdminTable>
      ) : !loading ? <EmptyRows rows={filtered} label="winners" /> : null}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto border-white/10 bg-[hsl(222_45%_5%)] text-white">
          {selected ? (
            <>
              <DialogHeader><DialogTitle>Manage winner</DialogTitle></DialogHeader>
              <div className="space-y-5">
                <AdminPanel title="Summary">
                  <div className="space-y-1 text-sm text-white/75"><div className="font-semibold text-white">{selected.competition?.title}</div><div>{selected.prize_title}</div><div>Winning ticket: <span className="font-mono">#{selected.winning_ticket_number ?? selectedDraw?.winning_ticket_number ?? "-"}</span></div><div>Drawn {fmtDateTime(selected.draw_date)}</div></div>
                </AdminPanel>
                <AdminPanel title="Public display">
                  <div className="grid gap-3">
                    <Input defaultValue={selected.display_name || ""} onBlur={(e) => updateWinner(selected.id, { display_name: e.target.value || null })} placeholder="Display name" />
                    <Input defaultValue={selected.display_location || ""} onBlur={(e) => updateWinner(selected.id, { display_location: e.target.value || null })} placeholder="Display location" />
                    <Input defaultValue={selected.image_url || ""} onBlur={(e) => updateWinner(selected.id, { image_url: e.target.value || null })} placeholder="Image URL" />
                    <Textarea defaultValue={selected.testimonial || ""} onBlur={(e) => updateWinner(selected.id, { testimonial: e.currentTarget.value || null })} placeholder="Testimonial" />
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => updateWinner(selected.id, { is_published: !selected.is_published }, selected.is_published ? "Winner unpublished." : "Winner published.")}>{selected.is_published ? "Unpublish" : "Publish"}</Button>
                  </div>
                </AdminPanel>
                <AdminPanel title="Draw proof">
                  <div className="space-y-3 text-sm text-white/70">
                    {selectedDraw?.proof_sha256 ? <div className="flex items-center gap-2 text-xs font-mono">SHA-256: {String(selectedDraw.proof_sha256).slice(0, 18)}... <button type="button" onClick={() => copyHash(selectedDraw.proof_sha256)} className="text-primary"><Copy className="h-3.5 w-3.5" /></button></div> : <div className="text-xs text-white/50">No proof SHA-256 on file.</div>}
                    {selectedDraw?.proof_json ? <Button size="sm" variant="outline" onClick={() => downloadProof(selectedDraw)}><Download className="h-4 w-4" /> Download proof JSON</Button> : null}
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => fileInputRef.current?.click()}><Upload className="h-4 w-4" /> {selected.proof_url || selectedDraw?.draw_proof_url ? "Replace proof file" : "Upload proof file"}</Button>
                      {(selected.proof_url || selectedDraw?.draw_proof_url) ? <Button size="sm" variant="outline" onClick={() => openProof(selected.proof_url || selectedDraw?.draw_proof_url)}><ExternalLink className="h-4 w-4" /> Open proof file</Button> : null}
                      <input ref={fileInputRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadProof(file); if (e.currentTarget) e.currentTarget.value = ""; }} />
                    </div>
                  </div>
                </AdminPanel>
                <AdminPanel title="Prize claim">
                  <div className="grid gap-3">
                    <select className="h-10 w-full rounded-md border border-white/10 bg-[#111827] px-3 text-sm text-white" value={selected.claim_status || "unclaimed"} onChange={(e) => updateWinner(selected.id, { claim_status: e.target.value })}>
                      {["unclaimed", "claim_started", "claim_submitted", "verified", "dispatched", "delivered", "cancelled"].map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                    <Input defaultValue={selected.delivery_courier || ""} placeholder="Courier" onBlur={(e) => updateWinner(selected.id, { delivery_courier: e.target.value || null })} />
                    <Input defaultValue={selected.delivery_tracking_url || ""} placeholder="Tracking URL" onBlur={(e) => updateWinner(selected.id, { delivery_tracking_url: e.target.value || null })} />
                    <Textarea defaultValue={selected.delivery_notes || ""} placeholder="Delivery notes" onBlur={(e) => updateWinner(selected.id, { delivery_notes: e.currentTarget.value || null })} />
                    <Textarea defaultValue={selected.admin_notes || ""} placeholder="Admin notes" onBlur={(e) => updateWinner(selected.id, { admin_notes: e.currentTarget.value || null })} />
                    <div className="flex flex-wrap gap-2">
                      {selected.claim_status === "claim_submitted" ? <Button size="sm" variant="outline" onClick={() => updateWinner(selected.id, { claim_status: "verified", claim_verified_at: new Date().toISOString() })}>Mark verified</Button> : null}
                      {selected.claim_status === "verified" ? <Button size="sm" variant="outline" onClick={() => updateWinner(selected.id, { claim_status: "dispatched", dispatched_at: new Date().toISOString() })}>Mark dispatched</Button> : null}
                      {selected.claim_status === "dispatched" ? <Button size="sm" variant="outline" onClick={() => updateWinner(selected.id, { claim_status: "delivered", delivered_at: new Date().toISOString() })}>Mark delivered</Button> : null}
                    </div>
                  </div>
                </AdminPanel>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReviewsPage() {
  const supabase = createSupabaseBrowserClient();
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const emptyReview = { reviewer_name: "", rating: 5, review_text: "", display_order: 100, is_active: true, review_date: null, location: "" };

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error: nextError } = await supabase.from("reviews").select("id,reviewer_name,rating,review_text,display_order,is_active,review_date,location,created_at,updated_at").order("display_order", { ascending: true }).order("created_at", { ascending: false });
    setRows((data as Row[]) ?? []);
    setError(nextError?.message ?? null);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (status === "active" && !row.is_active) return false;
      if (status === "hidden" && row.is_active) return false;
      if (q && !`${row.reviewer_name || ""} ${row.review_text || ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, search, status]);

  async function saveReview() {
    if (!supabase || !editing || saving) return;
    const payload = {
      reviewer_name: String(editing.reviewer_name || "").trim(),
      rating: Math.min(5, Math.max(1, Number(editing.rating) || 5)),
      review_text: String(editing.review_text || "").trim(),
      display_order: Number(editing.display_order) || 0,
      is_active: !!editing.is_active,
      review_date: editing.review_date || null,
      location: String(editing.location || "").trim() || null,
    };
    if (!payload.reviewer_name || !payload.review_text) {
      setError("Name and review text are required.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    const result = editing.id ? await supabase.from("reviews").update(payload).eq("id", editing.id) : await supabase.from("reviews").insert(payload);
    setSaving(false);
    if (result.error) setError(result.error.message);
    else {
      setSuccess(editing.id ? "Review updated." : "Review created.");
      setEditing(null);
      await load();
    }
  }

  async function deleteReview(row: Row) {
    if (!supabase || !window.confirm(`Delete review by "${row.reviewer_name}"?`)) return;
    const { error: nextError } = await supabase.from("reviews").delete().eq("id", row.id);
    if (nextError) setError(nextError.message);
    else {
      setSuccess("Review deleted.");
      setEditing(null);
      await load();
    }
  }

  return (
    <div>
      <AdminPageHeader eyebrow="Social proof" title="Reviews" subtitle="Manage the reviews shown in the homepage trust marquee. Only active reviews appear publicly." icon={<Star className="h-5 w-5" />} actions={<Button onClick={() => setEditing({ ...emptyReview })}><Plus className="h-4 w-4" /> New review</Button>} />
      {error ? <div className="mb-4 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">{error}</div> : null}
      {success ? <div className="mb-4 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-primary">{success}</div> : null}
      <AdminPanel className="mb-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><Input className="max-w-md" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or text" /><div className="flex gap-2">{["all", "active", "hidden"].map((key) => <Button key={key} size="sm" variant={status === key ? "default" : "outline"} onClick={() => setStatus(key)}>{key}</Button>)}</div></div>
      </AdminPanel>
      <LoadingOrError loading={loading} error={null} />
      {filtered.length ? <AdminTable minWidth={920}><thead className="bg-white/5 text-xs uppercase tracking-wider text-white/60"><tr><AdminTH>Reviewer</AdminTH><AdminTH>Rating</AdminTH><AdminTH>Review</AdminTH><AdminTH>Sort</AdminTH><AdminTH>Status</AdminTH><AdminTH align="right">Actions</AdminTH></tr></thead><tbody>{filtered.map((row) => <AdminTR key={row.id}><AdminTD>{row.reviewer_name}{row.location ? <div className="text-xs text-white/50">{row.location}</div> : null}</AdminTD><AdminTD className="text-primary">{"*".repeat(Number(row.rating || 0))}</AdminTD><AdminTD className="max-w-md truncate">{row.review_text}</AdminTD><AdminTD>{row.display_order}</AdminTD><AdminTD><StatusBadge status={row.is_active ? "published" : "draft"} /></AdminTD><AdminTD align="right"><Button size="sm" variant="outline" onClick={() => setEditing(row)}>Edit</Button></AdminTD></AdminTR>)}</tbody></AdminTable> : !loading ? <EmptyRows rows={filtered} label="reviews" /> : null}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="border-white/10 bg-[hsl(222_45%_5%)] text-white">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit review" : "New review"}</DialogTitle></DialogHeader>
          {editing ? <div className="space-y-3"><Input value={editing.reviewer_name || ""} onChange={(e) => setEditing({ ...editing, reviewer_name: e.target.value })} placeholder="Reviewer name" /><Input value={editing.location || ""} onChange={(e) => setEditing({ ...editing, location: e.target.value })} placeholder="Location" /><div className="grid grid-cols-2 gap-3"><Input type="number" min="1" max="5" value={editing.rating ?? 5} onChange={(e) => setEditing({ ...editing, rating: e.target.value })} /><Input type="date" value={editing.review_date || ""} onChange={(e) => setEditing({ ...editing, review_date: e.target.value || null })} /></div><Textarea rows={5} value={editing.review_text || ""} onChange={(e) => setEditing({ ...editing, review_text: e.target.value })} placeholder="Review text" /><div className="grid grid-cols-2 gap-3"><Input type="number" value={editing.display_order ?? 100} onChange={(e) => setEditing({ ...editing, display_order: e.target.value })} /><label className="flex items-center gap-2"><input type="checkbox" checked={!!editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} /> Active</label></div></div> : null}
          <DialogFooter>{editing?.id ? <Button variant="outline" className="border-destructive/40 text-destructive" onClick={() => deleteReview(editing)}>Delete</Button> : null}<Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={saveReview} disabled={saving}>{saving ? "Saving..." : "Save"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DiscountCodesPage() {
  const supabase = createSupabaseBrowserClient();
  const [rows, setRows] = useState<Row[]>([]);
  const [competitions, setCompetitions] = useState<Row[]>([]);
  const [redemptions, setRedemptions] = useState<Record<string, number>>({});
  const [editing, setEditing] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const emptyCode = {
    code: "",
    description: "",
    discount_type: "percent",
    discount_value: 10,
    is_active: true,
    starts_at: null,
    expires_at: null,
    max_uses: null,
    max_uses_per_user: null,
    min_quantity: null,
    min_subtotal: null,
    competition_id: null,
  };

  const parseFunctionError = async (fnError: any, fallback: string) => {
    let msg = fnError?.message || fallback;
    try {
      const ctx = fnError?.context;
      if (ctx && typeof ctx.text === "function") {
        const text = await ctx.clone().text();
        if (text) {
          try {
            const parsed = JSON.parse(text);
            if (parsed?.error) msg = parsed.error;
          } catch {
            msg = text;
          }
        }
      }
    } catch {}
    if (/Failed to send a request to the Edge Function/i.test(fnError?.message || "")) {
      msg = "Could not reach discount code admin function. Check that admin-discount-codes is deployed in Supabase.";
    }
    return msg;
  };

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    const [listRes, compsRes] = await Promise.all([
      supabase.functions.invoke("admin-discount-codes", { body: { action: "list", payload: {} } }),
      supabase.from("competitions").select("id,title").order("title"),
    ]);
    if (listRes.error) {
      setError(await parseFunctionError(listRes.error, "Failed to load discount codes."));
      setRows([]);
    } else {
      const data = listRes.data as Row | null;
      setRows(((data?.rows ?? []) as Row[]).map((row) => ({ ...row, discount_value: Number(row.discount_value) })));
      const counts: Record<string, number> = {};
      for (const item of ((data?.redemptions ?? []) as Row[])) if (item.status === "confirmed") counts[item.discount_code_id] = (counts[item.discount_code_id] ?? 0) + 1;
      setRedemptions(counts);
    }
    if (compsRes.error) setError(compsRes.error.message);
    setCompetitions((compsRes.data as Row[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  async function callAdmin(action: "create" | "update" | "delete", payload: Row) {
    if (!supabase) throw new Error("Supabase client is not configured.");
    const { data, error: nextError } = await supabase.functions.invoke("admin-discount-codes", { body: { action, payload } });
    if (nextError) throw new Error(await parseFunctionError(nextError, "Discount code request failed."));
    if ((data as Row)?.error) throw new Error(String((data as Row).error));
    return data;
  }

  async function saveDiscountCode() {
    if (!editing || saving) return;
    const payload: Row = {
      code: String(editing.code || "").toUpperCase().trim(),
      description: editing.description || null,
      discount_type: editing.discount_type || "percent",
      discount_value: Number(editing.discount_value || 0),
      is_active: editing.is_active ?? true,
      starts_at: editing.starts_at || null,
      expires_at: editing.expires_at || null,
      max_uses: editing.max_uses ? Number(editing.max_uses) : null,
      max_uses_per_user: editing.max_uses_per_user ? Number(editing.max_uses_per_user) : null,
      min_quantity: editing.min_quantity ? Number(editing.min_quantity) : null,
      min_subtotal: editing.min_subtotal ? Number(editing.min_subtotal) : null,
      competition_id: editing.competition_id || null,
    };
    if (!payload.code) {
      setError("Code is required.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      if (editing.id) await callAdmin("update", { id: editing.id, ...payload });
      else await callAdmin("create", payload);
      setSuccess(editing.id ? "Code updated." : "Code created.");
      setEditing(null);
      await load();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to save discount code.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteDiscountCode(row: Row) {
    if (!window.confirm("Delete this code? Existing redemptions will be kept.")) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await callAdmin("delete", { id: row.id });
      setSuccess("Code deleted.");
      await load();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to delete discount code.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleDiscountCode(row: Row) {
    setError(null);
    setSuccess(null);
    try {
      await callAdmin("update", { id: row.id, is_active: !row.is_active });
      await load();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to update discount code.");
    }
  }

  return (
    <div>
      <AdminPageHeader eyebrow="Marketing" title="Discount codes" icon={<Tag className="h-5 w-5" />} subtitle="Create and manage promo codes through the existing admin-discount-codes Edge Function." actions={<Button onClick={() => setEditing({ ...emptyCode })}><Plus className="h-4 w-4" /> New code</Button>} />
      {error ? <div className="mb-4 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">{error}</div> : null}
      {success ? <div className="mb-4 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-primary">{success}</div> : null}
      <LoadingOrError loading={loading} error={null} />
      {rows.length ? (
        <AdminTable minWidth={1000}>
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-white/60"><tr><AdminTH>Code</AdminTH><AdminTH>Discount</AdminTH><AdminTH>Limits</AdminTH><AdminTH>Validity</AdminTH><AdminTH align="right">Used</AdminTH><AdminTH>Status</AdminTH><AdminTH align="right">Actions</AdminTH></tr></thead>
          <tbody>{rows.map((row) => <AdminTR key={row.id}><AdminTD><div className="font-mono font-bold text-primary">{row.code}</div>{row.description ? <div className="text-xs text-white/55">{row.description}</div> : null}</AdminTD><AdminTD>{row.discount_type === "percent" ? `${row.discount_value}%` : formatMoney(Number(row.discount_value || 0))}</AdminTD><AdminTD className="text-xs text-white/70">{row.max_uses ? <div>Max {row.max_uses} total</div> : null}{row.max_uses_per_user ? <div>{row.max_uses_per_user} per user</div> : null}{row.min_quantity ? <div>Min qty {row.min_quantity}</div> : null}{row.min_subtotal ? <div>Min {formatMoney(Number(row.min_subtotal))}</div> : null}{!row.max_uses && !row.max_uses_per_user && !row.min_quantity && !row.min_subtotal ? "-" : null}</AdminTD><AdminTD className="text-xs text-white/70">{row.starts_at ? <div>From {fmtDate(row.starts_at)}</div> : null}{row.expires_at ? <div>Until {fmtDate(row.expires_at)}</div> : null}{!row.starts_at && !row.expires_at ? "Always" : null}</AdminTD><AdminTD align="right">{redemptions[row.id] ?? 0}</AdminTD><AdminTD><button type="button" onClick={() => toggleDiscountCode(row)} className={`rounded px-2 py-1 text-xs font-bold ${row.is_active ? "bg-success/20 text-success" : "bg-white/10 text-white/60"}`}>{row.is_active ? "Active" : "Inactive"}</button></AdminTD><AdminTD align="right"><div className="flex justify-end gap-1"><Button size="sm" variant="outline" onClick={() => setEditing(row)}><Pencil className="h-3.5 w-3.5" /></Button><Button size="sm" variant="outline" onClick={() => deleteDiscountCode(row)}><Trash2 className="h-3.5 w-3.5" /></Button></div></AdminTD></AdminTR>)}</tbody>
        </AdminTable>
      ) : !loading ? <EmptyRows rows={rows} label="discount codes" /> : null}

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-lg border-white/10 bg-[hsl(222_45%_5%)] text-white">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit code" : "New discount code"}</DialogTitle></DialogHeader>
          {editing ? <div className="space-y-3 text-sm"><div className="space-y-1"><FieldLabel label="Code" /><Input value={editing.code || ""} onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })} /></div><div className="space-y-1"><FieldLabel label="Description" /><Input value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div><div className="grid grid-cols-2 gap-3"><div className="space-y-1"><FieldLabel label="Type" /><select className="h-10 w-full rounded-md border border-white/10 bg-[#111827] px-3 text-sm text-white" value={editing.discount_type || "percent"} onChange={(e) => setEditing({ ...editing, discount_type: e.target.value })}><option value="percent">Percentage</option><option value="fixed">Fixed amount</option></select></div><div className="space-y-1"><FieldLabel label="Value" /><Input type="number" step="0.01" value={editing.discount_value ?? 0} onChange={(e) => setEditing({ ...editing, discount_value: e.target.value })} /></div></div><div className="space-y-1"><FieldLabel label="Restrict to competition" /><select className="h-10 w-full rounded-md border border-white/10 bg-[#111827] px-3 text-sm text-white" value={editing.competition_id || ""} onChange={(e) => setEditing({ ...editing, competition_id: e.target.value || null })}><option value="">Any competition</option>{competitions.map((competition) => <option key={competition.id} value={competition.id}>{competition.title}</option>)}</select></div><div className="grid grid-cols-2 gap-3"><div className="space-y-1"><FieldLabel label="Starts at" /><Input type="datetime-local" value={editing.starts_at?.slice(0, 16) || ""} onChange={(e) => setEditing({ ...editing, starts_at: e.target.value || null })} /></div><div className="space-y-1"><FieldLabel label="Expires at" /><Input type="datetime-local" value={editing.expires_at?.slice(0, 16) || ""} onChange={(e) => setEditing({ ...editing, expires_at: e.target.value || null })} /></div></div><div className="grid grid-cols-2 gap-3"><div className="space-y-1"><FieldLabel label="Max uses" /><Input type="number" value={editing.max_uses ?? ""} onChange={(e) => setEditing({ ...editing, max_uses: e.target.value || null })} /></div><div className="space-y-1"><FieldLabel label="Max uses per user" /><Input type="number" value={editing.max_uses_per_user ?? ""} onChange={(e) => setEditing({ ...editing, max_uses_per_user: e.target.value || null })} /></div></div><div className="grid grid-cols-2 gap-3"><div className="space-y-1"><FieldLabel label="Min quantity" /><Input type="number" value={editing.min_quantity ?? ""} onChange={(e) => setEditing({ ...editing, min_quantity: e.target.value || null })} /></div><div className="space-y-1"><FieldLabel label="Min subtotal" /><Input type="number" step="0.01" value={editing.min_subtotal ?? ""} onChange={(e) => setEditing({ ...editing, min_subtotal: e.target.value || null })} /></div></div><label className="inline-flex items-center gap-2"><input type="checkbox" checked={editing.is_active ?? true} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} /> Active</label></div> : null}
          <DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={saveDiscountCode} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WalletSettingsPage() {
  const supabase = createSupabaseBrowserClient();
  const [settings, setSettings] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.from("wallet_settings").select("*").eq("id", 1).maybeSingle().then(({ data, error: nextError }: { data: Row | null; error: any }) => {
      setSettings(data);
      setError(nextError?.message ?? null);
      setLoading(false);
    });
  }, [supabase]);

  async function save() {
    if (!supabase || !settings || saving) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    const { error: nextError } = await supabase.from("wallet_settings").update({
      is_earn_enabled: !!settings.is_earn_enabled,
      earn_percentage: Number(settings.earn_percentage ?? 0),
      min_purchase_for_earn: Number(settings.min_purchase_for_earn ?? 0),
      credit_expiry_days: settings.credit_expiry_days ? Number(settings.credit_expiry_days) : null,
      max_wallet_use_percentage: Number(settings.max_wallet_use_percentage ?? 100),
      updated_at: new Date().toISOString(),
    }).eq("id", 1);
    setSaving(false);
    if (nextError) setError(nextError.message);
    else setSuccess("Wallet settings saved.");
  }

  return (
    <div className="max-w-2xl">
      <AdminPageHeader eyebrow="Configuration" title="Wallet settings" subtitle="Control how customers earn and spend wallet credit, matching the Vite wallet_settings mutation." icon={<Wallet className="h-5 w-5" />} />
      <LoadingOrError loading={loading} error={error} />
      {success ? <div className="mb-4 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-primary">{success}</div> : null}
      {settings ? (
        <AdminPanel>
          <div className="space-y-4">
            <label className="flex items-center gap-3"><input type="checkbox" checked={!!settings.is_earn_enabled} onChange={(e) => setSettings({ ...settings, is_earn_enabled: e.target.checked })} /><span className="font-bold text-white">Enable earn-on-purchase</span></label>
            <div className="space-y-2"><FieldLabel label="Earn percentage of every paid purchase" /><Input type="number" min="0" max="100" step="0.1" value={settings.earn_percentage ?? 0} onChange={(e) => setSettings({ ...settings, earn_percentage: e.target.value })} /></div>
            <div className="space-y-2"><FieldLabel label="Minimum purchase to earn" /><Input type="number" min="0" step="0.01" value={settings.min_purchase_for_earn ?? 0} onChange={(e) => setSettings({ ...settings, min_purchase_for_earn: e.target.value })} /></div>
            <div className="space-y-2"><FieldLabel label="Credit expiry (days, blank = never)" /><Input type="number" min="0" value={settings.credit_expiry_days ?? ""} onChange={(e) => setSettings({ ...settings, credit_expiry_days: e.target.value || null })} /></div>
            <div className="space-y-2"><FieldLabel label="Max % of order payable from wallet" /><Input type="number" min="0" max="100" step="1" value={settings.max_wallet_use_percentage ?? 100} onChange={(e) => setSettings({ ...settings, max_wallet_use_percentage: e.target.value })} /></div>
            <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save settings</Button>
          </div>
        </AdminPanel>
      ) : null}
    </div>
  );
}

function PostalEntriesPage() {
  const supabase = createSupabaseBrowserClient();
  const [competitions, setCompetitions] = useState<Row[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [form, setForm] = useState<Row>({ competition_id: "", full_name: "", email: "", phone: "", date_of_birth: "", address_line_1: "", address_line_2: "", town_city: "", county: "", postcode: "", country: "United Kingdom" });
  const [reject, setReject] = useState<{ id: string; reason: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    const [compResult, postalResult] = await Promise.all([
      supabase.from("competitions").select("id,title,slug,status").in("status", ["live", "sold_out", "closed"]).order("created_at", { ascending: false }),
      supabase.from("postal_entries").select("*,competition:competitions(title),entry:entries!postal_entries_entry_id_fkey(id,ticket_number,status,entry_type,archived_at)").order("created_at", { ascending: false }).limit(200),
    ]);
    if (compResult.error) setError(compResult.error.message);
    if (postalResult.error) setError(postalResult.error.message);
    setCompetitions((compResult.data as Row[]) ?? []);
    setRows((postalResult.data as Row[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  async function createPostalEntry() {
    if (!supabase || busy) return;
    if (!form.competition_id || !form.full_name || !form.email || !form.date_of_birth) {
      setError("Competition, name, email and DOB are required.");
      return;
    }
    setBusy("create");
    setError(null);
    setSuccess(null);
    try {
      const { data: profile } = await supabase.from("profiles").select("id").eq("email", form.email).maybeSingle();
      const payload = { ...form, user_id: profile?.id ?? null };
      const { error: nextError } = await supabase.from("postal_entries").insert(payload).select("id").maybeSingle();
      if (nextError) throw nextError;
      setSuccess("Postal entry recorded.");
      setForm({ ...form, full_name: "", email: "", phone: "", date_of_birth: "" });
      await load();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Postal entry create failed.");
    } finally {
      setBusy(null);
    }
  }

  async function processPostal(id: string) {
    if (!supabase || busy) return;
    if (!window.confirm("Process this postal entry and allocate a valid postal ticket?")) return;
    setBusy(id);
    setError(null);
    setSuccess(null);
    try {
      const { data, error: nextError } = await supabase.rpc("allocate_postal_entry", { p_postal_entry_id: id });
      if (nextError) throw nextError;
      setSuccess(`Allocated ticket #${data}.`);
      await load();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Postal processing failed.");
    } finally {
      setBusy(null);
    }
  }

  async function resetBroken(id: string) {
    if (!supabase || busy) return;
    if (!window.confirm("Reset this postal entry to 'received'? It will need to be processed again.")) return;
    setBusy(id);
    const { error: nextError } = await supabase.from("postal_entries").update({ status: "received", processed_at: null, processed_by: null, entry_id: null, rejection_reason: null }).eq("id", id);
    setBusy(null);
    if (nextError) setError(nextError.message);
    else {
      setSuccess("Reset to received.");
      await load();
    }
  }

  async function rejectPostalEntry() {
    if (!supabase || !reject) return;
    setBusy(reject.id);
    setError(null);
    setSuccess(null);
    const { error: nextError } = await supabase.from("postal_entries").update({ status: "rejected", rejection_reason: reject.reason, processed_at: new Date().toISOString() }).eq("id", reject.id);
    setBusy(null);
    if (nextError) setError(nextError.message);
    else {
      setSuccess("Postal entry rejected.");
      setReject(null);
      await load();
    }
  }

  return (
    <div>
      <AdminPageHeader eyebrow="Operations" title="Postal entries" subtitle="Lifecycle: received -> processed via allocate_postal_entry RPC, or rejected with a reason." icon={<Mail className="h-5 w-5" />} />
      <div className="mb-5 rounded-lg border border-info/30 bg-info/10 p-3 text-sm text-info">Processed postal entries create valid entries and are automatically included in the draw pool. Rejected entries are not included in the draw.</div>
      {error ? <div className="mb-4 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">{error}</div> : null}
      {success ? <div className="mb-4 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-primary">{success}</div> : null}
      <AdminPanel title="Add a new postal entry" className="mb-6">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2"><FieldLabel label="Competition" /><select className="h-10 w-full rounded-md border border-white/10 bg-[#111827] px-3 text-sm text-white" value={form.competition_id} onChange={(e) => setForm({ ...form, competition_id: e.target.value })}><option value="">Select...</option>{competitions.map((competition) => <option key={competition.id} value={competition.id}>{competition.title} ({competition.status})</option>)}</select></div>
          <div className="space-y-2"><FieldLabel label="Full name" /><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
          <div className="space-y-2"><FieldLabel label="Email" help="Will link to existing user if email matches a profile." /><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="space-y-2"><FieldLabel label="Date of birth" /><Input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} /></div>
          <div className="space-y-2"><FieldLabel label="Phone" /><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="space-y-2"><FieldLabel label="Address line 1" /><Input value={form.address_line_1} onChange={(e) => setForm({ ...form, address_line_1: e.target.value })} /></div>
          <div className="space-y-2"><FieldLabel label="Town / city" /><Input value={form.town_city} onChange={(e) => setForm({ ...form, town_city: e.target.value })} /></div>
          <div className="space-y-2"><FieldLabel label="Postcode" /><Input value={form.postcode} onChange={(e) => setForm({ ...form, postcode: e.target.value })} /></div>
        </div>
        <Button className="mt-4" onClick={createPostalEntry} disabled={busy === "create"}>{busy === "create" ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save as received</Button>
      </AdminPanel>
      <LoadingOrError loading={loading} error={null} />
      {rows.length ? (
        <AdminTable minWidth={1100}>
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-white/60"><tr><AdminTH>Competition</AdminTH><AdminTH>Entrant</AdminTH><AdminTH>Status</AdminTH><AdminTH>Ticket</AdminTH><AdminTH>Received</AdminTH><AdminTH>Processed</AdminTH><AdminTH>Actions</AdminTH></tr></thead>
          <tbody>{rows.map((row) => {
            const linked = row.entry && row.entry.id;
            const broken = row.status === "processed" && (!row.entry_id || !linked);
            return <AdminTR key={row.id}><AdminTD>{row.competition?.title || shortId(row.competition_id)}</AdminTD><AdminTD>{row.full_name}<div className="text-xs text-white/50">{row.email}</div></AdminTD><AdminTD><StatusBadge status={row.status} />{row.rejection_reason ? <div className="mt-1 text-xs text-destructive">Reason: {row.rejection_reason}</div> : null}{broken ? <div className="mt-1 text-xs text-destructive">Processed but no linked entry</div> : null}</AdminTD><AdminTD>{linked && row.entry?.ticket_number != null ? <span className="font-mono">#{row.entry.ticket_number}</span> : "-"}</AdminTD><AdminTD>{fmtDate(row.received_at || row.created_at)}</AdminTD><AdminTD>{fmtDate(row.processed_at)}</AdminTD><AdminTD>{row.status === "received" ? <div className="flex gap-2"><Button size="sm" onClick={() => processPostal(row.id)} disabled={busy === row.id}>Process</Button><Button size="sm" variant="outline" onClick={() => setReject({ id: row.id, reason: "" })}>Reject</Button></div> : broken ? <Button size="sm" variant="outline" onClick={() => resetBroken(row.id)} disabled={busy === row.id}>Reset to received</Button> : linked ? <span className="text-xs text-white/55">Entry linked</span> : "-"}</AdminTD></AdminTR>;
          })}</tbody>
        </AdminTable>
      ) : !loading ? <EmptyRows rows={rows} label="postal entries" /> : null}

      <Dialog open={!!reject} onOpenChange={(open) => !open && setReject(null)}>
        <DialogContent className="border-white/10 bg-[hsl(222_45%_5%)] text-white">
          <DialogHeader><DialogTitle>Reject postal entry</DialogTitle></DialogHeader>
          <Textarea placeholder="Reason" value={reject?.reason || ""} onChange={(e) => reject && setReject({ ...reject, reason: e.target.value })} />
          <DialogFooter><Button variant="outline" onClick={() => setReject(null)}>Cancel</Button><Button onClick={rejectPostalEntry} disabled={!reject?.reason.trim() || busy === reject?.id}>Confirm reject</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmailsPage() {
  const { rows, loading, error } = useRows("email_templates", "id,template_key,subject,is_active,updated_at", "template_key", true, 100);
  return <SimpleListPage eyebrow="Comms" title="Emails" subtitle="Read-only email templates when the table is available." loading={loading} error={error} rows={rows} icon={<Send className="h-5 w-5" />} columns={["template_key", "subject", "is_active", "updated_at"]} incomplete="The Vite email editor, preview diagnostics, branding settings and send/test flows are not ported in Next yet. Klaviyo/Resend logic was not changed." />;
}

function FaqsPage() {
  const supabase = createSupabaseBrowserClient();
  const [rows, setRows] = useState<Row[]>([]);
  const [editing, setEditing] = useState<Row | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const emptyFaq = { category: "getting_started", question: "", answer: "", sort_order: 100, is_published: false, archived_at: null };
  const categories = ["getting_started", "entries_tickets", "payments_wallet", "free_postal_entry", "draws_winners", "prize_claims", "account_responsible_play"];

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error: nextError } = await supabase.from("faq_items").select("id,category,question,answer,sort_order,is_published,archived_at,updated_at").order("category", { ascending: true }).order("sort_order", { ascending: true });
    setRows((data as Row[]) ?? []);
    setError(nextError?.message ?? null);
    setLoading(false);
  }, [supabase]);
  useEffect(() => { load(); }, [load]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (status === "published" && (!row.is_published || row.archived_at)) return false;
      if (status === "draft" && (row.is_published || row.archived_at)) return false;
      if (status === "archived" && !row.archived_at) return false;
      if (q && !`${row.question || ""} ${row.answer || ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, search, status]);

  async function saveFaq() {
    if (!supabase || !editing || saving) return;
    const payload = { category: editing.category, question: String(editing.question || "").trim(), answer: String(editing.answer || "").trim(), sort_order: Number(editing.sort_order) || 0, is_published: !!editing.is_published };
    if (!payload.question || !payload.answer) return setError("Question and answer are required.");
    setSaving(true);
    const result = editing.id ? await supabase.from("faq_items").update(payload).eq("id", editing.id) : await supabase.from("faq_items").insert(payload);
    setSaving(false);
    if (result.error) setError(result.error.message);
    else {
      setSuccess(editing.id ? "FAQ updated." : "FAQ created.");
      setEditing(null);
      await load();
    }
  }

  async function archiveFaq(row: Row) {
    if (!supabase) return;
    const { error: nextError } = await supabase.from("faq_items").update({ archived_at: row.archived_at ? null : new Date().toISOString() }).eq("id", row.id);
    if (nextError) setError(nextError.message);
    else {
      setSuccess(row.archived_at ? "FAQ unarchived." : "FAQ archived.");
      await load();
    }
  }

  async function deleteFaq(row: Row) {
    if (!supabase || !window.confirm(`Delete FAQ "${row.question}"? This cannot be undone.`)) return;
    const { error: nextError } = await supabase.from("faq_items").delete().eq("id", row.id);
    if (nextError) setError(nextError.message);
    else {
      setSuccess("FAQ deleted.");
      setEditing(null);
      await load();
    }
  }

  return (
    <div>
      <AdminPageHeader eyebrow="Help Centre" title="FAQs" subtitle="Manage the public Help Centre. Only published, non-archived FAQs appear on /faqs." icon={<LifeBuoy className="h-5 w-5" />} actions={<Button onClick={() => setEditing({ ...emptyFaq })}><Plus className="h-4 w-4" /> New FAQ</Button>} />
      {error ? <div className="mb-4 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">{error}</div> : null}
      {success ? <div className="mb-4 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-primary">{success}</div> : null}
      <AdminPanel className="mb-4"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><Input className="max-w-md" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search question or answer" /><div className="flex gap-2">{["all", "published", "draft", "archived"].map((key) => <Button key={key} size="sm" variant={status === key ? "default" : "outline"} onClick={() => setStatus(key)}>{key}</Button>)}</div></div></AdminPanel>
      <LoadingOrError loading={loading} error={null} />
      {filtered.length ? <AdminTable minWidth={980}><thead className="bg-white/5 text-xs uppercase tracking-wider text-white/60"><tr><AdminTH>Category</AdminTH><AdminTH>Question</AdminTH><AdminTH>Sort</AdminTH><AdminTH>Status</AdminTH><AdminTH>Updated</AdminTH><AdminTH align="right">Actions</AdminTH></tr></thead><tbody>{filtered.map((row) => <AdminTR key={row.id}><AdminTD>{String(row.category || "").replaceAll("_", " ")}</AdminTD><AdminTD>{row.question}</AdminTD><AdminTD>{row.sort_order}</AdminTD><AdminTD><StatusBadge status={row.archived_at ? "archived" : row.is_published ? "published" : "draft"} /></AdminTD><AdminTD>{fmtDate(row.updated_at)}</AdminTD><AdminTD align="right"><div className="flex justify-end gap-1"><Button size="sm" variant="outline" onClick={() => setEditing(row)}>Edit</Button><Button size="sm" variant="outline" onClick={() => archiveFaq(row)}>{row.archived_at ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}</Button>{row.archived_at ? <Button size="sm" variant="outline" className="text-destructive" onClick={() => deleteFaq(row)}><Trash2 className="h-3.5 w-3.5" /></Button> : null}</div></AdminTD></AdminTR>)}</tbody></AdminTable> : !loading ? <EmptyRows rows={filtered} label="FAQs" /> : null}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-2xl border-white/10 bg-[hsl(222_45%_5%)] text-white"><DialogHeader><DialogTitle>{editing?.id ? "Edit FAQ" : "New FAQ"}</DialogTitle></DialogHeader>{editing ? <div className="space-y-3"><select className="h-10 w-full rounded-md border border-white/10 bg-[#111827] px-3 text-sm text-white" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>{categories.map((cat) => <option key={cat} value={cat}>{cat.replaceAll("_", " ")}</option>)}</select><Input value={editing.question || ""} onChange={(e) => setEditing({ ...editing, question: e.target.value })} placeholder="Question" /><Textarea rows={8} value={editing.answer || ""} onChange={(e) => setEditing({ ...editing, answer: e.target.value })} placeholder="Answer" /><div className="grid grid-cols-2 gap-3"><Input type="number" value={editing.sort_order ?? 100} onChange={(e) => setEditing({ ...editing, sort_order: e.target.value })} /><label className="flex items-center gap-2"><input type="checkbox" checked={!!editing.is_published} onChange={(e) => setEditing({ ...editing, is_published: e.target.checked })} /> Published</label></div></div> : null}<DialogFooter>{editing?.id ? <Button variant="outline" onClick={() => archiveFaq(editing)}>{editing.archived_at ? "Unarchive" : "Archive"}</Button> : null}<Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={saveFaq} disabled={saving}>{saving ? "Saving..." : "Save"}</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
}

function GuidesPage() {
  const supabase = createSupabaseBrowserClient();
  const { rows, loading, error, reload } = useRows("guides", "id,title,slug,category,status,is_featured,updated_at,published_at", "updated_at", false, 200);
  const [q, setQ] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const filtered = rows.filter((row) => !q.trim() || `${row.title} ${row.slug} ${row.category}`.toLowerCase().includes(q.toLowerCase()));

  async function duplicateGuide(row: Row) {
    if (!supabase) return;
    setActionError(null); setSuccess(null);
    const { data: full, error: fetchError } = await supabase.from("guides").select("*").eq("id", row.id).maybeSingle();
    if (fetchError || !full) return setActionError(fetchError?.message || "Guide not found.");
    const { id, created_at, updated_at, published_at, ...rest } = full as Row;
    const { error: insertError } = await supabase.from("guides").insert({ ...rest, slug: `${row.slug}-copy-${Math.random().toString(36).slice(2, 6)}`, title: `${row.title} (copy)`, status: "draft", is_featured: false, published_at: null });
    if (insertError) setActionError(insertError.message);
    else { setSuccess("Guide duplicated."); reload(); }
  }

  async function deleteGuide(row: Row) {
    if (!supabase || !window.confirm(`Delete guide "${row.title}"? This cannot be undone.`)) return;
    const { error: deleteError } = await supabase.from("guides").delete().eq("id", row.id);
    if (deleteError) setActionError(deleteError.message);
    else { setSuccess("Guide deleted."); reload(); }
  }

  return (
    <div>
      <AdminPageHeader eyebrow="Content" title="Guides" subtitle={`${rows.length} total - ${filtered.length} shown`} icon={<BookOpen className="h-5 w-5" />} actions={<Button asChild><Link href="/admin/guides/new">New guide</Link></Button>} />
      {actionError ? <div className="mb-4 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">{actionError}</div> : null}
      {success ? <div className="mb-4 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-primary">{success}</div> : null}
      <div className="mb-4 max-w-sm"><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title, slug, category" /></div>
      <LoadingOrError loading={loading} error={error} />
      {filtered.length ? <AdminTable minWidth={1000}><thead className="bg-white/5 text-xs uppercase tracking-wider text-white/60"><tr><AdminTH>Title</AdminTH><AdminTH>Status</AdminTH><AdminTH>Category</AdminTH><AdminTH align="center">Featured</AdminTH><AdminTH>Updated</AdminTH><AdminTH align="right">Actions</AdminTH></tr></thead><tbody>{filtered.map((row) => <AdminTR key={row.id}><AdminTD><Link href={`/admin/guides/${row.id}`} className="font-semibold text-white hover:text-primary">{row.title}</Link><div className="text-xs text-white/45">/guides/{row.slug}</div></AdminTD><AdminTD><StatusBadge status={row.status} /></AdminTD><AdminTD>{row.category || "-"}</AdminTD><AdminTD align="center">{row.is_featured ? <Star className="inline h-4 w-4 text-primary" fill="currentColor" /> : "-"}</AdminTD><AdminTD>{fmtDateTime(row.updated_at)}</AdminTD><AdminTD align="right"><div className="flex justify-end gap-1"><Button asChild size="sm" variant="outline"><Link href={`/admin/guides/${row.id}`}><Pencil className="h-3.5 w-3.5" /></Link></Button>{row.status === "published" ? <Button asChild size="sm" variant="outline"><Link href={`/guides/${row.slug}`} target="_blank"><ExternalLink className="h-3.5 w-3.5" /></Link></Button> : null}<Button size="sm" variant="outline" onClick={() => duplicateGuide(row)}><Copy className="h-3.5 w-3.5" /></Button><Button size="sm" variant="outline" className="text-destructive" onClick={() => deleteGuide(row)}><Trash2 className="h-3.5 w-3.5" /></Button></div></AdminTD></AdminTR>)}</tbody></AdminTable> : !loading ? <EmptyRows rows={filtered} label="guides" /> : null}
    </div>
  );
}

function GuideFormShell({ mode, id }: { mode: "new" | "edit"; id?: string }) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [form, setForm] = useState<Row>(EMPTY_GUIDE);
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase || mode !== "edit" || !id) return;
    supabase.from("guides").select("*").eq("id", id).maybeSingle().then(({ data, error: nextError }: { data: Row | null; error: any }) => {
      if (nextError) setError(nextError.message);
      if (data) setForm({ ...EMPTY_GUIDE, ...data, tags: data.tags || [] });
      setLoading(false);
    });
  }, [id, mode, supabase]);

  async function saveGuide(status = form.status || "draft") {
    if (!supabase || saving) return;
    if (!form.title?.trim() || !form.excerpt?.trim() || !form.body_markdown?.trim()) {
      setError("Title, excerpt and body are required.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    const payload = {
      ...form,
      slug: String(form.slug || slugify(form.title)).trim(),
      tags: Array.isArray(form.tags) ? form.tags.filter(Boolean) : [],
      status,
      published_at: status === "published" && !form.published_at ? new Date().toISOString() : form.published_at,
    };
    delete (payload as Row).id;
    delete (payload as Row).created_at;
    delete (payload as Row).updated_at;
    const result = mode === "new" ? await supabase.from("guides").insert(payload).select("id").single() : await supabase.from("guides").update(payload).eq("id", id).select("id").single();
    setSaving(false);
    if (result.error) setError(result.error.message);
    else {
      setSuccess("Guide saved.");
      if (mode === "new") router.push(`/admin/guides/${(result.data as Row).id}`);
    }
  }

  return (
    <div className="max-w-4xl">
      <AdminPageHeader eyebrow={mode === "new" ? "Content" : "Edit"} title={mode === "new" ? "New guide" : "Edit guide"} icon={<BookOpen className="h-5 w-5" />} actions={mode === "edit" && form.status === "published" ? <Button asChild variant="outline"><Link href={`/guides/${form.slug}`} target="_blank">Preview public</Link></Button> : null} />
      <LoadingOrError loading={loading} error={null} />
      {error ? <div className="mb-4 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">{error}</div> : null}
      {success ? <div className="mb-4 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-primary">{success}</div> : null}
      {!loading ? <div className="space-y-6"><AdminPanel title="Article basics"><div className="grid gap-4 md:grid-cols-2"><Input value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.slug || slugify(e.target.value) })} placeholder="Title" /><Input value={form.slug || ""} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} placeholder="Slug" /><Input value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Category" /><Input value={(form.tags || []).join(", ")} onChange={(e) => setForm({ ...form, tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} placeholder="Tags" /><Textarea className="md:col-span-2" rows={3} value={form.excerpt || ""} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} placeholder="Excerpt" /></div></AdminPanel><AdminPanel title="Featured image"><div className="grid gap-4 md:grid-cols-[260px_1fr]"><div className="aspect-video overflow-hidden rounded-md border border-white/10 bg-white/5">{form.featured_image_url ? <img src={form.featured_image_url} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-xs text-white/40">No image</div>}</div><div className="space-y-3"><AdminImageUploader folder={`guides/${form.slug || id || "new"}`} multiple={false} onUploaded={(files) => files[0] && setForm({ ...form, featured_image_url: files[0].url })} onSuccess={setSuccess} onError={setError} /><Input value={form.featured_image_url || ""} onChange={(e) => setForm({ ...form, featured_image_url: e.target.value })} placeholder="https://..." /></div></div></AdminPanel><AdminPanel title="Body"><Textarea rows={20} value={form.body_markdown || ""} onChange={(e) => setForm({ ...form, body_markdown: e.target.value })} className="font-mono text-sm" /></AdminPanel><AdminPanel title="SEO and status"><div className="grid gap-4 md:grid-cols-2"><Input value={form.seo_title || ""} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} placeholder="SEO title" /><Input value={form.seo_description || ""} onChange={(e) => setForm({ ...form, seo_description: e.target.value })} placeholder="SEO description" /><label className="flex items-center gap-2"><input type="checkbox" checked={!!form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} /> Featured guide</label></div></AdminPanel><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => saveGuide("draft")} disabled={saving}>Save draft</Button><Button onClick={() => saveGuide("published")} disabled={saving}>Publish</Button>{form.status === "published" ? <Button variant="outline" onClick={() => saveGuide("draft")} disabled={saving}>Unpublish</Button> : null}{mode === "edit" ? <Button variant="outline" onClick={() => saveGuide("archived")} disabled={saving}>Archive</Button> : null}</div></div> : null}
    </div>
  );
}

function ContentLibraryPage() {
  const supabase = createSupabaseBrowserClient();
  const [files, setFiles] = useState<Row[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [folder, setFolder] = useState("");
  const [search, setSearch] = useState("");
  const [uploadFolder, setUploadFolder] = useState("competitions/general");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fmtBytes = (n: number | null | undefined) => {
    if (!n && n !== 0) return "-";
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(2)} MB`;
  };

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    try {
      const { data: rootList, error: rootError } = await supabase.storage.from("competition-images").list("competitions", { limit: 200, sortBy: { column: "name", order: "asc" } });
      if (rootError) throw rootError;
      const subFolders = (rootList || []).filter((item: Row) => item && item.id == null && item.name).map((item: Row) => item.name);
      const nextFolders = ["competitions", ...subFolders.map((name: string) => `competitions/${name}`)];
      setFolders(nextFolders);
      const prefixes = folder ? [folder] : nextFolders;
      const all: Row[] = [];
      for (const prefix of prefixes) {
        const { data, error: listError } = await supabase.storage.from("competition-images").list(prefix, { limit: 200, sortBy: { column: "created_at", order: "desc" } });
        if (listError) throw listError;
        for (const item of ((data as Row[]) || [])) {
          if (!item || item.id == null) continue;
          const path = `${prefix}/${item.name}`;
          const { data: pub } = supabase.storage.from("competition-images").getPublicUrl(path);
          all.push({ path, name: item.name, folder: prefix, size: item.metadata?.size ?? null, created_at: item.created_at, updated_at: item.updated_at, url: pub.publicUrl });
        }
      }
      setFiles(all);
    } catch (nextError) {
      const msg = nextError instanceof Error ? nextError.message : "Failed to load storage.";
      setError(msg.toLowerCase().includes("policy") || msg.toLowerCase().includes("permission") || msg.toLowerCase().includes("rls") ? "Storage policy blocked listing. Admin RLS on the competition-images bucket may need updating." : msg);
    } finally {
      setLoading(false);
    }
  }, [folder, supabase]);

  useEffect(() => { load(); }, [load]);
  const filtered = files.filter((file) => !search.trim() || String(file.path).toLowerCase().includes(search.toLowerCase()));

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setSuccess("URL copied.");
    } catch {
      setError("Copy failed.");
    }
  }

  async function deleteFile(path: string) {
    if (!supabase || !path.startsWith("competitions/")) return;
    if (!window.confirm(`Permanently delete this file?\n\n${path}`)) return;
    const { error: removeError } = await supabase.storage.from("competition-images").remove([path]);
    if (removeError) setError(removeError.message);
    else {
      setSuccess("Deleted.");
      await load();
    }
  }

  return (
    <div>
      <AdminPageHeader eyebrow="Media" title="Content library" subtitle="Browse, upload and manage images stored in the competition-images bucket." icon={<Library className="h-5 w-5" />} actions={<Button variant="outline" onClick={load} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Refresh</Button>} />
      {error ? <div className="mb-4 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">{error}</div> : null}
      {success ? <div className="mb-4 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-primary">{success}</div> : null}
      <AdminPanel title="Upload" className="mb-5"><div className="grid gap-3 md:grid-cols-[1fr_2fr]"><div className="space-y-2"><FieldLabel label="Target folder" help="Must start with competitions/." /><Input value={uploadFolder} onChange={(e) => setUploadFolder(e.target.value)} /></div><AdminImageUploader folder={uploadFolder.startsWith("competitions/") ? uploadFolder : "competitions/general"} multiple onUploaded={() => load()} onSuccess={setSuccess} onError={setError} /></div></AdminPanel>
      <AdminPanel title="Files">
        <div className="mb-4 flex flex-col gap-2 md:flex-row"><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search filename or path" /><select className="h-10 rounded-md border border-white/10 bg-[#111827] px-3 text-sm text-white" value={folder} onChange={(e) => setFolder(e.target.value)}><option value="">All folders</option>{folders.map((f) => <option key={f} value={f}>{f}</option>)}</select></div>
        <LoadingOrError loading={loading} error={null} />
        {filtered.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{filtered.map((file) => <div key={file.path} className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]"><div className="aspect-square bg-black"><img src={file.url} alt={file.name} className="h-full w-full object-cover" /></div><div className="space-y-1 p-3"><div className="truncate text-xs text-white/85" title={file.path}>{file.name}</div><div className="truncate text-[11px] text-white/50">{file.folder}</div><div className="text-[11px] text-white/50">{fmtBytes(file.size)}</div><div className="flex gap-1 pt-1"><Button size="sm" variant="outline" onClick={() => copyUrl(file.url)}><Copy className="h-3.5 w-3.5" /></Button><Button size="sm" variant="outline" className="text-destructive" onClick={() => deleteFile(file.path)}><Trash2 className="h-3.5 w-3.5" /></Button></div></div></div>)}</div> : !loading ? <EmptyRows rows={filtered} label="files" /> : null}
      </AdminPanel>
    </div>
  );
}

function SeoCentrePage() {
  const supabase = createSupabaseBrowserClient();
  const site = "https://topdrawcompetitions.co.uk";
  const indexNowKey = "27c2bacec30a4cb6b20065d2bcfcf12c";
  const staticPaths = useMemo(() => [
    "/",
    "/competitions",
    "/build-a-bundle",
    "/winners",
    "/past-competitions",
    "/free-entry",
    "/faqs",
    "/contact",
    "/responsible-play",
    "/terms-and-conditions",
    "/privacy-policy",
    "/cookie-policy",
  ], []);
  const googlePriorityPaths = useMemo(() => ["/", "/competitions", "/build-a-bundle", "/free-entry", "/faqs", "/winners", "/past-competitions", "/contact"], []);
  const [competitions, setCompetitions] = useState<Row[]>([]);
  const [selectedStatic, setSelectedStatic] = useState<Set<string>>(() => new Set(staticPaths));
  const [selectedCompetitions, setSelectedCompetitions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const fullUrl = useCallback((path: string) => path === "/" ? `${site}/` : `${site}${path}`, []);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const { data, error: nextError } = await supabase
        .from("competitions")
        .select("slug,title,status,updated_at")
        .not("slug", "is", null)
        .is("archived_at", null)
        .in("status", ["live", "sold_out", "closed", "drawn"])
        .order("updated_at", { ascending: false })
        .limit(500);
      if (cancelled) return;
      const rows = ((data as Row[]) ?? []).filter((row) => row.slug);
      setCompetitions(rows);
      setSelectedCompetitions(new Set(rows.map((row) => String(row.slug))));
      setError(nextError?.message ?? null);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [supabase]);

  const selectedUrls = useMemo(() => [
    ...Array.from(selectedStatic).map(fullUrl),
    ...Array.from(selectedCompetitions).map((slug) => `${site}/competitions/${slug}`),
  ], [fullUrl, selectedCompetitions, selectedStatic]);
  const googleList = useMemo(() => [
    ...googlePriorityPaths.map(fullUrl),
    ...competitions.map((competition) => `${site}/competitions/${competition.slug}`),
  ].join("\n"), [competitions, fullUrl, googlePriorityPaths]);

  function toggleSet(setter: (value: Set<string>) => void, current: Set<string>, value: string) {
    const next = new Set(current);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  }

  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setError("Copy failed. Browser clipboard access was not available.");
    }
  }

  return (
    <div>
      <AdminPageHeader eyebrow="Indexing" title="SEO Centre" subtitle="Vite's SEO centre submits selected URLs to IndexNow. Next can safely review and copy the same URL sets, but submission is blocked until the matching API route exists." icon={<Search className="h-5 w-5" />} />
      <IncompleteNotice>IndexNow submission is intentionally disabled in Next because the Vite tool posts to <code>/api/indexnow-submit</code> and this Next app does not currently expose that route. No email, SEO or indexing action is faked.</IncompleteNotice>
      <LoadingOrError loading={loading} error={error} />
      {copied ? <div className="my-4 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">{copied} copied.</div> : null}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <AdminPanel title="Sitemap and IndexNow key" description="Copied from the Vite SEO centre constants.">
          <div className="space-y-3 text-sm text-white/75">
            <a className="inline-flex items-center gap-2 break-all text-primary" href={`${site}/sitemap.xml`} target="_blank" rel="noreferrer">{site}/sitemap.xml <ExternalLink className="h-3.5 w-3.5" /></a>
            <a className="inline-flex items-center gap-2 break-all text-primary" href={`${site}/${indexNowKey}.txt`} target="_blank" rel="noreferrer">{site}/{indexNowKey}.txt <ExternalLink className="h-3.5 w-3.5" /></a>
            <p>Google indexing remains sitemap/Search Console driven. Vite does not use the Google Indexing API for these public pages.</p>
          </div>
        </AdminPanel>
        <AdminPanel title="Selected URLs" description={`${selectedUrls.length} URL(s) selected for review.`} actions={<Button variant="outline" onClick={() => copyText(selectedUrls.join("\n"), "Selected URLs")}><Copy className="h-4 w-4" /> Copy URLs</Button>}>
          <div className="max-h-52 overflow-auto rounded-lg border border-white/10 bg-black/20 p-3 font-mono text-xs text-white/70">
            {selectedUrls.length ? selectedUrls.map((url) => <div key={url} className="break-all">{url}</div>) : "No URLs selected."}
          </div>
        </AdminPanel>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <AdminPanel title="Static public URLs" description="Matches Vite's static IndexNow list." actions={<><Button size="sm" variant="outline" onClick={() => setSelectedStatic(new Set(staticPaths))}>Select all</Button><Button size="sm" variant="outline" onClick={() => setSelectedStatic(new Set())}>Clear</Button></>}>
          <div className="grid gap-2 sm:grid-cols-2">
            {staticPaths.map((path) => (
              <label key={path} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-2 text-sm text-white/85">
                <input type="checkbox" checked={selectedStatic.has(path)} onChange={() => toggleSet(setSelectedStatic, selectedStatic, path)} className="h-4 w-4 accent-primary" />
                <span className="font-mono">{path}</span>
              </label>
            ))}
          </div>
        </AdminPanel>
        <AdminPanel title="Live competition URLs" description="Vite includes live, sold out, closed and drawn competitions that are not archived." actions={<><Button size="sm" variant="outline" onClick={() => setSelectedCompetitions(new Set(competitions.map((row) => String(row.slug))))}>Select all</Button><Button size="sm" variant="outline" onClick={() => setSelectedCompetitions(new Set())}>Clear</Button></>}>
          <div className="max-h-80 space-y-2 overflow-auto">
            {competitions.map((competition) => (
              <label key={competition.slug} className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-2 text-sm text-white/85">
                <input type="checkbox" checked={selectedCompetitions.has(String(competition.slug))} onChange={() => toggleSet(setSelectedCompetitions, selectedCompetitions, String(competition.slug))} className="mt-0.5 h-4 w-4 accent-primary" />
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-white">{competition.title || competition.slug}</span>
                  <span className="block break-all font-mono text-xs text-white/55">/competitions/{competition.slug}</span>
                </span>
              </label>
            ))}
            {!loading && competitions.length === 0 ? <p className="text-sm text-white/60">No eligible competition URLs found.</p> : null}
          </div>
        </AdminPanel>
      </div>
      <AdminPanel className="mt-4" title="Google priority list" description="Copied from the Vite SEO centre helper list." actions={<Button variant="outline" onClick={() => copyText(googleList, "Google priority list")}><Copy className="h-4 w-4" /> Copy list</Button>}>
        <textarea readOnly value={googleList} className="min-h-48 w-full rounded-lg border border-white/10 bg-black/20 p-3 font-mono text-xs text-white/75 outline-none" />
      </AdminPanel>
    </div>
  );
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
