"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, Send, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminPanel, AdminPageHeader, AdminTable, AdminTD, AdminTH, AdminTR } from "@/components/admin/AdminKit";
import { StatusBadge } from "@/components/StatusBadge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { formatMoney } from "@/lib/format";
import { showDevTools } from "@/lib/devTools";

type PaymentRow = {
  id: string;
  user_id: string | null;
  competition_id: string | null;
  stripe_checkout_session_id: string | null;
  amount: number;
  quantity: number;
  status: string;
  created_at: string;
  payment_failure_reason: string | null;
  subtotal_amount: number | null;
  discount_amount: number | null;
  discount_percentage: number | null;
  pricing_snapshot: Record<string, unknown> | null;
};

type RpcResult = {
  error?: unknown;
  ticket_numbers?: number[];
};

function fmtDate(value: string) {
  return new Date(value).toLocaleString();
}

function devEnabledHint() {
  return (
    <span className="text-warning">
      This route is intentionally dev-only and should be disabled in production.
    </span>
  );
}

function safeError(err: unknown) {
  return err instanceof Error ? err.message : String(err || "Request failed");
}

export function AdminPaymentsDevPage() {
  const supabase = createSupabaseBrowserClient();
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [comps, setComps] = useState<Record<string, string>>({});
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [tickets, setTickets] = useState<Record<string, number[]>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const allocFailed = useMemo(() => rows.filter((row) => row.status === "allocation_failed"), [rows]);

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(tick);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: paymentError } = await supabase
      .from("payments")
      .select("id,user_id,competition_id,stripe_checkout_session_id,amount,quantity,status,created_at,payment_failure_reason,subtotal_amount,discount_amount,discount_percentage,pricing_snapshot")
      .order("created_at", { ascending: false })
      .limit(100);

    if (paymentError) {
      setError(paymentError.message);
      setRows([]);
      setLoading(false);
      return;
    }

    const list = (data as PaymentRow[] | null) ?? [];
    setRows(list);

    const compIds = Array.from(new Set(list.map((r) => r.competition_id).filter(Boolean) as string[]));
    const userIds = Array.from(new Set(list.map((r) => r.user_id).filter(Boolean) as string[]));
    const paymentIds = list.map((r) => r.id);

    if (compIds.length) {
      const { data: compRows, error: compError } = await supabase
        .from("competitions")
        .select("id,title")
        .in("id", compIds);
      if (compError) console.error("[admin-payments-dev] competitions hydrate failed", compError);
      const map: Record<string, string> = {};
      for (const row of ((compRows as Array<{ id: string; title: string }> | null) ?? [])) {
        map[row.id] = row.title;
      }
      setComps(map);
    } else {
      setComps({});
    }

    if (userIds.length) {
      const { data: userRows, error: userError } = await supabase
        .from("profiles")
        .select("id,email")
        .in("id", userIds);
      if (userError) console.error("[admin-payments-dev] users hydrate failed", userError);
      const map: Record<string, string> = {};
      for (const row of ((userRows as Array<{ id: string; email: string }> | null) ?? [])) {
        if (row.email) map[row.id] = row.email;
      }
      setEmails(map);
    } else {
      setEmails({});
    }

    if (paymentIds.length) {
      const { data: entryRows, error: entryError } = await supabase
        .from("entries")
        .select("payment_id,ticket_number")
        .in("payment_id", paymentIds);
      if (entryError) console.error("[admin-payments-dev] entries hydrate failed", entryError);
      const map: Record<string, number[]> = {};
      for (const row of ((entryRows as Array<{ payment_id: string | null; ticket_number: number }> | null) ?? [])) {
        if (!row.payment_id) continue;
        (map[row.payment_id] ||= []).push(row.ticket_number);
      }
      for (const id of Object.keys(map)) map[id].sort((a, b) => a - b);
      setTickets(map);
    } else {
      setTickets({});
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (!showDevTools) return;
    void load();
  }, [load]);

  async function markPaid(id: string) {
    if (!supabase) return;
    setBusy(id);
    setError(null);
    setSuccess(null);
    const result = await supabase.functions.invoke("dev-mark-payment-succeeded", {
      body: { payment_id: id },
    });
    setBusy(null);
    if (result.error) {
      setError(safeError(result.error));
      return;
    }
    const payload = (result.data as RpcResult | null) ?? {};
    const allocated = payload.ticket_numbers?.length ? `${payload.ticket_numbers.length} tickets allocated` : "Payment marked succeeded";
    setSuccess(allocated);
    await load();
  }

  async function cancelPayment(id: string) {
    if (!window.confirm("This will mark the pending checkout as cancelled. No ticket will be issued. Continue?")) return;
    if (!supabase) return;
    setBusy(id);
    setError(null);
    setSuccess(null);
    const result = await supabase.functions.invoke("admin-cancel-payment", {
      body: { payment_id: id },
    });
    setBusy(null);
    if (result.error) {
      setError(safeError(result.error));
      return;
    }
    if ((result.data as RpcResult | null)?.error) {
      setError(String((result.data as RpcResult).error));
      await load();
      return;
    }
    setSuccess("Payment marked cancelled. No ticket allocated.");
    await load();
  }

  function pendingAgeLabel(createdAt: string): string {
    const ageMs = now - new Date(createdAt).getTime();
    const min = ageMs / 60000;
    if (min >= 60 * 24) return "Stale pending checkout";
    if (min >= 30) return "Possibly abandoned";
    return "Awaiting payment";
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Developer"
        title="Payments (dev)"
        subtitle="Dev-only payment review tool, mirroring Vite's dedicated testing admin path."
        actions={<Button variant="ghost" onClick={() => void load()} disabled={busy !== null || loading}>{loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Reload</Button>}
      />

      <AdminPanel description="Do not use on production data sets. This is a developer bypass and inspection helper only.">
        <p className="text-xs">{devEnabledHint()}</p>
      </AdminPanel>

      {error ? <div className="mb-4 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">{error}</div> : null}
      {success ? <div className="mb-4 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">{success}</div> : null}

      {!showDevTools ? (
        <AdminPanel className="mt-4" title="Unavailable" description="Enable DEV tools in environment to access this route." />
      ) : allocFailed.length > 0 ? (
        <AdminPanel tone="warning" className="mb-6" title="Allocation failures" description={`${allocFailed.length} payment${allocFailed.length === 1 ? "" : "s"} need manual review.`}>
          <ul className="mt-3 space-y-2 text-sm">
            {allocFailed.map((row) => (
              <li key={row.id} className="rounded-md border border-warning/30 bg-warning/10 p-2">
                <div className="font-mono text-white/80 text-xs">payment {row.id}</div>
                <div className="text-xs text-white/65">session {row.stripe_checkout_session_id || "n/a"}</div>
                <div className="text-xs text-white/65 mt-1">{row.payment_failure_reason || "No failure reason stored"}</div>
              </li>
            ))}
          </ul>
        </AdminPanel>
      ) : null}

      {loading ? (
        <div className="text-sm td-soft">Loading payments…</div>
      ) : !rows.length ? (
        <AdminPanel className="mt-4" title="No rows" description="No payments are currently available in the dev queue." />
      ) : (
        <AdminPanel className="mt-4 p-0" title="Recent payments" bodyClassName="p-0">
          <AdminTable minWidth={1320}>
            <thead className="text-xs uppercase tracking-wider">
              <tr>
                <AdminTH>Status</AdminTH>
                <AdminTH>Competition</AdminTH>
                <AdminTH>User</AdminTH>
                <AdminTH align="right">Qty</AdminTH>
                <AdminTH>Pricing</AdminTH>
                <AdminTH>Tickets</AdminTH>
                <AdminTH>Failure reason</AdminTH>
                <AdminTH>Payment session</AdminTH>
                <AdminTH>Date</AdminTH>
                <AdminTH align="right">Actions</AdminTH>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const warn = row.status === "allocation_failed";
                const pending = row.status === "pending";
                const ticketsForRow = tickets[row.id] || [];
                return (
                  <AdminTR key={row.id}>
                    <AdminTD>
                      <StatusBadge status={row.status} />
                      {pending ? <div className="mt-1 text-xs text-white/65">{pendingAgeLabel(row.created_at)}</div> : null}
                    </AdminTD>
                    <AdminTD>{row.competition_id ? (comps[row.competition_id] ?? "Competition unavailable") : "—"}</AdminTD>
                    <AdminTD>{row.user_id ? emails[row.user_id] || row.user_id.slice(0, 8) : "—"}</AdminTD>
                    <AdminTD align="right">{row.quantity}</AdminTD>
                    <AdminTD>
                      <div className="font-mono font-bold">{formatMoney(Number(row.amount || 0))}</div>
                      <div className="text-xs text-white/55">
                        {row.discount_amount && Number(row.discount_amount) > 0
                          ? `subtotal ${formatMoney(Number(row.subtotal_amount || 0))} · -${formatMoney(Number(row.discount_amount || 0))} (${Number(row.discount_percentage || 0)}%)`
                          : "no discount"}
                      </div>
                    </AdminTD>
                    <AdminTD>
                      {ticketsForRow.length ? (
                        <span className="text-xs">{ticketsForRow.length} · {ticketsForRow.slice(0, 8).map((ticket) => `#${ticket}`).join(", ")}{ticketsForRow.length > 8 ? "…" : ""}</span>
                      ) : warn ? <span className="text-warning">none, allocation failed</span> : <span className="text-white/55">-</span>}
                    </AdminTD>
                    <AdminTD>
                      {row.payment_failure_reason ? <span className="text-xs text-warning">{row.payment_failure_reason}</span> : <span className="text-white/55">-</span>}
                    </AdminTD>
                    <AdminTD>
                      <span className="font-mono text-xs">{row.stripe_checkout_session_id ? row.stripe_checkout_session_id.slice(0, 8) : "-"}</span>
                    </AdminTD>
                    <AdminTD>{fmtDate(row.created_at)}</AdminTD>
                    <AdminTD align="right">
                      <div className="flex justify-end gap-2">
                        {pending ? (
                          <>
                            <Button size="sm" variant="outline" onClick={() => void markPaid(row.id)} disabled={busy === row.id}>
                              {busy === row.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Mark paid
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => void cancelPayment(row.id)} disabled={busy === row.id}>
                              {busy === row.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />} Cancel
                            </Button>
                          </>
                        ) : null}
                        {warn ? <AlertTriangle className="h-4 w-4 text-warning" /> : null}
                      </div>
                    </AdminTD>
                  </AdminTR>
                );
              })}
            </tbody>
          </AdminTable>
        </AdminPanel>
      )}
    </div>
  );
}
